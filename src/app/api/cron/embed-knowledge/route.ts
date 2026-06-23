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

  const stats = { upserted: { meta: 0, diagnostico: 0, notes: 0, complaints: 0, video_briefs: 0, patient_tasks: 0, funnel: 0 }, embedded: 0, errors: 0 };

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

  // ─── 7) FUNNEL: conversión diagnóstico 9,99€ (cita) → bono (paquete) ───
  // Todo agregado, sin ningún paciente individual. Da a JARVIS el contexto del embudo:
  // cuántos de los que hacen el diagnóstico compran luego un bono, en cuánto tiempo, qué bono y cuánto ingresan.
  try {
    const DIAG_SVCS = [8, 11]; // "Sesion Individual - 9,99" y "- 9,99 - Home"
    const BONO_FAMILIES: Record<string, number[]> = {
      "Felicidad": [5, 10, 11, 14, 15],
      "Compañía": [4, 9, 12, 16, 17],
      "Amor": [6],
    };
    const BONO_IDS = Object.values(BONO_FAMILIES).flat();
    const familyOf = (pid: number) => Object.entries(BONO_FAMILIES).find(([, ids]) => ids.includes(Number(pid)))?.[0] ?? "Otro";

    const cb = ameliaTable("customer_bookings");
    const ab = ameliaTable("appointments");
    const pc = ameliaTable("packages_to_customers");

    // Cohorte: clientes que hicieron el diagnóstico 9,99€, con la fecha de su primer diagnóstico.
    const diag = await ameliaQuery<any>(
      `SELECT cb.customerId cid, MIN(a.bookingStart) first_diag
       FROM ${cb} cb JOIN ${ab} a ON a.id = cb.appointmentId
       WHERE a.serviceId IN (${DIAG_SVCS.join(",")}) AND cb.status NOT IN ('canceled','rejected')
       GROUP BY cb.customerId`,
    );
    // Compras de bono aprobadas.
    const bonos = await ameliaQuery<any>(
      `SELECT customerId cid, packageId pid, price, purchased
       FROM ${pc} WHERE status='approved' AND packageId IN (${BONO_IDS.join(",")}) AND purchased IS NOT NULL`,
    );
    const bonoByCust = new Map<number, any[]>();
    for (const b of bonos) { const arr = bonoByCust.get(b.cid) ?? []; arr.push(b); bonoByCust.set(b.cid, arr); }

    const cohortTotal = diag.length;
    let converted = 0, daysSum = 0, daysCount = 0, revenue = 0;
    const famCount: Record<string, number> = { "Felicidad": 0, "Compañía": 0, "Amor": 0, "Otro": 0 };
    const monthly = new Map<string, { cohort: number; conv: number }>();

    for (const d of diag) {
      const firstDiag = new Date(d.first_diag);
      const ym = firstDiag.toISOString().slice(0, 7);
      const mrow = monthly.get(ym) ?? { cohort: 0, conv: 0 };
      mrow.cohort++;
      // Primer bono comprado en o después del diagnóstico = conversión forward.
      const after = (bonoByCust.get(d.cid) ?? [])
        .filter((b) => new Date(b.purchased).getTime() >= firstDiag.getTime() - 86400000)
        .sort((a, b) => new Date(a.purchased).getTime() - new Date(b.purchased).getTime());
      if (after.length > 0) {
        const first = after[0];
        converted++; mrow.conv++;
        revenue += Number(first.price ?? 0);
        famCount[familyOf(first.pid)] = (famCount[familyOf(first.pid)] ?? 0) + 1;
        const days = (new Date(first.purchased).getTime() - firstDiag.getTime()) / 86400000;
        if (days >= 0) { daysSum += days; daysCount++; }
      }
      monthly.set(ym, mrow);
    }

    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
    const avgDays = daysCount > 0 ? Math.round(daysSum / daysCount) : null;
    const famPct = Object.fromEntries(Object.entries(famCount).filter(([, v]) => v > 0).map(([k, v]) => [k, pct(v, converted)]));

    const overall = `Funnel diagnóstico→bono (datos reales del CRM, agregado). De ${cohortTotal} pacientes que hicieron el diagnóstico de 9,99€, ${converted} compraron después un bono → conversión cita→paquete del ${pct(converted, cohortTotal)}%. Tiempo medio del diagnóstico a la compra del bono: ${avgDays ?? "—"} días. Ingresos generados por esos bonos: ${Math.round(revenue)}€. Bono elegido tras convertir: ${Object.entries(famPct).map(([k, v]) => `${k} ${v}%`).join(", ")}.`;
    await sb.from("jarvis_knowledge").upsert({ kind: "funnel", source_id: "diag-to-bono-overall", title: "Funnel diagnóstico→bono (global)", content: overall, metadata: { cohort: cohortTotal, converted, conversion_pct: pct(converted, cohortTotal), avg_days: avgDays, revenue: Math.round(revenue), by_bono: famPct }, updated_at: new Date().toISOString(), embedding: null }, { onConflict: "kind,source_id" });
    stats.upserted.funnel++;

    // Filas mensuales (últimos 12 meses con cohorte) para retrieval granular.
    const months = [...monthly.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
    for (const [ym, m] of months) {
      const content = `Funnel mensual ${ym}: ${m.cohort} pacientes hicieron el diagnóstico 9,99€, ${m.conv} convirtieron a bono (conversión cita→paquete ${pct(m.conv, m.cohort)}%).`;
      await sb.from("jarvis_knowledge").upsert({ kind: "funnel", source_id: `diag-to-bono-${ym}`, title: `Funnel ${ym}`, content, metadata: { month: ym, cohort: m.cohort, converted: m.conv, conversion_pct: pct(m.conv, m.cohort) }, updated_at: new Date().toISOString(), embedding: null }, { onConflict: "kind,source_id" });
      stats.upserted.funnel++;
    }
  } catch (e) { console.error("funnel embed", e); stats.errors++; }

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
