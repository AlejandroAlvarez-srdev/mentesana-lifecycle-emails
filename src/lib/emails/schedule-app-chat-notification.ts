import { createClient } from "@supabase/supabase-js";

// Coalescing: al agendar una notificación para una conversación, si ya hay
// una fila pending (sent_at IS NULL) se incrementa el contador y se actualiza
// last_message_body. El primer scheduled_for (first_message + 15min) se
// respeta, así que 10 mensajes seguidos = 1 solo email al minuto 15.
//
// Fire-and-forget: llamar desde el endpoint reply DESPUÉS de que el backend
// confirme el send. Si esta función falla, el mensaje ya está entregado —
// el email es best-effort, nunca bloquea el reply.
export async function scheduleAppChatNotification({
  conversationId,
  userEmail,
  userName,
  messageBody,
  delayMinutes = 15,
  agentEmail,
  agentName,
}: {
  conversationId: string;
  userEmail: string;
  userName?: string | null;
  messageBody?: string | null;
  delayMinutes?: number;
  agentEmail?: string | null;
  agentName?: string | null;
}): Promise<{ scheduled: boolean; coalesced: boolean; error?: string }> {
  if (!conversationId || !userEmail) return { scheduled: false, coalesced: false, error: "missing_params" };

  const url = (process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL ?? "").replace(/\n/g, "").trim();
  const key = (process.env.BLOG_SUPABASE_SERVICE_KEY ?? "").replace(/\n/g, "").trim();
  if (!url || !key) return { scheduled: false, coalesced: false, error: "blog_envs_missing" };
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const now = new Date();
  const scheduledFor = new Date(now.getTime() + delayMinutes * 60_000).toISOString();
  const preview = (messageBody ?? "").slice(0, 500);

  // Verificar si hay fila pending
  const { data: existing, error: readErr } = await sb
    .from("app_chat_email_queue")
    .select("id, message_count")
    .eq("conversation_id", conversationId)
    .is("sent_at", null)
    .maybeSingle();

  if (readErr) return { scheduled: false, coalesced: false, error: readErr.message };

  if (existing) {
    // Preserva agent_email del primer mensaje del batch (quien inició la conv
    // sigue siendo el reply-to natural aunque respondan varios agentes).
    const { error: updErr } = await sb
      .from("app_chat_email_queue")
      .update({
        message_count: (existing.message_count ?? 1) + 1,
        last_message_at: now.toISOString(),
        last_message_body: preview,
        user_email: userEmail,
        user_name: userName ?? null,
      })
      .eq("id", existing.id);
    if (updErr) return { scheduled: false, coalesced: true, error: updErr.message };
    return { scheduled: true, coalesced: true };
  }

  const { error: insErr } = await sb.from("app_chat_email_queue").insert({
    conversation_id: conversationId,
    user_email: userEmail,
    user_name: userName ?? null,
    first_message_at: now.toISOString(),
    last_message_at: now.toISOString(),
    last_message_body: preview,
    scheduled_for: scheduledFor,
    message_count: 1,
    agent_email: agentEmail ?? null,
    agent_name: agentName ?? null,
  });
  if (insErr) return { scheduled: false, coalesced: false, error: insErr.message };
  return { scheduled: true, coalesced: false };
}
