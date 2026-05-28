// CRON: sube budget +15% a campañas WINNER cada día a las 05:00 Europe/Madrid.
// Reglas:
//   - WINNER = campañas con purchases >=3 ayer Y CPA <= €40
//   - Excluye las que tienen <€20 spend ayer (datos insuficientes)
//   - Excluye campañas ACTIVE <48h (todavía en learning)
//   - Cap absoluto €500/día por campaña
//   - Aplica a TODAS las cuentas Aux + MS 3.0 (lee meta_ad_accounts)
//   - Envía email resumen a CEO + CTO

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/emails/send";
import { emailLayout } from "@/lib/emails/layout";

const sb = createClient(process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!, process.env.BLOG_SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });
const API = "https://graph.facebook.com/v22.0";
const PURPLE = "#6A178C";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Reglas
const BUMP_PCT = 0.15;             // +15%
const CAP_DAILY_BUDGET = 50000;    // €500/día (cents)
const MIN_SPEND_YESTERDAY = 20;    // €20 mínimo para considerar señal válida
const MIN_PURCHASES = 3;           // >=3 ventas ayer
const MAX_CPA = 40;                // CPA <= €40
const MIN_AGE_HOURS = 48;          // campañas con <48h vida → skip (learning phase)

const NOTIFY_EMAILS = [
  "ceo@example.com", // CEO
  "cto@example.com",     // CTO
];

type AccountRow = { fb_account_id: string; name: string; access_token: string };

