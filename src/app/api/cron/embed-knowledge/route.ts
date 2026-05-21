// Cada 30 min: extrae datos nuevos y los embebe en jarvis_knowledge para que JARVIS busque por semántica.
// Fuentes: meta_ad_insights (anuncios), diagnostico_tests (expectations + perfil), psychologist_clinical_notes (highlights),
// psychologist_complaints, video_briefs, patient_tasks.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { voyageEmbed } from "@/lib/voyage-embed";
import { ameliaQuery, ameliaTable } from "@/lib/amelia-db";

const sb = createClient(process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!, process.env.BLOG_SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

type KnowledgeItem = { kind: string; source_id: string; title: string; content: string; metadata: any };

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const got = req.headers.get("authorization") || "";
  if (expected && got !== `Bearer ${expected}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const stats = { upserted: { meta: 0, diagnostico: 0, notes: 0, complaints: 0, video_briefs: 0, patient_tasks: 0 }, embedded: 0, errors: 0 };

  // ─── 1) META ADS — agrega por fb_ad_id últimos 30d ───
  try {
    const { data: rows } = await sb.from("meta_ad_insights").select("fb_ad_id, ad_name, campaign_name, adset_name, spend, impressions, clicks, results, purchase_value, frequency, roas, thumbstop_rate").gte("date_start", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)).limit(5000);
    const ads = new Map<string, any>();
    for (const r of rows ?? []) {
      if (!r.fb_ad_id) continue;
      const cur = ads.get(r.fb_ad_id) ?? { fb_ad_id: r.fb_ad_id, ad_name: r.ad_name, campaign: r.campaign_name, adset: r.adset_name, spend: 0, impressions: 0, clicks: 0, results: 0, purchase_value: 0, frequency: 0, roas_sum: 0, roas_count: 0 };
      cur.spend += Number(r.spend ?? 0); cur.impressions += Number(r.impressions ?? 0); cur.clicks += Number(r.clicks ?? 0);
      cur.results += Number(r.results ?? 0); cur.purchase_value += Number(r.purchase_value ?? 0);
      cur.frequency = Math.max(cur.frequency, Number(r.frequency ?? 0));
      if (r.roas) { cur.roas_sum += Number(r.roas); cur.roas_count++; }
      ads.set(r.fb_ad_id, cur);
    }
    for (const a of ads.values()) {
      const ctr = a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(2) : "0";
      const cpa = a.results > 0 ? (a.spend / a.results).toFixed(2) : "—";
      const roas = a.roas_count > 0 ? (a.roas_sum / a.roas_count).toFixed(2) : "—";
      const content = `Anuncio Meta: "${a.ad_name}" en campaña "${a.campaign}" adset "${a.adset}". 30 días: gastó ${a.spend.toFixed(0)}€, ${a.impressions} impresiones, ${a.clicks} clicks, ${a.results} conversiones, CTR ${ctr}%, frecuencia ${a.frequency.toFixed(2)}, CPA ${cpa}€, ROAS ${roas}x.`;
      await sb.from("jarvis_knowledge").upsert({ kind: "meta_ad", source_id: a.fb_ad_id, title: a.ad_name, content, metadata: { spend: a.spend, results: a.results, roas: a.roas_count > 0 ? a.roas_sum / a.roas_count : null }, updated_at: new Date().toISOString(), embedding: null }, { onConflict: "kind,source_id" });
      stats.upserted.meta++;
    }
  } catch (e) { console.error("meta embed prep", e); stats.errors++; }

  // ─── 2) DIAGNOSTICO TESTS — expectations + perfil ───
  try {
    const { data: tests } = await sb.from("diagnostico_tests").select("id, perfil_nombre, perfil_urgencia, expectations, scores").gte("created_at", new Date(Date.now() - 90 * 86400000).toISOString()).limit(1500);
    for (const t of tests ?? []) {
      const exp = typeof t.expectations === "string" ? t.expectations : JSON.stringify(t.expectations ?? {});
      if (!exp || exp.length < 30) continue;
      const content = `Test diagnóstico. Perfil: ${t.perfil_nombre ?? "?"} (urgencia ${t.perfil_urgencia ?? "?"}). Lo que el paciente expresa esperar de la terapia: ${exp.slice(0, 1500)}`;
      await sb.from("jarvis_knowledge").upsert({ kind: "diagnostico_test", source_id: String(t.id), title: t.perfil_nombre ?? "Test", content, metadata: { urgencia: t.perfil_urgencia, perfil: t.perfil_nombre }, updated_at: new Date().toISOString(), embedding: null }, { onConflict: "kind,source_id" });
      stats.upserted.diagnostico++;
    }
  } catch (e) { console.error("diag embed", e); stats.errors++; }

  // ─── 3) CLINICAL NOTES — highlights y red flags (anonymizadas, NO se incluye PII) ───
  try {
    const { data: notes } = await sb.from("psychologist_clinical_notes").select("appointment_id, provider_id, highlights, red_flags, attended, session_date").gte("session_date", new Date(Date.now() - 90 * 86400000).toISOString()).not("highlights", "is", null).limit(2000);
    for (const n of notes ?? []) {
      if (!n.highlights || n.highlights.length < 30) continue;
      const content = `Nota clínica psicóloga ${n.provider_id} (cita ${n.appointment_id}, ${n.attended ? "asistida" : "no asistió"}): ${n.highlights}${n.red_flags ? ` · ALERTA: ${n.red_flags}` : ""}`;
      await sb.from("jarvis_knowledge").upsert({ kind: "clinical_note", source_id: String(n.appointment_id), title: `Nota cita ${n.appointment_id}`, content, metadata: { provider_id: n.provider_id, attended: n.attended, has_red_flag: !!n.red_flags }, updated_at: new Date().toISOString(), embedding: null }, { onConflict: "kind,source_id" });
      stats.upserted.notes++;
    }
  } catch (e) { console.error("notes embed", e); stats.errors++; }

  // ─── 4) COMPLAINTS ───
  try {
    const { data: comps } = await sb.from("psychologist_complaints").select("id, provider_id, subject, description, severity, status, created_at").gte("created_at", new Date(Date.now() - 365 * 86400000).toISOString()).limit(500);
    for (const c of comps ?? []) {
      const content = `Queja interna contra psicóloga ${c.provider_id} (severidad ${c.severity}, estado ${c.status}): ${c.subject}${c.description ? ` — ${c.description}` : ""}`;
      await sb.from("jarvis_knowledge").upsert({ kind: "complaint", source_id: c.id, title: c.subject, content, metadata: { provider_id: c.provider_id, severity: c.severity, status: c.status }, updated_at: new Date().toISOString(), embedding: null }, { onConflict: "kind,source_id" });
      stats.upserted.complaints++;
    }
  } catch (e) { console.error("complaints embed", e); stats.errors++; }

  // ─── 5) VIDEO BRIEFS ───
  try {
    const { data: briefs } = await sb.from("video_briefs").select("id, title, description, brief_type, status, tags").gte("created_at", new Date(Date.now() - 180 * 86400000).toISOString()).limit(500);
    for (const b of briefs ?? []) {
      const content = `Brief de video tipo ${b.brief_type} (${b.status}): "${b.title}". ${b.description ?? ""}`;
      await sb.from("jarvis_knowledge").upsert({ kind: "video_brief", source_id: b.id, title: b.title, content, metadata: { brief_type: b.brief_type, status: b.status, tags: b.tags ?? [] }, updated_at: new Date().toISOString(), embedding: null }, { onConflict: "kind,source_id" });
      stats.upserted.video_briefs++;
    }
  } catch (e) { console.error("briefs embed", e); stats.errors++; }

  // ─── 6) PATIENT TASKS (anonimizadas) ───
  try {
    const { data: ptasks } = await sb.from("patient_tasks").select("id, provider_id, title, description, status, created_at").gte("created_at", new Date(Date.now() - 90 * 86400000).toISOString()).limit(1000);
    for (const t of ptasks ?? []) {
      const content = `Tarea asignada por psi ${t.provider_id} a paciente (${t.status}): "${t.title}". ${t.description ?? ""}`;
      await sb.from("jarvis_knowledge").upsert({ kind: "patient_task", source_id: t.id, title: t.title, content, metadata: { provider_id: t.provider_id, status: t.status }, updated_at: new Date().toISOString(), embedding: null }, { onConflict: "kind,source_id" });
      stats.upserted.patient_tasks++;
    }
  } catch (e) { console.error("ptasks embed", e); stats.errors++; }

  // ─── EMBEBER LOS QUE NO TIENEN EMBEDDING ───
  // Procesa en lotes de 50 para no exceder rate limit Voyage.
  const { data: pending } = await sb.from("jarvis_knowledge").select("id, content").is("embedding", null).limit(200);
  for (const item of pending ?? []) {
    try {
      const emb = await voyageEmbed(item.content, "document");
      if (!emb) { stats.errors++; continue; }
      await sb.from("jarvis_knowledge").update({ embedding: `[${emb.join(",")}]` as any, embedded_at: new Date().toISOString() }).eq("id", item.id);
      stats.embedded++;
    } catch (e) { stats.errors++; console.error("embed err", e); }
  }

  return NextResponse.json({ ok: true, stats });
}
