// Cron: fulfillment del "Resumen de sesión" (13,99€).
// Detecta compras PAGADAS del link (payments amount_cents=1399, status=completed)
// que aún no tienen orden -> genera el PDF desde la HC/grabación -> lo deja en
// estado pending_approval (o needs_review si hay alerta clínica). NO envía: la
// psicóloga aprueba y envía desde su panel (/psicologo/resumenes).
import { NextRequest, NextResponse } from "next/server";
import {
  blogClient, resolveCustomer, buildOrder, renderResumenPDF, uploadResumenPDF,
} from "@/lib/resumen/generate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const RESUMEN_CENTS = 1399;
// Solo compras desde esta fecha (evita backfill de históricos y reenvíos manuales ya hechos).
const SINCE = "2026-09-12T00:00:00Z";
const BATCH = 3;

export async function GET(req: NextRequest) {
  const CRON_SECRET = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sb = blogClient();
  const log: string[] = [];

  // 1) Detectar compras pagadas sin orden creada
  const { data: pays } = await sb.from("payments")
    .select("stripe_session_id, amount_cents, patient_email, patient_name, created_at")
    .eq("amount_cents", RESUMEN_CENTS).eq("status", "completed").gte("created_at", SINCE)
    .order("created_at", { ascending: false }).limit(50);

  for (const p of pays ?? []) {
    if (!p.stripe_session_id) continue;
    const { data: exists } = await sb.from("resumen_orders").select("id").eq("stripe_session_id", p.stripe_session_id).maybeSingle();
    if (exists) continue;
    await sb.from("resumen_orders").insert({
      stripe_session_id: p.stripe_session_id, product: "resumen", amount_cents: p.amount_cents,
      patient_email: p.patient_email, patient_name: p.patient_name, paid_at: p.created_at, status: "pending",
    }).then(() => log.push(`nuevo pedido: ${p.patient_email}`), () => {});
  }

  // 2) Procesar pendientes (batch pequeño; reintenta errores < 3)
  const { data: pend } = await sb.from("resumen_orders")
    .select("id, patient_email, patient_name, product, attempts, status")
    .or("status.eq.pending,and(status.eq.error,attempts.lt.3)")
    .order("created_at", { ascending: true }).limit(BATCH);

  let generated = 0;
  for (const o of pend ?? []) {
    // claim atómico
    const { data: claimed } = await sb.from("resumen_orders")
      .update({ status: "generating", updated_at: new Date().toISOString() })
      .eq("id", o.id).eq("status", o.status).select("id").maybeSingle();
    if (!claimed) continue;

    try {
      const resolved = await resolveCustomer(sb, o.patient_email, o.patient_name);
      if (!resolved) {
        await sb.from("resumen_orders").update({ status: "unmatched", error: "no amelia match", updated_at: new Date().toISOString() }).eq("id", o.id);
        log.push(`unmatched: ${o.patient_email}`);
        continue;
      }
      const built = await buildOrder(sb, resolved.customer_id, o.product, resolved);
      if (!built) {
        // HC aún no lista -> volver a pending para reintentar más tarde
        await sb.from("resumen_orders").update({ status: "pending", customer_id: resolved.customer_id, updated_at: new Date().toISOString() }).eq("id", o.id);
        log.push(`sin HC lista aún: ${o.patient_email}`);
        continue;
      }
      const buf = await renderResumenPDF(built.data);
      const path = await uploadResumenPDF(sb, o.id, buf);
      await sb.from("resumen_orders").update({
        status: built.alert ? "needs_review" : "pending_approval",
        customer_id: resolved.customer_id, provider_id: built.provider_id,
        appointment_id: built.appointment_id, session_date: built.session_date,
        content: built.data, alert: built.alert, alert_reason: built.alert_reason,
        report_path: path, generated_at: new Date().toISOString(), error: null, updated_at: new Date().toISOString(),
      }).eq("id", o.id);
      generated++;
      log.push(`generado (${built.alert ? "needs_review" : "ok"}): ${o.patient_email}`);
    } catch (e) {
      await sb.from("resumen_orders").update({
        status: "error", error: e instanceof Error ? e.message : String(e),
        attempts: (o.attempts ?? 0) + 1, updated_at: new Date().toISOString(),
      }).eq("id", o.id);
      log.push(`error: ${o.patient_email} :: ${e instanceof Error ? e.message : e}`);
    }
  }

  return NextResponse.json({ ok: true, generated, detected: (pays ?? []).length, log });
}
