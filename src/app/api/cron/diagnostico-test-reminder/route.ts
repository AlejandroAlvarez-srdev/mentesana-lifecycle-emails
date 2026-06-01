// Cron · cada 15 min. Para cada cita de diagnóstico (servicios 8, 11)
// que comienza entre 3h y 5h desde ahora:
//   1) Si el cliente NO completó el test (no hay scores ni report_generated)
//   2) Y no le hemos mandado ya este recordatorio (test_reminder_sent_at NULL)
//   → Enviamos email "personal" de la psicóloga pidiéndole completar el test.
//
// Idempotente: usamos diagnostico_tests.test_reminder_sent_at para no
// disparar dos veces. Si no existe fila aún para ese email (caso raro),
// la creamos para que la marca de envío persista.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ameliaQuery, ameliaTable } from "@/lib/amelia-db";
import { sendEmail } from "@/lib/emails/send";
import { diagnosticoTestReminderEmail } from "@/lib/emails/diagnostico-test-reminder";

const sb = createClient(
  process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const DIAG_IDS = [8, 11];

interface Candidate {
  appointment_id: number;
  customer_email: string | null;
  customer_first: string | null;
  customer_last: string | null;
  provider_first: string | null;
  provider_last: string | null;
  booking_start: string; // datetime ISO
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRES_OK(auth) === false) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ab = ameliaTable("appointments");
  const cb = ameliaTable("customer_bookings");
  const ub = ameliaTable("users");

  // Citas de diagnóstico que arrancan entre +3h y +5h desde ahora.
  // Filtramos por status reservado/approved (cita viva), excluimos canceladas.
  const candidates = await ameliaQuery<Candidate>(
    `SELECT a.id AS appointment_id,
            c.email AS customer_email, c.firstName AS customer_first, c.lastName AS customer_last,
            u.firstName AS provider_first, u.lastName AS provider_last,
            a.bookingStart AS booking_start
       FROM ${ab} a
       JOIN ${cb} cb ON cb.appointmentId = a.id
       JOIN ${ub} c ON c.id = cb.customerId AND c.type = 'customer'
       JOIN ${ub} u ON u.id = a.providerId AND u.type = 'provider'
      WHERE a.serviceId IN (${DIAG_IDS.join(",")})
        AND cb.status IN ('approved','pending')
        AND a.bookingStart BETWEEN DATE_ADD(NOW(), INTERVAL 3 HOUR)
                              AND DATE_ADD(NOW(), INTERVAL 5 HOUR)
        AND c.email IS NOT NULL AND c.email != ''
      LIMIT 200`,
  );

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, candidates: 0 });
  }

  const emails = [...new Set(candidates.map((c) => (c.customer_email || "").toLowerCase()).filter(Boolean))];

  // Lookup en diagnostico_tests para esos emails: estado del test + flag de reminder
  const { data: tests } = await sb
    .from("diagnostico_tests")
    .select("user_email, scores, report_generated, test_reminder_sent_at, test_mental_health_completed_at, paid_at, created_at")
    .in("user_email", emails);

  const byEmail = new Map<string, {
    scores: unknown;
    report_generated: boolean | null;
    test_reminder_sent_at: string | null;
    test_mental_health_completed_at: string | null;
    paid_at: string | null;
    created_at: string | null;
  }>();
  for (const t of tests ?? []) {
    byEmail.set((t.user_email as string).toLowerCase(), {
      scores: t.scores,
      report_generated: t.report_generated as boolean | null,
      test_reminder_sent_at: t.test_reminder_sent_at as string | null,
      test_mental_health_completed_at: t.test_mental_health_completed_at as string | null,
      paid_at: t.paid_at as string | null,
      created_at: t.created_at as string | null,
    });
  }

  // Gracia: si el paciente acaba de pagar / acaba de crearse la fila, le
  // damos margen para terminar el test antes de mandarle un recordatorio
  // que llegue mientras lo está rellenando.
  const GRACE_MS = 45 * 60 * 1000;
  const nowMs = Date.now();

  let sent = 0, skippedAlreadySent = 0, skippedTestDone = 0, skippedGrace = 0, failed = 0;

  for (const c of candidates) {
    const email = (c.customer_email || "").toLowerCase();
    if (!email) continue;
    const row = byEmail.get(email);

    // 1) Si ya completó el test no le molestamos
    const scoresEmpty = !row?.scores || (typeof row.scores === "object" && Object.keys(row.scores as object).length === 0);
    const completed = Boolean(row?.report_generated) || Boolean(row?.test_mental_health_completed_at) || !scoresEmpty;
    if (completed) { skippedTestDone++; continue; }

    // 2) Si ya le mandamos el recordatorio no repetimos
    if (row?.test_reminder_sent_at) { skippedAlreadySent++; continue; }

    // 3) Gracia post-pago: pagó/registró hace < 45 min → quizá esté
    //    rellenando el test ahora mismo. Esperamos al siguiente ciclo.
    const recentMs = Math.max(
      row?.paid_at ? new Date(row.paid_at).getTime() : 0,
      row?.created_at ? new Date(row.created_at).getTime() : 0,
    );
    if (recentMs && nowMs - recentMs < GRACE_MS) { skippedGrace++; continue; }

    const psiFull = `${c.provider_first ?? ""} ${c.provider_last ?? ""}`.trim();
    const { subject, html, fromName } = diagnosticoTestReminderEmail({
      patientFirstName: c.customer_first ?? "",
      patientEmail: c.customer_email ?? "",
      psychologistName: psiFull,
      appointmentAt: c.booking_start,
    });

    const send = await sendEmail({
      to: c.customer_email!,
      toName: c.customer_first ?? undefined,
      subject,
      html,
      fromName,
    });

    if (!send.success) { failed++; continue; }

    // Marcamos el envío en diagnostico_tests (upsert por email)
    await sb.from("diagnostico_tests").upsert(
      { user_email: email, test_reminder_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "user_email" },
    );
    sent++;
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    sent,
    skipped_test_done: skippedTestDone,
    skipped_already_sent: skippedAlreadySent,
    skipped_grace: skippedGrace,
    failed,
  });
}

// helper guard: typo-proof
function CRON_SECRES_OK(auth: string | null): boolean {
  if (!CRON_SECRET) return true; // sin secret configurado, dejamos pasar (preview/dev)
  return auth === `Bearer ${CRON_SECRET}`;
}