export async function GET(req: NextRequest) {
  // Auth: header secret o vercel cron user-agent
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  const ua = req.headers.get("user-agent") ?? "";
  const isVercelCron = ua.includes("vercel-cron") || ua.toLowerCase().includes("vercel");
  if (!isVercelCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Cargar cuentas activas
  const { data: accounts, error } = await sb
    .from("meta_ad_accounts")
    .select("fb_account_id, name, token_id, meta_oauth_tokens!inner(access_token)")
    .eq("is_active", true);
  if (error || !accounts) return NextResponse.json({ error: error?.message ?? "no_accounts" }, { status: 500 });
  const accountsList: AccountRow[] = (accounts as unknown as Array<{ fb_account_id: string; name: string; meta_oauth_tokens: { access_token: string } }>)
    .map((a) => ({ fb_account_id: a.fb_account_id, name: a.name, access_token: a.meta_oauth_tokens.access_token }));

  // Rango: ayer en Europe/Madrid
  const now = new Date();
  // hace 24h en TZ Madrid (approx — el cron corre a 05:00 Madrid, ayer es 00:00–23:59 del día anterior)
  const yesterday = new Date(now.getTime() - 26 * 60 * 60 * 1000);
  const since = yesterday.toISOString().slice(0, 10);
  const until = since;

  const results: Array<{
    account: string;
    campaign_id: string;
    campaign_name: string;
    spend: number;
    purchases: number;
    cpa: number;
    old_budget: number;
    new_budget: number;
    action: "bumped" | "skip_no_data" | "skip_low_cpa" | "skip_cap" | "skip_young" | "skip_no_purchase" | "error";
    error?: string;
  }> = [];

  for (const acct of accountsList) {
    try {
      // Pull campañas activas con insights ayer
      const insightsUrl = `${API}/act_${acct.fb_account_id}/insights?` + new URLSearchParams({
        fields: "campaign_id,campaign_name,spend,actions",
        level: "campaign",
        time_range: JSON.stringify({ since, until }),
        filtering: JSON.stringify([{ field: "campaign.effective_status", operator: "IN", value: ["ACTIVE"] }]),
        limit: "100",
        access_token: acct.access_token,
      });
      const insightsRes = await fetch(insightsUrl);
      if (!insightsRes.ok) {
        results.push({ account: acct.name, campaign_id: "", campaign_name: "(insights fetch failed)", spend: 0, purchases: 0, cpa: 0, old_budget: 0, new_budget: 0, action: "error", error: `HTTP ${insightsRes.status}` });
        continue;
      }
      const insights = (await insightsRes.json()).data ?? [];

      for (const ins of insights) {
        const campId = ins.campaign_id as string;
        const campName = ins.campaign_name as string;
        const spend = Number(ins.spend ?? 0);
        const acts: { action_type: string; value: string }[] = ins.actions ?? [];
        const purchases = acts
          .filter((a) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase")
          .reduce((sum, a) => sum + Number(a.value), 0);

        // Reglas
        if (spend < MIN_SPEND_YESTERDAY) {
          results.push({ account: acct.name, campaign_id: campId, campaign_name: campName, spend, purchases, cpa: 0, old_budget: 0, new_budget: 0, action: "skip_no_data" });
          continue;
        }
        if (purchases < MIN_PURCHASES) {
          results.push({ account: acct.name, campaign_id: campId, campaign_name: campName, spend, purchases, cpa: 0, old_budget: 0, new_budget: 0, action: "skip_no_purchase" });
          continue;
        }
        const cpa = spend / purchases;
        if (cpa > MAX_CPA) {
          results.push({ account: acct.name, campaign_id: campId, campaign_name: campName, spend, purchases, cpa, old_budget: 0, new_budget: 0, action: "skip_low_cpa" });
          continue;
        }

        // Leer budget actual + age
        const campUrl = `${API}/${campId}?fields=daily_budget,created_time&access_token=${acct.access_token}`;
        const campRes = await fetch(campUrl);
        if (!campRes.ok) {
          results.push({ account: acct.name, campaign_id: campId, campaign_name: campName, spend, purchases, cpa, old_budget: 0, new_budget: 0, action: "error", error: `campaign fetch ${campRes.status}` });
          continue;
        }
        const camp = await campRes.json();
        const oldBudget = Number(camp.daily_budget ?? 0); // en cents

        // Edad
        const ageHours = (Date.now() - new Date(camp.created_time).getTime()) / 3_600_000;
        if (ageHours < MIN_AGE_HOURS) {
          results.push({ account: acct.name, campaign_id: campId, campaign_name: campName, spend, purchases, cpa, old_budget: oldBudget / 100, new_budget: oldBudget / 100, action: "skip_young" });
          continue;
        }

        // Calcular nuevo budget
        let newBudget = Math.round(oldBudget * (1 + BUMP_PCT));
        let capped = false;
        if (newBudget >= CAP_DAILY_BUDGET) { newBudget = CAP_DAILY_BUDGET; capped = true; }
        if (oldBudget >= CAP_DAILY_BUDGET) {
          // Ya está en cap → no tocar
          results.push({ account: acct.name, campaign_id: campId, campaign_name: campName, spend, purchases, cpa, old_budget: oldBudget / 100, new_budget: oldBudget / 100, action: "skip_cap" });
          continue;
        }
        if (oldBudget <= 0) {
          // Campaign con CBO/ABO en adset — saltar (no manejamos adset budgets aquí)
          results.push({ account: acct.name, campaign_id: campId, campaign_name: campName, spend, purchases, cpa, old_budget: 0, new_budget: 0, action: "skip_no_data", error: "no campaign-level daily_budget (ABO)" });
          continue;
        }

        // PATCH
        const patchRes = await fetch(`${API}/${campId}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ daily_budget: String(newBudget), access_token: acct.access_token }),
        });
        if (!patchRes.ok) {
          results.push({ account: acct.name, campaign_id: campId, campaign_name: campName, spend, purchases, cpa, old_budget: oldBudget / 100, new_budget: newBudget / 100, action: "error", error: `patch ${patchRes.status}: ${(await patchRes.text()).slice(0, 200)}` });
          continue;
        }
        results.push({ account: acct.name, campaign_id: campId, campaign_name: campName, spend, purchases, cpa, old_budget: oldBudget / 100, new_budget: newBudget / 100, action: capped ? "skip_cap" : "bumped" });
      }
    } catch (e) {
      results.push({ account: acct.name, campaign_id: "", campaign_name: "(account error)", spend: 0, purchases: 0, cpa: 0, old_budget: 0, new_budget: 0, action: "error", error: e instanceof Error ? e.message : String(e) });
    }
  }

  // Email resumen
  const bumped = results.filter((r) => r.action === "bumped");
  const skipped = results.filter((r) => r.action !== "bumped" && r.action !== "error");
  const errors = results.filter((r) => r.action === "error");
  const totalAddedDaily = bumped.reduce((s, r) => s + (r.new_budget - r.old_budget), 0);

  const rows = bumped.map((r) => `<tr><td>${r.account}</td><td>${escapeHtml(r.campaign_name)}</td><td>€${r.spend.toFixed(0)}</td><td>${r.purchases}</td><td>€${r.cpa.toFixed(0)}</td><td>€${r.old_budget.toFixed(0)} → <strong>€${r.new_budget.toFixed(0)}</strong></td></tr>`).join("");
  const errorsHtml = errors.length > 0
    ? `<h3 style="color:#dc2626;margin-top:18px;">⚠️ Errores (${errors.length})</h3><ul style="font-size:12px;">${errors.map((e) => `<li>${escapeHtml(e.campaign_name)} (${escapeHtml(e.account)}): ${escapeHtml(e.error ?? "")}</li>`).join("")}</ul>`
    : "";

  const content = `
    <p style="margin:0 0 16px;font-size:15px;color:#1a0a1f;">Cron de escalado automático ejecutado a las 05:00 Madrid del ${new Date().toLocaleDateString("es-ES")}.</p>
    <div style="padding:14px;background:#faf7fc;border-left:3px solid ${PURPLE};border-radius:8px;margin:12px 0;">
      <strong style="color:${PURPLE};">${bumped.length} campañas subidas +15%</strong> · <strong style="color:#16a34a;">+€${totalAddedDaily.toFixed(0)}/día total</strong>
      <br/><span style="font-size:12px;color:#666;">${skipped.length} sin cambios (sin datos / sin compras / CPA alto / en cap) · ${errors.length} errores</span>
    </div>
    ${bumped.length > 0 ? `
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:14px;">
      <thead><tr style="background:#f1f5f9;"><th style="padding:8px;text-align:left;">Cuenta</th><th style="padding:8px;text-align:left;">Campaña</th><th style="padding:8px;">€ayer</th><th>P</th><th>CPA</th><th>Budget</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ` : `<p style="font-size:13px;color:#666;">Ninguna campaña cumplió las reglas (CPA≤€40 + ≥3 ventas + ≥€20 spend + ≥48h vida).</p>`}
    ${errorsHtml}
    <p style="margin-top:18px;font-size:11px;color:#888;">Reglas: +15% si CPA≤€40 y P≥3 ayer · cap €500/d · skip si campaña <48h · skip si ABO (budget en adset).</p>
  `;
  await Promise.allSettled(NOTIFY_EMAILS.map((to) => sendEmail({
    to,
    subject: `🚀 Meta budget bump · ${bumped.length} campañas · +€${totalAddedDaily.toFixed(0)}/d`,
    html: emailLayout({ title: "Cron Meta · escalado automático winners", preheader: `${bumped.length} subidas, ${skipped.length} skipped`, content }),
  })));

  return NextResponse.json({
    ran_at: new Date().toISOString(),
    summary: { bumped: bumped.length, skipped: skipped.length, errors: errors.length, total_added_per_day: totalAddedDaily },
    results,
  });
}

function escapeHtml(s: string): string { return (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)); }
