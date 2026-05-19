// Cron que transcribe audios entrantes de WhatsApp con OpenAI Whisper.
// Procesa messages_mentesana donde media_type='audio' AND transcription IS NULL AND is_lead=true.
// Descarga el blob de Supabase Storage (URL puede ser storage://bucket/path o https), envía a Whisper, guarda transcription.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

const OPENAI_KEY = (process.env.OPENAI_API_KEY ?? "").trim();

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("authorization");
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!OPENAI_KEY) return NextResponse.json({ ok: false, error: "OPENAI_API_KEY missing" }, { status: 500 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await sb
    .from("messages_mentesana")
    .select("id, conversation_id, media_url, media_type, timestamp")
    .eq("media_type", "audio")
    .is("transcription", null)
    .eq("is_lead", true)
    .gte("timestamp", since)
    .order("timestamp", { ascending: false })
    .limit(20);

  if (!rows || rows.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  let ok = 0;
  const errs: string[] = [];

  for (const m of rows) {
    try {
      const url = await resolveMediaUrl(m.media_url ?? "");
      if (!url) { errs.push(`${m.id}: no url`); continue; }
      const audioRes = await fetch(url);
      if (!audioRes.ok) { errs.push(`${m.id}: fetch ${audioRes.status}`); continue; }
      const buf = Buffer.from(await audioRes.arrayBuffer());
      const blob = new Blob([buf], { type: audioRes.headers.get("content-type") ?? "audio/ogg" });

      const form = new FormData();
      form.append("file", blob, "audio.ogg");
      form.append("model", "whisper-1");
      form.append("language", "es");
      form.append("response_format", "json");

      const wr = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_KEY}` },
        body: form,
      });
      if (!wr.ok) { errs.push(`${m.id}: whisper ${wr.status}`); continue; }
      const wd = await wr.json();
      const transcription = (wd?.text ?? "").trim();
      if (!transcription) { errs.push(`${m.id}: empty transcription`); continue; }

      await sb.from("messages_mentesana").update({ transcription }).eq("id", m.id);
      ok++;
    } catch (e: any) {
      errs.push(`${m.id}: ${e?.message ?? e}`);
    }
  }

  return NextResponse.json({ ok: true, scanned: rows.length, transcribed: ok, errors: errs.slice(0, 10) });
}

async function resolveMediaUrl(raw: string): Promise<string | null> {
  if (!raw) return null;
  if (raw.startsWith("storage://")) {
    const m = raw.match(/^storage:\/\/([^/]+)\/(.+)$/);
    if (!m) return null;
    const [, bucket, path] = m;
    const { data } = await sb.storage.from(bucket).createSignedUrl(path, 600);
    return data?.signedUrl ?? null;
  }
  if (raw.startsWith("http")) return raw;
  return null;
}
