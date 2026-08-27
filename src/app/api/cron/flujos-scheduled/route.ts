// Despacha los correos/campañas PROGRAMADOS desde el panel /flujos.
// Corre cada minuto (vercel.json). Auth: Bearer CRON_SECRET.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/emails/send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const sb = createClient(process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!, process.env.BLOG_SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });
const CRON_SECRET = process.env.CRON_SECRET;

const fillVars = (text: string, vars: Record<string, string>) =>
  text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_m, k) => (k in vars ? vars[k] : `{{${k}}}`));

async function sendCampaign(subject: string, html: string, listIds: number[]): Promise<{ ok: boolean; detail?: string }> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return { ok: false, detail: "no BREVO_API_KEY" };
  const create = await fetch("https://api.brevo.com/v3/emailCampaigns", {
    method: "POST", headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ name: subject.slice(0, 110) || `Campaña ${Date.now()}`, subject, htmlContent: html,
      sender: { name: process.env.BREVO_SENDER_NAME || "Mente Sana Psicología", email: process.env.BREVO_SENDER_EMAIL || "hola@mentesanapsicologia.com" },
      recipients: { listIds } }),
  });
  if (!create.ok) return { ok: false, detail: (await create.text()).slice(0, 200) };
  const id = (await create.json())?.id;
  const send = await fetch(`https://api.brevo.com/v3/emailCampaigns/${id}/sendNow`, { method: "POST", headers: { "api-key": key, accept: "application/json" } });
  return send.ok ? { ok: true } : { ok: false, detail: (await send.text()).slice(0, 200) };
}

export async function GET(req: NextRequest) {
  if (CRON_SECRET && req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const nowIso = new Date().toISOString();
  const { data: due } = await sb.from("scheduled_emails")
    .select("*").eq("status", "pending").lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true }).limit(20);
  if (!due || due.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  const results: { id: string; ok: boolean; detail?: string }[] = [];
  for (const row of due) {
    let ok = false; let detail: string | undefined;
    try {
      const vars = (row.variables && typeof row.variables === "object") ? row.variables as Record<string, string> : {};
      const subject = fillVars(String(row.subject ?? ""), vars);
      const html = fillVars(String(row.html ?? ""), vars);
      if (row.mode === "lista") {
        const r = await sendCampaign(subject, html, (row.list_ids ?? []).map(Number).filter(Boolean));
        ok = r.ok; detail = r.detail;
      } else {
        const attachments = Array.isArray(row.attachments)
          ? (row.attachments as { url?: string; name?: string }[]).filter((a) => a.url && a.name).map((a) => ({ url: a.url!, name: a.name! }))
          : undefined;
        const r = await sendEmail({ to: row.to_email, subject, html, toName: row.to_name ?? undefined, attachments });
        ok = r.success; detail = r.error;
      }
    } catch (e) { ok = false; detail = (e as Error).message; }

    await sb.from("scheduled_emails").update({
      status: ok ? "sent" : "failed", sent_at: ok ? new Date().toISOString() : null,
      error: ok ? null : (detail ?? "error"), attempts: (row.attempts ?? 0) + 1,
    }).eq("id", row.id);
    // registrar en el historial general
    await sb.from("flujos_manual_sends").insert({
      to_email: row.mode === "lista" ? `listas:${(row.list_ids ?? []).join(",")}` : row.to_email,
      subject: `[PROGRAMADO] ${row.subject}`, template_ref: `scheduled:${row.id}`,
      sent_by: row.created_by ?? "programado", brevo_ok: ok, error: ok ? null : (detail ?? "").slice(0, 200),
    });
    results.push({ id: row.id, ok, detail });
  }
  return NextResponse.json({ ok: true, processed: due.length, sent: results.filter((r) => r.ok).length, results });
}
