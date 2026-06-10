// Cron cada minuto: procesa session_notes con summary_status='pending'.
// Llama a Opus 4.7 con el transcript completo y genera el informe clínico.
// Luego embeba el resumen con Voyage para que sirva el RAG.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { voyageEmbed } from "@/lib/voyage-embed";
import { summarizeSessionTranscript } from "@/lib/session-summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 5 sesiones × ~60s cada una → caben en 300s. Con margen para Voyage.
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;
const ANTHROPIC_KEY = (process.env.ANTHROPIC_API_KEY ?? "").replace(/[^\x20-\x7E]/g, "").trim();

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!ANTHROPIC_KEY) return NextResponse.json({ error: "ai_not_configured" }, { status: 500 });

  const sb = createClient(
    (process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL || "").trim(),
    (process.env.BLOG_SUPABASE_SERVICE_KEY || "").trim(),
    { auth: { persistSession: false } },
  );

  // Recuperación: sesiones 'waiting' (checkpoints sin checkpoint FINAL) cuya
  // llamada empezó hace > 3h se asumen terminadas (el final nunca llegó por
  // crash/cierre brusco/red) → se promueven a 'pending' para resumirse igual.
  // Ninguna sesión de terapia dura 3h, así que no pisamos llamadas en curso.
  const STALE_MS = 3 * 60 * 60 * 1000;
  await sb.from("session_notes")
    .update({ summary_status: "pending" })
    .eq("summary_status", "waiting")
    .lt("meet_started_at", new Date(Date.now() - STALE_MS).toISOString());

  // Selecciona hasta 5 pendientes, orden FIFO
  const pending = await sb.from("session_notes")
    .select("id, provider_id, raw_full, raw_excerpt, summary_attempts")
    .eq("summary_status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);
  if (pending.error) return NextResponse.json({ error: pending.error.message }, { status: 500 });
  if (!pending.data || pending.data.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const row of pending.data) {
    // Lock CAS: solo procesamos si seguimos 'pending'
    const lock = await sb.from("session_notes")
      .update({ summary_status: "generating", summary_attempts: (row.summary_attempts ?? 0) + 1 })
      .eq("id", row.id)
      .eq("summary_status", "pending")
      .select("id")
      .maybeSingle();
    if (!lock.data) { results.push({ id: row.id, ok: false, error: "lock_skipped" }); continue; }

    const source = (row.raw_full && row.raw_full.length > 200) ? row.raw_full : (row.raw_excerpt ?? "");
    if (!source || source.length < 80) {
      await sb.from("session_notes").update({
        summary_status: "failed",
        summary_error: "no_transcript_source",
      }).eq("id", row.id);
      results.push({ id: row.id, ok: false, error: "no_transcript" });
      continue;
    }

    try {
      const summary = await summarizeSessionTranscript(source);
      if (!summary || summary.length < 100) throw new Error("summary_too_short");
      let embedding: number[] | null = null;
      try { embedding = await voyageEmbed(summary, "document"); } catch (e) { console.warn("[summarize-sessions] embed err:", (e as Error).message); }

      const updatePayload: Record<string, unknown> = {
        summary_md: summary,
        summary_status: "ready",
      };
      if (embedding) updatePayload.embedding = embedding;
      await sb.from("session_notes").update(updatePayload).eq("id", row.id);
      results.push({ id: row.id, ok: true });
    } catch (e) {
      const attempts = (row.summary_attempts ?? 0) + 1;
      const finalStatus = attempts >= 3 ? "failed" : "pending";
      await sb.from("session_notes").update({
        summary_status: finalStatus,
        summary_error: (e as Error).message.slice(0, 240),
      }).eq("id", row.id);
      results.push({ id: row.id, ok: false, error: (e as Error).message });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
