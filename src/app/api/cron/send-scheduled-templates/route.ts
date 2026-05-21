// Cron: cada minuto procesa plantillas Meta programadas vencidas.
// Llama al edge function inbox-v2-server (send-template / broadcast/template).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!, process.env.BLOG_SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });
const EDGE_BASE = `${process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL}/functions/v1/inbox-v2-server`;
const ANON_KEY = process.env.NEXT_PUBLIC_BLOG_SUPABASE_ANON_KEY!;
const INBOX_SECRET = process.env.INBOX_SECRET ?? process.env.INSIGHTS_SECRET ?? "REDACTED_SECRET";
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // Vercel cron envía Authorization: Bearer CRON_SECRET
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: due, error } = await sb
    .from("whatsapp_scheduled_templates_v2")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!due || due.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ANON_KEY}`,
    "x-inbox-secret": INBOX_SECRET,
  };

  const results = [];
  for (const row of due) {
    // marcar attempt antes de intentar (idempotencia básica)
    await sb.from("whatsapp_scheduled_templates_v2").update({ attempts: (row.attempts ?? 0) + 1, updated_at: new Date().toISOString() }).eq("id", row.id);

    try {
      let url: string;
      let body: any;
      if (row.scope === "single") {
        url = `${EDGE_BASE}/conversations/${encodeURIComponent(row.conversation_id)}/send-template`;
        body = {
          template_name: row.template_name,
          language: row.language,
          from_number: row.from_number,
          components: row.components ?? [],
          agent_name: "scheduler",
        };
      } else {
        url = `${EDGE_BASE}/broadcast/template`;
        body = {
          template_name: row.template_name,
          language: row.language,
          from_number: row.from_number,
          agent_name: "scheduler",
        };
        if (Array.isArray(row.recipients) && row.recipients.length > 0) body.recipients = row.recipients;
        else if (Array.isArray(row.phones) && row.phones.length > 0) {
          body.phones = row.phones;
          body.components = row.components ?? [];
        }
      }

      const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        await sb.from("whatsapp_scheduled_templates_v2").update({
          status: "sent",
          sent_at: new Date().toISOString(),
          result: j,
          last_error: null,
          updated_at: new Date().toISOString(),
        }).eq("id", row.id);
        results.push({ id: row.id, ok: true });
      } else {
        // Reintento hasta 3 veces; al 4º intento → failed
        const next = row.attempts ?? 0;
        const finalStatus = next >= 3 ? "failed" : "pending";
        await sb.from("whatsapp_scheduled_templates_v2").update({
          status: finalStatus,
          last_error: `${r.status} ${j?.error ?? "error"}`,
          result: j,
          updated_at: new Date().toISOString(),
        }).eq("id", row.id);
        results.push({ id: row.id, ok: false, http: r.status, error: j?.error });
      }
    } catch (e: any) {
      const next = row.attempts ?? 0;
      const finalStatus = next >= 3 ? "failed" : "pending";
      await sb.from("whatsapp_scheduled_templates_v2").update({
        status: finalStatus,
        last_error: String(e?.message ?? e).slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq("id", row.id);
      results.push({ id: row.id, ok: false, exception: String(e?.message ?? e) });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
