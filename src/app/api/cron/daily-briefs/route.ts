// Cron 22:00 + 23:00 UTC (cubre CEST y CET → 00:00 Madrid).
// Genera tareas diarias automáticas para traficker y video makers basadas en data Meta + Amelia.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPanelTask } from "@/lib/panel-tasks";
import { ameliaQuery, ameliaTable } from "@/lib/amelia-db";

const sb = createClient(process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!, process.env.BLOG_SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const got = req.headers.get("authorization") || "";
  if (expected && got !== `Bearer ${expected}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Sólo correr si en Madrid es entre 23:30 y 01:30 — para no duplicar entre los dos cron triggers.
  const hourMadrid = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  if (hourMadrid !== 0 && hourMadrid !== 23) {
    return NextResponse.json({ skipped: true, reason: `hora Madrid ${hourMadrid} fuera de ventana 23-00` });
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const week1Start = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  // Skip si ya hay brief hoy
  const { data: existing } = await sb.from("daily_marketing_briefs").select("id").eq("brief_date", today).maybeSingle();
  if (existing) return NextResponse.json({ skipped: true, reason: "brief de hoy ya generado" });

  // ─── 1) RECOPILA DATA META ───
  const { data: insights7d } = await sb.from("meta_ad_insights").select("*").gte("date_start", week1Start).limit(2000);
  const adAgg = new Map<string, any>();
  for (const r of insights7d ?? []) {
    if (!r.fb_ad_id) continue;
    const k = r.fb_ad_id;
    const cur = adAgg.get(k) ?? { fb_ad_id: k, ad_name: r.ad_name, campaign_name: r.campaign_name, spend: 0, impressions: 0, clicks: 0, frequency: 0, results: 0, purchase_value: 0 };
    cur.spend += Number(r.spend ?? 0);
    cur.impressions += Number(r.impressions ?? 0);
    cur.clicks += Number(r.clicks ?? 0);
    cur.frequency = Math.max(cur.frequency, Number(r.frequency ?? 0));
    cur.results += Number(r.results ?? 0);
    cur.purchase_value += Number(r.purchase_value ?? 0);
    adAgg.set(k, cur);
  }
  const ads = [...adAgg.values()].map(a => ({
    ...a,
    ctr: a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0,
    cpa: a.results > 0 ? a.spend / a.results : null,
    roas: a.spend > 0 ? a.purchase_value / a.spend : null,
  }));

  // ─── 2) ÁNGULOS CREATIVOS via Claude basados en data CRM ───
  const angles = await generateAngles().catch(e => { console.error("angles failed", e); return []; });

  // ─── 3) IDENTIFICA WINNERS Y NEEDS-REFRESH ───
  const winners = ads.filter(a => a.roas !== null && a.roas >= 2 && a.frequency < 2 && a.spend >= 30).sort((a, b) => b.roas - a.roas).slice(0, 3);
  const fatigued = ads.filter(a => a.frequency >= 3.5 && a.spend >= 50).sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  const noConversion = ads.filter(a => a.results === 0 && a.spend >= 50).slice(0, 3);
  const lowCtr = ads.filter(a => a.ctr < 1 && a.spend >= 30 && (a.results === 0 || a.roas === null || a.roas < 1)).slice(0, 3);

  // ─── 4) TAREAS PARA TRAFICKER(S) ───
  const { data: trafs } = await sb.from("trafickers").select("email").eq("active", true);
  const trafEmails = (trafs ?? []).map(t => t.email);
  // Add admin as fallback
  if (trafEmails.length === 0) trafEmails.push("ceo@example.com");

  let tasksCreatedTraf = 0;
  for (const email of trafEmails) {
    for (const f of fatigued.slice(0, 3)) {
      try {
        await createPanelTask({ title: `⏸ Pausar anuncio fatigado: ${f.ad_name}`, description: `Frecuencia ${f.frequency.toFixed(2)} con ${f.spend.toFixed(0)}€ esta semana. Público saturado, hora de descansar este creativo.`, assignee_type: "traficker", assignee_ref: email, assigned_by_email: "bot@example.com", priority: "high", due_at: new Date(Date.now() + 86400000).toISOString() });
        tasksCreatedTraf++;
      } catch (e) { console.error("traf task failed", e); }
    }
    for (const w of winners.slice(0, 2)) {
      try {
        await createPanelTask({ title: `🚀 Escalar ganador: ${w.ad_name}`, description: `ROAS ${w.roas!.toFixed(2)}x, frec ${w.frequency.toFixed(2)}, ${w.spend.toFixed(0)}€ gastado. Sube el presupuesto +30% hoy.`, assignee_type: "traficker", assignee_ref: email, assigned_by_email: "bot@example.com", priority: "high" });
        tasksCreatedTraf++;
      } catch {}
    }
    for (const z of noConversion.slice(0, 2)) {
      try {
        await createPanelTask({ title: `💀 Revisar/pausar: ${z.ad_name}`, description: `${z.spend.toFixed(0)}€ esta semana sin una sola conversión. O hay problema técnico (pixel, link) o el creativo está muerto.`, assignee_type: "traficker", assignee_ref: email, assigned_by_email: "bot@example.com", priority: "normal" });
        tasksCreatedTraf++;
      } catch {}
    }
  }

  // ─── 5) TAREAS PARA VIDEO MAKERS ───
  const { data: makers } = await sb.from("video_makers").select("email, name").eq("active", true);
  const makerEmails = (makers ?? []).map(m => m.email);
  let tasksCreatedMaker = 0;
  if (makerEmails.length > 0) {
    // Distribuir las tareas creativas entre makers (round-robin simple)
    const distribute = (items: any[], makers: string[]) => items.map((it, i) => ({ ...it, _maker: makers[i % makers.length] }));
    const variations = distribute(winners.slice(0, 3), makerEmails);
    const refreshes = distribute([...lowCtr, ...fatigued.slice(0, 2)].slice(0, 4), makerEmails);

    for (const v of variations) {
      try {
        await createPanelTask({
          title: `✨ Crear 3 variaciones de: ${v.ad_name}`,
          description: `Este anuncio funciona MUY bien (ROAS ${v.roas!.toFixed(2)}x). Necesitamos 3 variaciones manteniendo lo que funciona pero cambiando hook/imagen inicial para evitar fatiga.\n\nÁngulos sugeridos del día:\n${angles.map((a, i) => `${i + 1}. ${a}`).join("\n")}`,
          assignee_type: "videomaker", assignee_ref: v._maker, assigned_by_email: "bot@example.com", priority: "high", due_at: new Date(Date.now() + 3 * 86400000).toISOString(),
        });
        tasksCreatedMaker++;
      } catch {}
    }
    for (const r of refreshes) {
      try {
        await createPanelTask({
          title: `🔄 Refresh creativo: ${r.ad_name}`,
          description: `Este anuncio está en declive (CTR ${r.ctr.toFixed(2)}%, frec ${r.frequency.toFixed(2)}, ${r.spend.toFixed(0)}€). Necesita un creativo NUEVO que mantenga la oferta pero cambie completamente el formato.\n\nÁngulos sugeridos del día:\n${angles.map((a, i) => `${i + 1}. ${a}`).join("\n")}`,
          assignee_type: "videomaker", assignee_ref: r._maker, assigned_by_email: "bot@example.com", priority: "normal", due_at: new Date(Date.now() + 5 * 86400000).toISOString(),
        });
        tasksCreatedMaker++;
      } catch {}
    }
  }

  // ─── 6) GUARDA EL BRIEF ───
  await sb.from("daily_marketing_briefs").upsert({
    brief_date: today,
    role: "traficker",
    content: { winners, fatigued, noConversion, lowCtr, angles, tasks_created: tasksCreatedTraf },
  }, { onConflict: "brief_date,role" });

  await sb.from("daily_marketing_briefs").upsert({
    brief_date: today,
    role: "videomaker",
    content: { winners_to_variate: winners.slice(0, 3), refreshes_needed: [...lowCtr, ...fatigued].slice(0, 5), angles, tasks_created: tasksCreatedMaker },
  }, { onConflict: "brief_date,role" });

  return NextResponse.json({
    ok: true,
    date: today,
    traf_tasks: tasksCreatedTraf,
    maker_tasks: tasksCreatedMaker,
    winners: winners.length,
    fatigued: fatigued.length,
    angles_generated: angles.length,
  });
}

async function generateAngles(): Promise<string[]> {
  const ANTHROPIC_KEY = (process.env.ANTHROPIC_API_KEY ?? "").trim();
  if (!ANTHROPIC_KEY) return [];

  // Recopila contexto: perfiles dominantes del diagnostico últimos 30d + top motivos paciente
  let perfilesContext = "Sin datos";
  try {
    const { data: tests } = await sb.from("diagnostico_tests").select("perfil_nombre, expectations").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).limit(200);
    const perfilCount = new Map<string, number>();
    const expectationsArr: string[] = [];
    for (const t of tests ?? []) {
      if (t.perfil_nombre) perfilCount.set(t.perfil_nombre, (perfilCount.get(t.perfil_nombre) ?? 0) + 1);
      if (typeof t.expectations === "string" && t.expectations.length > 20) expectationsArr.push(t.expectations.slice(0, 200));
    }
    const top = [...perfilCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    perfilesContext = `Top perfiles que llegan (últimos 30d): ${top.map(([k, n]) => `${k} (${n})`).join(", ")}\n\nLo que dicen esperar (muestra): ${expectationsArr.slice(0, 8).join(" || ")}`;
  } catch {}

  let convosContext = "";
  try {
    const { data: convos } = await ameliaQuery<any>(`SELECT info FROM ${ameliaTable("customer_bookings")} WHERE info IS NOT NULL AND CHAR_LENGTH(info) > 20 ORDER BY created DESC LIMIT 30`).catch(() => []);
    convosContext = (convos ?? []).map((c: any) => String(c.info ?? "").slice(0, 150)).join(" | ").slice(0, 1500);
  } catch {}

  const system = `Eres copywriter senior especializado en ads para psicología online. Genera 3 ÁNGULOS CREATIVOS distintos para anuncios de Mente Sana (9,99€ diagnóstico + bonos de terapia online en España). Basa tu trabajo en lo que dice REALMENTE la gente que llega.

Cada ángulo en 1 línea: HOOK + PROMESA + DIFERENCIAL.

Ejemplos buenos:
- "¿Llevas meses diciendo 'mañana empiezo terapia'? Por 9,99€ descubres si la necesitas hoy."
- "150 psicólogas. Tú con la que conecta de verdad. Diagnóstico 9,99€."

Sin clichés. Sin "mereces estar bien". Directos, naturales, conversacionales.`;

  const userPrompt = `Contexto:\n${perfilesContext}\n\nFragmentos de conversaciones reales:\n${convosContext.slice(0, 1500)}\n\nDame 3 ángulos para mañana. Solo las 3 líneas, una por línea, sin numerar, sin explicar.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": ANTHROPIC_KEY },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!r.ok) return [];
    const d = await r.json();
    const text = d?.content?.[0]?.text?.trim() ?? "";
    return text.split("\n").map((l: string) => l.trim().replace(/^[-•\d\.\)\s]+/, "")).filter((l: string) => l.length > 10).slice(0, 3);
  } catch (e) {
    console.error("Claude angles failed", e);
    return [];
  }
}
