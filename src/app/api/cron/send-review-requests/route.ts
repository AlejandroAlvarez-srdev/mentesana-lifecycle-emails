// Cron: cada 30 min crea + envía solicitudes de review.
//   1) Encuentra sesiones aprobadas (status='approved') terminadas hace 2-24h sin request previo
//   2) Crea request con token único + expiry 14d
//   3) Envía email via Brevo
//
// Idempotente: appointment_id es UNIQUE en session_review_requests.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ameliaQuery, ameliaTable } from "@/lib/amelia-db";
import { automationTags } from "@/lib/flujos-metrics";
import { sendEmail } from "@/lib/emails/send";
import { reviewRequestEmail } from "@/lib/emails/review-request";
import { randomBytes } from "crypto";

const sb = createClient(process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!, process.env.BLOG_SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });
const CRON_SECRET = process.env.CRON_SECRET;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const DIAG_IDS = [8, 11];
// B2B (empresas.mentesanapsicologia.com): reuniones comerciales de marca blanca/marketing/software y las sesiones de los
// clientes marca blanca (categoría 4 "B2B Empresas"). NO son pacientes de Mente Sana → nunca pedirles review.
const B2B_IDS = [12, 13, 301, 302];
const B2B_CATEGORY_ID = 4;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ab = ameliaTable("appointments");
  const cb = ameliaTable("customer_bookings");
  const ub = ameliaTable("users");
  const sv = ameliaTable("services");

  // Sesiones approved que terminaron hace 2-24h
  const candidates = await ameliaQuery<any>(
    `SELECT a.id appointment_id, cb.customerId customer_id, a.providerId provider_id, a.serviceId service_id,
            a.bookingStart session_date,
            c.firstName customer_first, c.email customer_email,
            u.firstName provider_first
     FROM ${ab} a JOIN ${cb} cb ON cb.appointmentId = a.id
     JOIN ${ub} c ON c.id = cb.customerId AND c.type='customer'
     JOIN ${ub} u ON u.id = a.providerId AND u.type='provider'
     LEFT JOIN ${sv} s ON s.id = a.serviceId
     WHERE cb.status = 'approved'
       AND a.serviceId NOT IN (${DIAG_IDS.join(",")})
       AND a.serviceId NOT IN (${B2B_IDS.join(",")})
       AND COALESCE(s.categoryId, 0) <> ${B2B_CATEGORY_ID}
       AND a.bookingStart BETWEEN DATE_SUB(NOW(), INTERVAL 24 HOUR) AND DATE_SUB(NOW(), INTERVAL 2 HOUR)
       AND c.email IS NOT NULL AND c.email != ''
     LIMIT 100`,
  );

  if (!candidates || candidates.length === 0) return NextResponse.json({ ok: true, created: 0, sent: 0 });

  // Filtrar los que ya tienen request
  const ids = candidates.map((c: any) => Number(c.appointment_id));
  const { data: existing } = await sb.from("session_review_requests").select("appointment_id").in("appointment_id", ids);
  const existingSet = new Set((existing ?? []).map((r: any) => Number(r.appointment_id)));

  let created = 0, sent = 0, failed = 0;
  for (const c of candidates) {
    const apptId = Number(c.appointment_id);
    if (existingSet.has(apptId)) continue;

    const token = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();

    const { error: insErr } = await sb.from("session_review_requests").insert({
      appointment_id: apptId,
      customer_id: Number(c.customer_id),
      provider_id: Number(c.provider_id),
      service_id: c.service_id ? Number(c.service_id) : null,
      session_date: new Date(c.session_date).toISOString(),
      token,
      expires_at: expiresAt,
      channel: "email",
    });
    if (insErr) { failed++; continue; }
    created++;

    const { subject, html } = reviewRequestEmail({
      customer_first: c.customer_first ?? "",
      provider_first: c.provider_first ?? "tu psicóloga",
      token,
      session_date: c.session_date,
    });
    const send = await sendEmail({ tags: automationTags("resenas"), to: c.customer_email, subject, html, toName: c.customer_first ?? undefined });
    if (send.success) {
      await sb.from("session_review_requests").update({ sent_at: new Date().toISOString() }).eq("token", token);
      sent++;
    }
  }

  return NextResponse.json({ ok: true, processed: candidates.length, created, sent, failed });
}
