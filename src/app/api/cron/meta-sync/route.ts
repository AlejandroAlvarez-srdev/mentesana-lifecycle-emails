// Cron de sincronización Meta Ads. Itera todas las cuentas activas
// (meta_ad_accounts.is_active=true) y trae los insights de los últimos
// 7 días a nivel anuncio con increment diario, upsert idempotente sobre
// (fb_ad_id, date_start). Si una cuenta falla (token caducado, etc.) NO
// rompe el resto — registra el fallo y sigue.
//
// Auth:
//   - Bearer CRON_SECRET (Vercel cron lo añade)
//   - O cookie ms_admin (para disparar manual desde el navegador del CTO)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin-auth";
import { META_GRAPH_VERSION } from "@/lib/meta-ads";

const sb = createClient(
  process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;

const FIELDS = "ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,impressions,reach,clicks,spend,cpc,cpm,ctr,frequency,actions,action_values,cost_per_action_type,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions,video_play_actions,video_continuous_2_sec_watched_actions";

function actionValue(arr: { action_type?: string; value?: string | number }[] | undefined, type: string): number {
  if (!Array.isArray(arr)) return 0;
  const r = arr.find(a => a.action_type === type);
  return r ? Number(r.value ?? 0) : 0;
}

async function syncOneAccount(acc: { id: string; fb_account_id: string; name: string }, token: string, datePreset: string) {
  const out: any[] = [];
  let url: string | null = `https://graph.facebook.com/${META_GRAPH_VERSION}/act_${acc.fb_account_id.replace(/^act_/, "")}/insights?level=ad&date_preset=${datePreset}&time_increment=1&fields=${FIELDS}&limit=500&access_token=${encodeURIComponent(token)}`;
  let pages = 0;
  let err: string | null = null;
  while (url && pages < 10) {
    try {
      const r: Response = await fetch(url, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) { err = j?.error?.message ?? `HTTP ${r.status}`; break; }
      if (Array.isArray(j.data)) out.push(...j.data);
      url = j.paging?.next ?? null;
      pages++;
    } catch (e: any) {
      err = String(e?.message ?? "fetch_error");
      break;
    }
  }
  if (err) return { account: acc.name, fb_account_id: acc.fb_account_id, ok: false, inserted: 0, error: err };

  let inserted = 0, errors = 0;
  for (const r of out) {
    try {
      const impressions = Number(r.impressions ?? 0);
      const spend = Number(r.spend ?? 0);
      const v2sec = actionValue(r.video_continuous_2_sec_watched_actions, "video_view");
      const vplay = actionValue(r.video_play_actions, "video_view");
      const stopMetric = v2sec > 0 ? v2sec : vplay;
      const thumbstop = impressions > 0 ? Math.round((stopMetric / impressions) * 100 * 100) / 100 : 0;
      const purchases = actionValue(r.actions, "purchase") || actionValue(r.actions, "offsite_conversion.fb_pixel_purchase") || actionValue(r.actions, "lead") || actionValue(r.actions, "complete_registration");
      const purchase_value = actionValue(r.action_values, "purchase") || actionValue(r.action_values, "offsite_conversion.fb_pixel_purchase");
      const cpaArr = (r.cost_per_action_type ?? []).find((x: { action_type?: string }) => x.action_type === "purchase" || x.action_type === "lead");
      const cost_per_result = cpaArr ? Number(cpaArr.value) : (purchases > 0 ? spend / purchases : null);
      const roas = spend > 0 && purchase_value > 0 ? Math.round((purchase_value / spend) * 1000) / 1000 : null;

      const upsertRes = await sb.from("meta_ad_insights").upsert({
        ad_account_id: acc.id,
        fb_account_id: acc.fb_account_id,
        fb_ad_id: r.ad_id,
        ad_name: r.ad_name,
        fb_adset_id: r.adset_id,
        adset_name: r.adset_name,
        fb_campaign_id: r.campaign_id,
        campaign_name: r.campaign_name,
        date_start: r.date_start,
        date_stop: r.date_stop,
        impressions,
        reach: Number(r.reach ?? 0),
        clicks: Number(r.clicks ?? 0),
        spend,
        cpc: Number(r.cpc ?? 0),
        cpm: Number(r.cpm ?? 0),
        ctr: Number(r.ctr ?? 0),
        frequency: Number(r.frequency ?? 0),
        thumbstop_rate: thumbstop,
        video_p25_watched: actionValue(r.video_p25_watched_actions, "video_view"),
        video_p50_watched: actionValue(r.video_p50_watched_actions, "video_view"),
        video_p75_watched: actionValue(r.video_p75_watched_actions, "video_view"),
        video_p100_watched: actionValue(r.video_p100_watched_actions, "video_view"),
        results: purchases,
        result_type: purchases > 0 ? "purchase_or_lead" : "purchase",
        cost_per_result,
        purchase_value,
        roas,
        raw_json: r,
        fetched_at: new Date().toISOString(),
      }, { onConflict: "fb_ad_id,date_start" });
      if (upsertRes.error) errors++; else inserted++;
    } catch {
      errors++;
    }
  }
  await sb.from("meta_ad_accounts").update({ last_synced_at: new Date().toISOString() }).eq("id", acc.id);
  return { account: acc.name, fb_account_id: acc.fb_account_id, ok: true, inserted, errors };
}

export async function GET(req: NextRequest) {
  const authHdr = req.headers.get("authorization") ?? "";
  const isCron = CRON_SECRET && authHdr === `Bearer ${CRON_SECRET}`;
  const isManual = await isAdmin(req);
  if (!isCron && !isManual) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  // Manual override: ?date_preset=last_30d (para rellenar gap inicial)
  const datePreset = url.searchParams.get("date_preset") ?? "last_7d";

  const { data: accounts } = await sb
    .from("meta_ad_accounts")
    .select("id, fb_account_id, name, meta_oauth_tokens(access_token)")
    .eq("is_active", true);

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ ok: true, message: "No hay cuentas activas", results: [] });
  }

  const results: Array<{ account: string; fb_account_id: string; ok: boolean; inserted: number; errors?: number; error?: string }> = [];
  for (const acc of accounts) {
    const token = (acc as any).meta_oauth_tokens?.access_token;
    if (!token) {
      results.push({ account: acc.name, fb_account_id: acc.fb_account_id, ok: false, inserted: 0, error: "no_token" });
      continue;
    }
    const r = await syncOneAccount(acc as any, token, datePreset);
    results.push(r);
  }

  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
  return NextResponse.json({ ok: true, date_preset: datePreset, accounts: results.length, total_inserted: totalInserted, results });
}
