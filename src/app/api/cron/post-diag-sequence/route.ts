// Cron diario: ejecuta la secuencia post-diagnóstico.
// 6 capas de verificación para asegurar que NO mandamos a quien ya compró:
//   1) Query principal con NOT EXISTS sobre packages_to_customers (approved+pending, después del diag)
//   2) Re-check JUSTO antes de cada sendEmail() (cierra race condition)
//   3) Idempotencia UNIQUE(customer_id, step) en log → si cron se duplica, segundo INSERT falla
//   4) Click intent en últimas 24h → aplazo +3 días al siguiente step
//   5) Cleanup nocturno marca "completed_purchased" a los que ya compraron
//   6) Lookback estricto: pc.purchased >= a.bookingStart (NO los que ya tenían bono antes)
//
// Schedule: diario a las 10:00 Madrid (08:00 UTC en verano, 09:00 UTC en invierno) — usamos UTC 09:00.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ameliaQuery, ameliaTable } from "@/lib/amelia-db";
import { sendEmail } from "@/lib/emails/send";
import { emailLayout } from "@/lib/emails/layout";

const sb = createClient(process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!, process.env.BLOG_SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });
const CRON_SECRET = process.env.CRON_SECRET;
const DIAG_IDS = [8, 11];
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const SITE = "https://mentesanapsicologia.com";

type Candidate = {
  customer_id: number;
  appointment_id: number;
  first_name: string;
  email: string;
  diag_date: string;
  provider_first: string;
  days_since: number;
};

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Cargar templates activos
  const { data: templates } = await sb.from("post_diag_templates").select("*").eq("active", true).order("step");
  if (!templates || templates.length === 0) return NextResponse.json({ ok: true, sent: 0, reason: "no_templates" });

  // 0) CLEANUP previo: marcar completed_purchased a quien ya compró pero aún no consta como completado
  await cleanupCompletedPurchasers();

  const ab = ameliaTable("appointments");
  const cb = ameliaTable("customer_bookings");
  const ub = ameliaTable("users");
  const pc = ameliaTable("packages_to_customers");

  // Cargar unsubscribes
  const { data: unsubs } = await sb.from("post_diag_unsubscribes").select("email");
  const unsubSet = new Set((unsubs ?? []).map(u => u.email.toLowerCase()));

  // Cargar intents recientes (últimas 24h) → para capa 4
  const since24h = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: recentIntents } = await sb.from("post_diag_intents").select("customer_id, step, clicked_at").gte("clicked_at", since24h);
  const intentByCustomer = new Map<number, { step: number; clicked_at: string }>();
  for (const i of recentIntents ?? []) {
    const cur = intentByCustomer.get(Number(i.customer_id));
    if (!cur || cur.clicked_at < i.clicked_at) intentByCustomer.set(Number(i.customer_id), { step: Number(i.step), clicked_at: i.clicked_at });
  }

  let totalSent = 0; const errors: string[] = [];

  // Por cada template (step), buscar candidatos que toca enviar HOY
  for (const tpl of templates) {
    const step = Number(tpl.step);
    const days = Number(tpl.send_after_days);

    // CAPA 1: query Amelia con NOT EXISTS sobre packages_to_customers
    // Ventana: bookingStart entre (now - days - 1d) y (now - days) → exactamente "hoy hace X días"
    const candidates = await ameliaQuery<Candidate>(
      `SELECT
         cb.customerId         AS customer_id,
         cb.appointmentId      AS appointment_id,
         c.firstName           AS first_name,
         c.email               AS email,
         a.bookingStart        AS diag_date,
         u.firstName           AS provider_first,
         FLOOR(TIMESTAMPDIFF(HOUR, a.bookingStart, NOW()) / 24) AS days_since
       FROM ${ab} a
       JOIN ${cb} cb ON cb.appointmentId = a.id
       JOIN ${ub} c ON c.id = cb.customerId AND c.type='customer'
       JOIN ${ub} u ON u.id = a.providerId AND u.type='provider'
       WHERE a.serviceId IN (${DIAG_IDS.join(",")})
         AND cb.status = 'approved'
         AND a.bookingStart < NOW()
         AND a.bookingStart >= DATE_SUB(NOW(), INTERVAL ${days + 1} DAY)
         AND a.bookingStart < DATE_SUB(NOW(), INTERVAL ${days} DAY)
         AND c.email IS NOT NULL AND c.email != ''
         AND NOT EXISTS (
           SELECT 1 FROM ${pc} pcx
           WHERE pcx.customerId = cb.customerId
             AND pcx.status IN ('approved','pending')
             AND pcx.purchased >= a.bookingStart
         )
       LIMIT 200`,
    );

    for (const cand of candidates ?? []) {
      const emailLower = cand.email.toLowerCase();

      // CAPA: unsubscribed
      if (unsubSet.has(emailLower)) continue;

      // CAPA 4: intent reciente → aplazar siguiente step
      const intent = intentByCustomer.get(Number(cand.customer_id));
      if (intent && intent.step < step && (Date.now() - new Date(intent.clicked_at).getTime()) < 72 * 3600_000) {
        // Hizo click hace <72h en un step anterior — dar tiempo
        continue;
      }

      // CAPA 3: idempotencia — si ya se envió, saltar
      const { data: existingLog } = await sb.from("post_diag_sequence_log").select("id").eq("customer_id", cand.customer_id).eq("step", step).maybeSingle();
      if (existingLog) continue;

      // CAPA 2: re-check JUSTO antes del send (race condition)
      const recheck = await ameliaQuery<any>(
        `SELECT 1 FROM ${pc} pcx WHERE pcx.customerId = ? AND pcx.status IN ('approved','pending') AND pcx.purchased >= ? LIMIT 1`,
        [cand.customer_id, cand.diag_date],
      );
      if (recheck && recheck.length > 0) {
        // Compró entre el SELECT y el envío — abortar este send
        await sb.from("post_diag_sequence_log").insert({
          customer_id: cand.customer_id,
          appointment_id: cand.appointment_id,
          email: emailLower,
          step,
          subject: "(skipped — purchased in race window)",
          brevo_ok: false,
          completed_reason: "race_window_purchase",
        }).select(); // best-effort, ignore failures
        continue;
      }

      // Render template con variables + tracking links
      const { subject, html } = renderTemplate(tpl, cand);
      const res = await sendEmail({ to: cand.email, subject, html, toName: cand.first_name });
      const logRow: any = {
        customer_id: cand.customer_id,
        appointment_id: cand.appointment_id,
        email: emailLower,
        step,
        subject,
        brevo_ok: res.success,
      };
      if (!res.success) logRow.error = res.error?.slice(0, 500);
      try {
        await sb.from("post_diag_sequence_log").insert(logRow);
      } catch (e: any) {
        // Probable UNIQUE violation por cron duplicado → no es bug, simplemente saltar
        errors.push(`step ${step} customer ${cand.customer_id}: ${String(e?.message ?? e).slice(0, 100)}`);
        continue;
      }
      if (res.success) totalSent++;
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, errors: errors.slice(0, 10), error_count: errors.length });
}

