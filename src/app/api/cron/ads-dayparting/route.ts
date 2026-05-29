// CRON dayparting Meta Ads.
// Para cada cuenta en ads_dayparting_config.enabled=true:
//   · Si es la hora exacta de pause_at_hour (Europe/Madrid) → PAUSE todas las
//     campañas ACTIVE de la cuenta, registrando paused_by_us=true.
//   · Si es la hora exacta de resume_at_hour → UNPAUSE solo las que NOSOTROS
//     pausamos (paused_by_us=true), respetando lo que el agente paró a mano.
//
// Llamado por Vercel cron cada 30 min (UTC). Calculamos hora Madrid dentro
// para sobrevivir a DST CET ↔ CEST sin tocar el schedule.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

const API = "https://graph.facebook.com/v22.0";
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

function hourInTz(tz: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false });
  return Number(fmt.format(new Date()));
}

async function getToken(): Promise<string | null> {
  const { data } = await sb.from("meta_oauth_tokens")
    .select("access_token")
    .eq("id", "585cd670-bb87-453a-8929-723013269da2")
    .maybeSingle();
  return data?.access_token ?? null;
}

async function setCampaignStatus(cid: string, status: "ACTIVE" | "PAUSED", token: string): Promise<boolean> {
  const r = await fetch(`${API}/${cid}?access_token=${encodeURIComponent(token)}&status=${status}`, { method: "POST" });
  if (!r.ok) {
    const t = await r.text();
    console.error(`[dayparting] ${status} ${cid} failed: ${r.status} ${t.slice(0, 200)}`);
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "no_token" }, { status: 500 });

  const { data: cfgs } = await sb.from("ads_dayparting_config").select("*").eq("enabled", true);
  if (!cfgs || cfgs.length === 0) return NextResponse.json({ ok: true, accounts: 0, skipped: "no_enabled_accounts" });

  const out: Array<{ account: string; action: string; affected: number; errors: number }> = [];

  for (const cfg of cfgs) {
    const hour = hourInTz(cfg.timezone ?? "Europe/Madrid");
    const isPauseHour = hour === cfg.pause_at_hour;
    const isResumeHour = hour === cfg.resume_at_hour;
    if (!isPauseHour && !isResumeHour) {
      out.push({ account: cfg.account_name ?? cfg.fb_account_id, action: "skip", affected: 0, errors: 0 });
      continue;
    }

    if (isPauseHour) {
      // PAUSE todas las ACTIVE de la cuenta — pero solo registramos como "nuestras"
      // las que estaban ACTIVE en el momento del PATCH (las que el agente ya tenía
      // PAUSED por su cuenta NO las marcamos)
      const r = await fetch(`${API}/act_${cfg.fb_account_id}/campaigns?fields=id,name,effective_status&limit=500&effective_status=%5B%22ACTIVE%22%5D`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      const actives: Array<{ id: string; name: string }> = j.data ?? [];
      let affected = 0, errors = 0;
      for (const c of actives) {
        const ok = await setCampaignStatus(c.id, "PAUSED", token);
        if (ok) {
          affected += 1;
          await sb.from("ads_dayparting_state").upsert({
            campaign_id: c.id, fb_account_id: cfg.fb_account_id,
            paused_by_us: true, paused_at: new Date().toISOString(),
            last_action: "pause", last_action_at: new Date().toISOString(),
            notes: `dayparting auto-pause @ ${cfg.pause_at_hour}h ${cfg.timezone}`,
          });
        } else errors += 1;
      }
      out.push({ account: cfg.account_name ?? cfg.fb_account_id, action: "pause", affected, errors });
    }

    if (isResumeHour) {
      // UNPAUSE solo las que NOSOTROS pausamos
      const { data: ours } = await sb.from("ads_dayparting_state")
        .select("campaign_id")
        .eq("fb_account_id", cfg.fb_account_id)
        .eq("paused_by_us", true);
      let affected = 0, errors = 0;
      for (const row of ours ?? []) {
        const ok = await setCampaignStatus(row.campaign_id, "ACTIVE", token);
        if (ok) {
          affected += 1;
          await sb.from("ads_dayparting_state").update({
            paused_by_us: false, paused_at: null,
            last_action: "resume", last_action_at: new Date().toISOString(),
          }).eq("campaign_id", row.campaign_id);
        } else errors += 1;
      }
      out.push({ account: cfg.account_name ?? cfg.fb_account_id, action: "resume", affected, errors });
    }
  }

  return NextResponse.json({ ok: true, results: out, generated_at: new Date().toISOString() });
}
