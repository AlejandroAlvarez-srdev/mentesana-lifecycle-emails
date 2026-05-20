// Cron diario que evalúa convs CERRADAS de la última semana sin score Quality.
// Limita a 20 por invocación.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scoreAgentConversation, saveQualityScore } from "@/lib/quality-score";

const sb = createClient(
  process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("authorization");
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Convs con actividad reciente con assigned_to (= un agente) que aún no tienen quality_score
  const sevenDays = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: convs } = await sb
    .from("conversations_mentesana")
    .select("id, assigned_to")
    .not("assigned_to", "is", null)
    .gte("last_message_time", sevenDays)
    .in("status", ["pagado", "perdido", "cerrado", "seguimiento_3", "seguimiento_4"])
    .order("last_message_time", { ascending: false, nullsFirst: false })
    .limit(60);
  if (!convs || convs.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  // Filtra los que ya tienen score reciente (<7d)
  const ids = convs.map((c: any) => c.id);
  const { data: existing } = await sb.from("agent_quality_scores").select("conversation_id, evaluated_at").in("conversation_id", ids);
  const recentScores = new Set<string>();
  for (const e of existing ?? []) {
    if (Date.now() - new Date(e.evaluated_at).getTime() < 7 * 86400000) recentScores.add(e.conversation_id);
  }
  const todo = convs.filter((c: any) => !recentScores.has(c.id)).slice(0, 20);

  let ok = 0, failed = 0;
  for (const c of todo) {
    try {
      const r = await scoreAgentConversation(c.id, c.assigned_to);
      if (r) { await saveQualityScore(c.id, c.assigned_to, r); ok++; } else failed++;
    } catch { failed++; }
    await new Promise((r) => setTimeout(r, 500));
  }
  return NextResponse.json({ ok: true, scanned: convs.length, todo: todo.length, scored: ok, failed });
}
