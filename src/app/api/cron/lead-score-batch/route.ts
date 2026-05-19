// Cron horario que calcula lead score para convs nuevas o con score viejo (>7d).
// Limita a 30 por invocación para no agotar Voyage/Claude.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeLeadScore, saveLeadScore } from "@/lib/lead-score";

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
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  // Priorizar: convs activas (no pagadas, no perdidas) sin score reciente
  const { data: pending } = await sb
    .from("conversations_mentesana")
    .select("id")
    .or(`predicted_score_at.is.null,predicted_score_at.lt.${sevenDaysAgo}`)
    .not("status", "in", "(pagado,perdido,cerrado)")
    .order("last_message_time", { ascending: false, nullsFirst: false })
    .limit(30);
  if (!pending || pending.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  let ok = 0, failed = 0;
  for (const c of pending) {
    try {
      const r = await computeLeadScore(c.id);
      if (r) { await saveLeadScore(c.id, r); ok++; } else failed++;
    } catch { failed++; }
    await new Promise((r) => setTimeout(r, 300)); // suave con APIs
  }
  return NextResponse.json({ ok: true, scanned: pending.length, scored: ok, failed });
}
