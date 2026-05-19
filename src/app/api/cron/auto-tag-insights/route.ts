// Cron que auto-attacha tags a conversaciones basándose en su insight Voyage:
// busca tag_master cuyo nombre/keywords coincide con palabras de dolor_principal,
// temas_terapia, momento_vital, motivo_compra. Idempotente (si el tag ya está, salta).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ").trim();
}

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("authorization");
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 1) Tags master
  const { data: tagsRaw } = await sb.from("tags_mentesana").select("id, name, keywords").limit(500);
  const tags = (tagsRaw ?? []).map((t: any) => {
    const fromName = normalize(t.name ?? "").split(" ").filter((w: string) => w.length >= 4);
    const fromKw: string[] = Array.isArray(t.keywords) ? t.keywords.map((k: any) => normalize(String(k))) : [];
    const keywords = Array.from(new Set([...fromName, ...fromKw])).filter(Boolean);
    return { id: t.id as string, name: t.name as string, keywords };
  });
  if (tags.length === 0) return NextResponse.json({ ok: true, processed: 0, note: "no tags in master" });

  // 2) Insights recientes (últimas 24h)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: insights } = await sb
    .from("conversation_insights")
    .select("conversation_id, dolor_principal, temas_terapia, momento_vital, motivo_compra, objeciones, triggers_compra")
    .gte("updated_at", since)
    .limit(300);

  if (!insights || insights.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  // 3) Existing tags por conv
  const convIds = insights.map((i: any) => i.conversation_id);
  const { data: existing } = await sb
    .from("conversation_tags_mentesana")
    .select("conversation_id, tag_id")
    .in("conversation_id", convIds);
  const existingByConv = new Map<string, Set<string>>();
  for (const e of existing ?? []) {
    if (!existingByConv.has(e.conversation_id)) existingByConv.set(e.conversation_id, new Set());
    existingByConv.get(e.conversation_id)!.add(e.tag_id);
  }

  let attached = 0;
  const toInsert: { conversation_id: string; tag_id: string; auto: boolean }[] = [];

  for (const ins of insights) {
    const bag = [
      ins.dolor_principal,
      ins.momento_vital,
      ins.motivo_compra,
      Array.isArray(ins.temas_terapia) ? ins.temas_terapia.join(" ") : "",
      Array.isArray(ins.objeciones) ? ins.objeciones.join(" ") : "",
      Array.isArray(ins.triggers_compra) ? ins.triggers_compra.join(" ") : "",
    ].filter(Boolean).join(" ");
    const haystack = normalize(bag);
    if (!haystack) continue;
    const haystackTokens = new Set(haystack.split(" "));
    const have = existingByConv.get(ins.conversation_id) ?? new Set<string>();

    for (const tag of tags) {
      if (have.has(tag.id)) continue;
      const matched = tag.keywords.some((k) => k.includes(" ") ? haystack.includes(k) : haystackTokens.has(k));
      if (!matched) continue;
      toInsert.push({ conversation_id: ins.conversation_id, tag_id: tag.id, auto: true });
      have.add(tag.id);
      attached++;
    }
  }

  if (toInsert.length > 0) {
    // ignora conflictos (UNIQUE conversation_id+tag_id)
    const { error } = await sb.from("conversation_tags_mentesana").upsert(toInsert, { onConflict: "conversation_id,tag_id", ignoreDuplicates: true });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, scanned_insights: insights.length, attached, tags_in_master: tags.length });
}
