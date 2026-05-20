// Cron — corre cada hora. Crea notificaciones para tareas cuyo due_at se acerca
// (24h antes, 1h antes, vencidas hoy) y envía emails de recordatorio.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/emails/send";
import { emailLayout } from "@/lib/emails/layout";

const sb = createClient(process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!, process.env.BLOG_SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel Cron añade Authorization: Bearer <CRON_SECRET>
  const expected = process.env.CRON_SECRET;
  const got = req.headers.get("authorization") || "";
  if (expected && got !== `Bearer ${expected}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = Date.now();
  const in25h = new Date(now + 25 * 3600_000).toISOString();
  const in23h = new Date(now + 23 * 3600_000).toISOString();
  const { data: tasks } = await sb.from("panel_tasks").select("*").eq("status", "open").not("due_at", "is", null).lte("due_at", in25h);
  if (!tasks) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const t of tasks) {
    const due = new Date(t.due_at).getTime();
    const hoursLeft = (due - now) / 3600_000;
    let kind: string | null = null;
    if (hoursLeft < 0) kind = "task_overdue";
    else if (hoursLeft <= 1) kind = "task_due_1h";
    else if (hoursLeft <= 24 && hoursLeft >= 23) kind = "task_due_24h";
    if (!kind) continue;

    // Evita duplicados — si ya hay una notif del mismo kind para este task, skip
    const { data: existing } = await sb.from("panel_notifications").select("id").eq("task_id", t.id).eq("kind", kind).maybeSingle();
    if (existing) continue;

    const title = kind === "task_overdue" ? `⚠️ Tarea VENCIDA: ${t.title}` : kind === "task_due_1h" ? `⏰ Tarea en 1h: ${t.title}` : `📆 Tarea mañana: ${t.title}`;
    await sb.from("panel_notifications").insert({ recipient_type: t.assignee_type, recipient_ref: t.assignee_ref, kind, title, body: t.description, task_id: t.id });

    const email = t.assignee_ref.includes("@") ? t.assignee_ref : null;
    if (email) {
      const dueTxt = new Date(t.due_at).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
      const content = `
        <p style="margin:0 0 12px;font-size:15px;color:#1a0a1f;">Recordatorio de tarea pendiente:</p>
        <div style="padding:14px;background:rgba(220,38,38,0.06);border-left:4px solid #dc2626;border-radius:8px;margin-bottom:14px;">
          <strong style="font-size:15px;">${escapeHtml(t.title)}</strong>
          ${t.description ? `<p style="margin:6px 0 0;font-size:12.5px;color:#475569;">${escapeHtml(t.description)}</p>` : ""}
          <p style="margin:8px 0 0;font-size:12px;color:#666;">📆 ${dueTxt}</p>
        </div>
      `;
      await sendEmail({ to: email, subject: title, html: emailLayout({ title, preheader: t.title, content }) });
      await sb.from("panel_notifications").update({ email_sent_at: new Date().toISOString() }).eq("task_id", t.id).eq("kind", kind);
    }
    sent++;
  }
  return NextResponse.json({ sent, checked: tasks.length });
}
function escapeHtml(s: string): string { return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)); }
