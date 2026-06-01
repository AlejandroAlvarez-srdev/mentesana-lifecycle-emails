// Cron: viernes 9am Europe/Madrid (UTC 7 invierno / 8 verano — usamos 7).
// Envía email semanal a lead-psychologist@example.com con: asistidas/no-show/canceladas
// por psicóloga + ranking top/bottom + alertas HC pendientes + quejas abiertas.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ameliaQuery, ameliaTable } from "@/lib/amelia-db";
import { sendEmail } from "@/lib/emails/send";
import { emailLayout } from "@/lib/emails/layout";
import { JEFE_EMAILS } from "@/lib/jefe-psi-auth";

const sb = createClient(process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!, process.env.BLOG_SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const got = req.headers.get("authorization") || "";
  if (expected && got !== `Bearer ${expected}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ab = ameliaTable("appointments");
  const cb = ameliaTable("customer_bookings");
  const ub = ameliaTable("users");

  // Stats últimos 7 días por psicóloga
  const stats = await ameliaQuery<any>(
    `SELECT u.id AS provider_id, u.firstName, u.lastName, u.email,
            COUNT(DISTINCT a.id) AS total,
            SUM(CASE WHEN cb.status='approved' THEN 1 ELSE 0 END) AS attended,
            SUM(CASE WHEN cb.status IN ('rejected','no-show') THEN 1 ELSE 0 END) AS noshow,
            SUM(CASE WHEN cb.status='canceled' THEN 1 ELSE 0 END) AS canceled,
            SUM(CASE WHEN a.serviceId IN (8,11) AND cb.status='approved' THEN 1 ELSE 0 END) AS diag_attended,
            SUM(CASE WHEN a.serviceId NOT IN (8,11) AND cb.status='approved' THEN 1 ELSE 0 END) AS package_attended
     FROM ${ub} u
     LEFT JOIN ${ab} a ON a.providerId = u.id AND a.bookingStart >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND a.bookingStart < NOW()
     LEFT JOIN ${cb} ON cb.appointmentId = a.id
     WHERE u.type='provider' AND u.status='visible'
     GROUP BY u.id
     ORDER BY attended DESC`,
  );

  // HC compliance — asistidas últimos 7 días vs notas escritas
  const notes = await sb.from("psychologist_clinical_notes").select("provider_id, customer_id").gte("session_date", new Date(Date.now() - 7 * 86400000).toISOString());
  const notesByProvider = new Map<number, number>();
  for (const n of notes.data ?? []) notesByProvider.set(Number(n.provider_id), (notesByProvider.get(Number(n.provider_id)) ?? 0) + 1);

  // Quejas abiertas
  const complaints = await sb.from("psychologist_complaints").select("provider_id, subject, severity, created_at").eq("status", "open");
  const complaintsByProvider = new Map<number, any[]>();
  for (const c of complaints.data ?? []) {
    const k = Number(c.provider_id);
    if (!complaintsByProvider.has(k)) complaintsByProvider.set(k, []);
    complaintsByProvider.get(k)!.push(c);
  }

  // Compose rows con HC pendientes
  const enriched = stats.map((s: any) => {
    const attended = Number(s.attended ?? 0);
    const noshow = Number(s.noshow ?? 0);
    const hcWritten = notesByProvider.get(Number(s.provider_id)) ?? 0;
    const hcPending = Math.max(0, attended - hcWritten);
    const hcPct = attended > 0 ? Math.round((hcWritten / attended) * 100) : null;
    const compl = complaintsByProvider.get(Number(s.provider_id)) ?? [];
    return {
      provider_id: s.provider_id,
      name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
      email: s.email,
      total: Number(s.total ?? 0),
      attended, noshow, canceled: Number(s.canceled ?? 0),
      diag_attended: Number(s.diag_attended ?? 0),
      package_attended: Number(s.package_attended ?? 0),
      hcWritten, hcPending, hcPct,
      complaints: compl.length,
    };
  });

  const totalAttended = enriched.reduce((s, r) => s + r.attended, 0);
  const totalNoshow = enriched.reduce((s, r) => s + r.noshow, 0);
  const totalDiag = enriched.reduce((s, r) => s + r.diag_attended, 0);
  const totalHcPending = enriched.reduce((s, r) => s + r.hcPending, 0);
  const totalComplaints = enriched.reduce((s, r) => s + r.complaints, 0);

  const top3 = [...enriched].sort((a, b) => b.attended - a.attended).slice(0, 3);
  const bottom3 = [...enriched].filter(r => r.attended > 0).sort((a, b) => a.attended - b.attended).slice(0, 3);
  const hcRed = enriched.filter(r => r.hcPending >= 3).sort((a, b) => b.hcPending - a.hcPending);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mentesanapsicologia.com";

  const rowsHtml = enriched.map(r => {
    const attColor = r.attended >= 8 ? "#16a34a" : r.attended >= 4 ? "#d97706" : "#dc2626";
    const hcColor = r.hcPct === null ? "#888" : r.hcPct >= 80 ? "#16a34a" : r.hcPct >= 60 ? "#d97706" : "#dc2626";
    return `<tr style="border-top:1px solid #eee;">
      <td style="padding:8px 6px;font-size:12px;"><a href="${baseUrl}/agent/jefe-psicologas/${r.provider_id}" style="color:#6A178C;text-decoration:none;font-weight:700;">${escapeHtml(r.name)}</a></td>
      <td style="padding:8px 6px;text-align:right;color:${attColor};font-weight:700;font-size:12px;">${r.attended}</td>
      <td style="padding:8px 6px;text-align:right;font-size:12px;color:${r.noshow > 0 ? "#dc2626" : "#888"}">${r.noshow}</td>
      <td style="padding:8px 6px;text-align:right;font-size:12px;">${r.diag_attended}</td>
      <td style="padding:8px 6px;text-align:right;font-size:12px;color:${hcColor};font-weight:700;">${r.hcWritten}/${r.attended}${r.hcPct !== null ? ` (${r.hcPct}%)` : ""}</td>
      <td style="padding:8px 6px;text-align:right;font-size:12px;color:${r.complaints > 0 ? "#dc2626" : "#888"};">${r.complaints}</td>
    </tr>`;
  }).join("");

  const hcAlertHtml = hcRed.length > 0 ? `
    <div style="margin:18px 0;padding:14px;background:rgba(220,38,38,0.06);border-left:4px solid #dc2626;border-radius:8px;">
      <strong style="color:#991b1b;font-size:13px;">🚨 HC pendientes urgentes (3+):</strong>
      <ul style="margin:6px 0 0;padding-left:22px;">
        ${hcRed.map(r => `<li style="font-size:12.5px;color:#1a1a2e;margin:3px 0;"><strong>${escapeHtml(r.name)}</strong>: ${r.hcPending} historias clínicas sin escribir esta semana</li>`).join("")}
      </ul>
    </div>` : "";

  const content = `
    <p style="margin:0 0 6px;font-size:15px;color:#1a0a1f;">Hola jefe,</p>
    <p style="margin:0 0 14px;font-size:14px;color:#475569;line-height:1.6;">Aquí tienes el resumen semanal de las psicólogas (últimos 7 días):</p>

    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:16px;">
      <div style="padding:10px;background:rgba(106,23,140,0.06);border-radius:8px;text-align:center;">
        <div style="font-size:9px;color:#888;font-weight:800;text-transform:uppercase;">✓ Asistidas</div>
        <div style="font-size:22px;color:#16a34a;font-weight:800;">${totalAttended}</div>
      </div>
      <div style="padding:10px;background:rgba(106,23,140,0.06);border-radius:8px;text-align:center;">
        <div style="font-size:9px;color:#888;font-weight:800;text-transform:uppercase;">✗ No-show</div>
        <div style="font-size:22px;color:#dc2626;font-weight:800;">${totalNoshow}</div>
      </div>
      <div style="padding:10px;background:rgba(106,23,140,0.06);border-radius:8px;text-align:center;">
        <div style="font-size:9px;color:#888;font-weight:800;text-transform:uppercase;">9,99€</div>
        <div style="font-size:22px;color:#0891b2;font-weight:800;">${totalDiag}</div>
      </div>
      <div style="padding:10px;background:rgba(245,158,11,0.06);border-radius:8px;text-align:center;">
        <div style="font-size:9px;color:#888;font-weight:800;text-transform:uppercase;">HC pendientes</div>
        <div style="font-size:22px;color:#d97706;font-weight:800;">${totalHcPending}</div>
      </div>
      <div style="padding:10px;background:rgba(220,38,38,0.06);border-radius:8px;text-align:center;">
        <div style="font-size:9px;color:#888;font-weight:800;text-transform:uppercase;">Quejas</div>
        <div style="font-size:22px;color:#dc2626;font-weight:800;">${totalComplaints}</div>
      </div>
    </div>

    ${hcAlertHtml}

    <h3 style="margin:18px 0 6px;color:#6A178C;font-size:14px;">🏆 Top 3 asistidas</h3>
    <ol style="margin:0 0 14px;padding-left:22px;font-size:13px;">
      ${top3.map(r => `<li><strong>${escapeHtml(r.name)}</strong> — ${r.attended} asistidas</li>`).join("")}
    </ol>

    ${bottom3.length > 0 ? `
    <h3 style="margin:14px 0 6px;color:#6A178C;font-size:14px;">⚠️ Necesitan apoyo (menor asistencia)</h3>
    <ol style="margin:0 0 14px;padding-left:22px;font-size:13px;color:#475569;">
      ${bottom3.map(r => `<li><strong>${escapeHtml(r.name)}</strong> — ${r.attended} asistidas</li>`).join("")}
    </ol>` : ""}

    <h3 style="margin:18px 0 6px;color:#6A178C;font-size:14px;">📊 Tabla completa</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:rgba(106,23,140,0.05);">
          <th style="padding:8px 6px;text-align:left;font-size:10px;font-weight:800;color:#888;text-transform:uppercase;">Psicóloga</th>
          <th style="padding:8px 6px;text-align:right;font-size:10px;font-weight:800;color:#888;text-transform:uppercase;">Asist.</th>
          <th style="padding:8px 6px;text-align:right;font-size:10px;font-weight:800;color:#888;text-transform:uppercase;">NoShow</th>
          <th style="padding:8px 6px;text-align:right;font-size:10px;font-weight:800;color:#888;text-transform:uppercase;">9,99€</th>
          <th style="padding:8px 6px;text-align:right;font-size:10px;font-weight:800;color:#888;text-transform:uppercase;">HC</th>
          <th style="padding:8px 6px;text-align:right;font-size:10px;font-weight:800;color:#888;text-transform:uppercase;">Quejas</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div style="margin-top:22px;text-align:center;">
      <a href="${baseUrl}/agent/jefe-psicologas" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#6A178C,#8B2FB5);color:#fff;text-decoration:none;border-radius:10px;font-weight:800;font-size:13px;">Abrir panel completo →</a>
    </div>
  `;

  // A las dos líderes de psicólogas
  for (const to of JEFE_EMAILS) {
    await sendEmail({
      to,
      subject: `📊 Resumen semanal psicólogas · ${totalAttended} asistidas · ${totalHcPending} HC pendientes`,
      html: emailLayout({ title: "Resumen semanal psicólogas", preheader: `${totalAttended} asistidas, ${totalHcPending} HC pendientes`, content }),
    });
  }

  return NextResponse.json({ ok: true, providers: enriched.length, total_attended: totalAttended, total_hc_pending: totalHcPending });
}

function escapeHtml(s: string): string { return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)); }
