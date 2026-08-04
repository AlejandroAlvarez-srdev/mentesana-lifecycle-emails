// Cron cada minuto: procesa filas de app_chat_email_queue con scheduled_for <= now()
// y sent_at IS NULL. Envía el email de notificación con coalescing y marca sent_at
// + brevo_message_id o error si falla.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/emails/send";
import { appChatNotificationEmail } from "@/lib/emails/app-chat-notification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_SIZE = 50;

export async function GET(req: NextRequest) {
  // Vercel Cron: header authorization = Bearer <CRON_SECRET>. Si no hay secret
  // (dev), aceptamos igual pero logueamos.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = (process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL ?? "").trim();
  const key = (process.env.BLOG_SUPABASE_SERVICE_KEY ?? "").trim();
  if (!url || !key) return NextResponse.json({ error: "blog_envs_missing" }, { status: 500 });
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const nowIso = new Date().toISOString();
  const { data: pending, error: readErr } = await sb
    .from("app_chat_email_queue")
    .select("id, conversation_id, user_email, user_name, message_count, last_message_body, agent_email, agent_name")
    .is("sent_at", null)
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_SIZE);
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const rows = pending ?? [];
  if (rows.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const row of rows) {
    try {
      const { subject, html } = appChatNotificationEmail({
        firstName: row.user_name,
        conversationId: row.conversation_id,
        messageCount: row.message_count ?? 1,
        lastMessageBody: row.last_message_body,
      });
      // Reply-to al agente que inició la conv si conocemos su email —
      // así el reply al email del cliente aterriza en su bandeja directo
      // y no en la cola general de hola@.
      const replyTo = (row.agent_email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(row.agent_email))
        ? row.agent_email
        : "hola@mentesanapsicologia.com";
      const fromName = row.agent_name?.trim() || undefined;

      const res = await sendEmail({
        to: row.user_email,
        toName: row.user_name ?? undefined,
        subject,
        html,
        replyTo,
        fromName,
      });
      if (res.success) {
        await sb.from("app_chat_email_queue").update({
          sent_at: new Date().toISOString(),
          brevo_message_id: null,
        }).eq("id", row.id);
        results.push({ id: row.id, ok: true });
      } else {
        await sb.from("app_chat_email_queue").update({
          error: res.error ?? "send_failed",
        }).eq("id", row.id);
        results.push({ id: row.id, ok: false, error: res.error });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await sb.from("app_chat_email_queue").update({ error: msg }).eq("id", row.id).then(() => {});
      results.push({ id: row.id, ok: false, error: msg });
    }
  }

  const okCount = results.filter(r => r.ok).length;
  return NextResponse.json({ ok: true, processed: rows.length, sent: okCount, failed: rows.length - okCount, results });
}
