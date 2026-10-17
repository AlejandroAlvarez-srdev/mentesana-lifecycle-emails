// Cron diario de las plantillas automáticas por WhatsApp (src/lib/wa-outreach.ts).
// Corre a las 9:30 de Madrid, media hora después del de la app, para que el log de la app ya esté y el
// cooldown cruzado evite escribir dos veces a la misma persona. vercel.json lo dispara a las 07:30 y
// 08:30 UTC y aquí solo sigue la llamada que cae a las 9:xx en Europe/Madrid. ?force=1 salta el check.
// Auth: Bearer CRON_SECRET. Solo PROGRAMA envíos si WA_OUTREACH_AUTO=1; si no, devuelve el plan en seco.
// Tope diario WA_OUTREACH_DAILY_LIMIT (def. 150, además del tope por número de la config); continuaciones
// del remark (paso ≥2) primero.
import { NextRequest, NextResponse } from "next/server";
import { sbApp, sbBlog } from "@/lib/support-start-chat";
import { buildWaOutreachPlan, runWaOutreach } from "@/lib/wa-outreach";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;
const RUN_HOUR_MADRID = 9;

function horaMadrid(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", hourCycle: "h23" }).format(now));
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const force = req.nextUrl.searchParams.get("force") === "1";
  const hora = horaMadrid();
  if (!force && hora !== RUN_HOUR_MADRID) {
    return NextResponse.json({ ok: true, scheduled: 0, skipped: `fuera de hora: son las ${hora}:xx en Madrid y se ejecuta a las ${RUN_HOUR_MADRID}:30` });
  }
  const blog = sbBlog();
  if (!blog) return NextResponse.json({ error: "blog_env_missing" }, { status: 503 });
  const autoOn = (process.env.WA_OUTREACH_AUTO ?? "").trim() === "1";
  const limit = Math.max(1, Math.min(600, Number(process.env.WA_OUTREACH_DAILY_LIMIT ?? 150) || 150));
  try {
    const plan = await buildWaOutreachPlan({ blog, app: sbApp() });
    const summary = { auto: autoOn, hora_madrid: hora, amelia_ok: plan.amelia_ok, counts: plan.counts, candidates: plan.candidates.length, skipped: plan.skipped.length, numbers: plan.numbers.filter((n) => n.enabled).map((n) => ({ name: n.name, sent_today: n.sent_today, planned: n.planned })), warnings: plan.warnings };
    if (!autoOn) return NextResponse.json({ ok: true, scheduled: 0, mode: "dry (WA_OUTREACH_AUTO≠1)", ...summary });
    if (!plan.amelia_ok) return NextResponse.json({ ok: false, scheduled: 0, mode: "abortado: Amelia no responde", ...summary }, { status: 503 });
    const esContinuacion = (c: { rule: string; step: number | null }) => c.rule === "remark" && (c.step ?? 1) > 1;
    const batch = [...plan.candidates.filter(esContinuacion), ...plan.candidates.filter((c) => !esContinuacion(c))].slice(0, limit);
    const r = await runWaOutreach({ candidates: batch, blog, createdBy: "cron", source: "cron", delayMinutes: plan.config.delay_minutes });
    console.log(`[cron wa-outreach] programados ${r.scheduled}/${r.total} (fallidos ${r.failed}) lote ${r.batch_id} para ${r.scheduled_for}`);
    return NextResponse.json({ ok: true, mode: "auto", limit, ...r, pendientes_manana: Math.max(0, plan.candidates.length - batch.length), ...summary });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
