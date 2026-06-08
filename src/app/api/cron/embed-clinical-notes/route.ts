// Cron: embeber historias clínicas que aún no tienen embedding (backfill de las
// que se escribieron antes de activar el RAG + reintento si el embedding inline
// del guardado falló). Corre en producción con la VOYAGE_API_KEY válida.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { voyageEmbed } from "@/lib/voyage-embed";
import { ameliaQuery, ameliaTable } from "@/lib/amelia-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;
const FIELDS = ["highlights", "how_went", "patient_state", "intervention", "next_steps", "homework", "red_flags"] as const;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sb = createClient(
    (process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL || "").trim(),
    (process.env.BLOG_SUPABASE_SERVICE_KEY || "").trim(),
    { auth: { persistSession: false } },
  );

  // HC sin embedding y con al menos un campo de contenido (excluye los guardados
  // de solo-asistencia, que no tienen nada que embeber).
  const { data: rows, error } = await sb
    .from("psychologist_clinical_notes")
    .select("id, customer_id, highlights, how_went, patient_state, intervention, next_steps, homework, red_flags")
    .is("embedding", null)
    .or(FIELDS.map((f) => `${f}.not.is.null`).join(","))
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = (rows ?? []).filter((r: any) => FIELDS.some((f) => r[f] && String(r[f]).trim()));
  if (list.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  // Nombres de pacientes (Amelia) en bloque.
  const cids = [...new Set(list.map((r: any) => r.customer_id).filter(Boolean))] as number[];
  const nameMap = new Map<number, string>();
  if (cids.length) {
    const us = await ameliaQuery<any>(
      `SELECT id, firstName, lastName FROM ${ameliaTable("users")} WHERE id IN (${cids.map(() => "?").join(",")})`,
      cids,
    );
    for (const u of us) nameMap.set(Number(u.id), `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim());
  }

  let ok = 0;
  let failed = 0;
  for (const r of list) {
    try {
      const name = r.customer_id ? nameMap.get(Number(r.customer_id)) || "" : "";
      const text = [
        name ? `Paciente: ${name}` : "",
        r.highlights && `Highlights: ${r.highlights}`,
        r.how_went && `Cómo fue la sesión: ${r.how_went}`,
        r.patient_state && `Estado del paciente: ${r.patient_state}`,
        r.intervention && `Intervención: ${r.intervention}`,
        r.next_steps && `Próximos pasos: ${r.next_steps}`,
        r.homework && `Tareas: ${r.homework}`,
        r.red_flags && `Alertas: ${r.red_flags}`,
      ].filter(Boolean).join("\n");
      const emb = await voyageEmbed(text, "document");
      if (!emb) { failed++; continue; }
      await sb.from("psychologist_clinical_notes")
        .update({ embedding: emb, patient_name: name || null, embedded_at: new Date().toISOString() })
        .eq("id", r.id);
      ok++;
    } catch (e) {
      failed++;
      console.warn("[embed-clinical-notes] fallo HC", r.id, String((e as Error)?.message ?? e).slice(0, 160));
    }
  }

  return NextResponse.json({ ok: true, processed: ok, failed, batch: list.length });
}