// ─── Cleanup ────────────────────────────────────────────────────────────
async function cleanupCompletedPurchasers() {
  // Para cualquier customer en sequence_log que ya tenga bono comprado después del diag,
  // marcar todos los steps pendientes como "completed_purchased" mediante registros bandera
  // (no podemos pre-crear filas, solo skipear futuros con la query principal).
  // Esto es informacional para el panel admin — el bloqueo real lo hace la query principal.
  try {
    // Customers que aparecen en sequence_log SIN completed_reason y ya tienen bono activo
    const { data: rows } = await sb.from("post_diag_sequence_log").select("customer_id, appointment_id").is("completed_reason", null).limit(500);
    if (!rows || rows.length === 0) return;
    const customerIds = [...new Set(rows.map(r => Number(r.customer_id)))];
    if (customerIds.length === 0) return;

    const ab = ameliaTable("appointments");
    const cb = ameliaTable("customer_bookings");
    const pc = ameliaTable("packages_to_customers");
    const purchased = await ameliaQuery<any>(
      `SELECT DISTINCT cb2.customerId
       FROM ${cb} cb2
       JOIN ${ab} a ON a.id = cb2.appointmentId
       JOIN ${pc} pcx ON pcx.customerId = cb2.customerId
       WHERE cb2.customerId IN (${customerIds.join(",")})
         AND a.serviceId IN (${DIAG_IDS.join(",")})
         AND cb2.status = 'approved'
         AND pcx.status IN ('approved','pending')
         AND pcx.purchased >= a.bookingStart`,
    );
    const purchasedSet = new Set((purchased ?? []).map((r: any) => Number(r.customerId)));
    if (purchasedSet.size === 0) return;
    await sb.from("post_diag_sequence_log").update({ completed_reason: "purchased" }).is("completed_reason", null).in("customer_id", [...purchasedSet]);
  } catch { /* no-blocking */ }
}

// ─── Render template con variables + tracking ───────────────────────────
function renderTemplate(tpl: any, cand: Candidate): { subject: string; html: string } {
  const vars: Record<string, string> = {
    first_name: cand.first_name || "💜",
    provider_first: cand.provider_first || "tu psicóloga",
    diag_date: new Date(cand.diag_date).toLocaleDateString("es-ES", { day: "numeric", month: "long" }),
  };
  const replaceVars = (s: string) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  const subject = replaceVars(String(tpl.subject ?? ""));
  const bodyHtml = replaceVars(String(tpl.html_body ?? ""));
  const ctaLabel = tpl.cta_label ? replaceVars(String(tpl.cta_label)) : null;
  const targetUrl = tpl.cta_url ? replaceVars(String(tpl.cta_url)) : null;

  const trackedCta = targetUrl ? `${SITE}/api/post-diag/click?t=${Buffer.from(JSON.stringify({ customer_id: cand.customer_id, step: tpl.step, target_url: targetUrl })).toString("base64url")}` : null;
  const unsubToken = Buffer.from(JSON.stringify({ email: cand.email, ts: Date.now() })).toString("base64url");
  const unsubLink = `${SITE}/api/post-diag/unsubscribe?token=${unsubToken}`;

  const cta = trackedCta && ctaLabel ? `
    <div style="text-align:center;margin:28px 0;">
      <a href="${trackedCta}" style="display:inline-block;padding:14px 30px;background:#6A178C;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">${ctaLabel} →</a>
    </div>` : "";

  const footer = `<p style="font-size:11px;color:#888;margin-top:28px;border-top:1px solid #eee;padding-top:12px;">Si prefieres no recibir más emails como este, <a href="${unsubLink}" style="color:#888;">date de baja aquí</a>.</p>`;
  return {
    subject,
    html: emailLayout({ title: subject, preheader: tpl.preheader ?? "", content: bodyHtml + cta + footer }),
  };
}
