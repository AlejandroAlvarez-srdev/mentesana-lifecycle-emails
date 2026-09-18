// Cron horario: revisa leads no compradores y envía el siguiente step de nurturing.
// 6 capas verificación: idempotencia step (UNIQUE log), purchased_diag=false, lead existe.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendStep } from "../../meta/leadgen-webhook/route";

const sb = createClient(process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!, process.env.BLOG_SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });
const CRON_SECRET = process.env.CRON_SECRET;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: templates } = await sb.from("meta_lead_templates").select("*").eq("active", true).order("step");
  if (!templates || templates.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  let totalSent = 0;
  for (const tpl of templates) {
    const step = Number(tpl.step);
    if (step === 1) continue; // step 1 lo manda el webhook al instante

    const cutoff = new Date(Date.now() - Number(tpl.send_after_minutes) * 60_000).toISOString();
    const { data: leads } = await sb.from("meta_leads")
      .select("id, email, full_name, que_buscas")
      .eq("purchased_diag", false)
      .not("email", "is", null)
      .lte("created_at", cutoff)
      .limit(200);
    if (!leads || leads.length === 0) continue;

    // FIX spam "haz tu test": el nurture invita a HACER el test. Si el lead YA lo
    // hizo (existe en diagnostico_tests, con o sin pago), NO se le puede pedir que
    // lo haga → dejaba de spamear "no has hecho el test" a quien sí lo había hecho.
    // (a los que hicieron el test y no pagaron los recoge el flujo lead_sin_compra).
    const didTest = new Set<string>();
    const leadEmails = leads.map((l) => l.email!).filter(Boolean);
    if (leadEmails.length) {
      const { data: dt } = await sb.from("diagnostico_tests").select("user_email").in("user_email", leadEmails);
      for (const d of (dt ?? []) as { user_email: string | null }[]) {
        if (d.user_email) didTest.add(String(d.user_email).toLowerCase().trim());
      }
    }

    for (const lead of leads) {
      // Ya hizo el test → no invitarle a hacerlo.
      if (lead.email && didTest.has(lead.email.toLowerCase().trim())) continue;
      // Ya enviado este step?
      const { data: existing } = await sb.from("meta_lead_nurture_log").select("id").eq("lead_id", lead.id).eq("step", step).maybeSingle();
      if (existing) continue;
      try {
        await sendStep(lead.id, lead.email!, lead.full_name ?? "", lead.que_buscas ?? "", tpl);
        totalSent++;
      } catch (e: any) {
        console.error(`[meta-lead-nurture] step ${step} lead ${lead.id}: ${e?.message}`);
      }
    }
  }

  // Cleanup: marcar como purchased los que ya tienen compra (cross-ref con diagnostico_tests por email)
  try {
    const { data: notPurchased } = await sb.from("meta_leads").select("id, email").eq("purchased_diag", false).not("email", "is", null).limit(500);
    if (notPurchased && notPurchased.length > 0) {
      const emails = notPurchased.map(l => l.email).filter(Boolean) as string[];
      const { data: bought } = await sb.from("diagnostico_tests").select("user_email, paid_at").in("user_email", emails).eq("paid", true);
      const boughtMap = new Map((bought ?? []).map((b: any) => [b.user_email?.toLowerCase(), b.paid_at]));
      const toUpdate = notPurchased.filter(l => boughtMap.has(l.email?.toLowerCase() ?? ""));
      for (const u of toUpdate) {
        await sb.from("meta_leads").update({ purchased_diag: true, purchased_at: boughtMap.get(u.email?.toLowerCase() ?? "") ?? new Date().toISOString() }).eq("id", u.id);
      }
    }
  } catch (e) { /* no-blocking */ }

  return NextResponse.json({ ok: true, sent: totalSent });
}
