// Cron diario de las plantillas automáticas del chat de la app (src/lib/app-outreach.ts).
// Se ejecuta a las 9:00 de Madrid: Vercel programa en UTC, así que vercel.json lo dispara a las 07:00 y
// a las 08:00 UTC y aquí solo sigue adelante la llamada que cae a las 9 en Europe/Madrid (CEST/CET).
// ?force=1 salta esa comprobación (pruebas). Auth: Bearer CRON_SECRET.
// Solo ENVÍA si APP_OUTREACH_AUTO=1 (si no, devuelve el plan sin tocar nada). Tope diario
// APP_OUTREACH_DAILY_LIMIT (def. 120): primero las continuaciones del remark (paso ≥2, son días
// consecutivos) y después el resto por prioridad del plan.
import { NextRequest, NextResponse } from "next/server";
import { sbApp, sbBlog } from "@/lib/support-start-chat";
import { buildOutreachPlan, runOutreach } from "@/lib/app-outreach";

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
    return NextResponse.json({ ok: true, sent: 0, skipped: `fuera de hora: son las ${hora}:00 en Madrid y se ejecuta a las ${RUN_HOUR_MADRID}:00` });
  }
  const app = sbApp(), blog = sbBlog();
  if (!app || !blog) return NextResponse.json({ error: "supabase_envs_missing" }, { status: 503 });

  const autoOn = (process.env.APP_OUTREACH_AUTO ?? "").trim() === "1";
  const limit = Math.max(1, Math.min(300, Number(process.env.APP_OUTREACH_DAILY_LIMIT ?? 120) || 120));
  try {
    const plan = await buildOutreachPlan({ app, blog });
    const summary = { auto: autoOn, hora_madrid: hora, amelia_ok: plan.amelia_ok, counts: plan.counts, candidates: plan.candidates.length, skipped: plan.skipped.length, warnings: plan.warnings };
    if (!autoOn) return NextResponse.json({ ok: true, sent: 0, mode: "dry (APP_OUTREACH_AUTO≠1)", ...summary });
    if (!plan.amelia_ok) return NextResponse.json({ ok: false, sent: 0, mode: "abortado: Amelia no responde", ...summary }, { status: 503 });
    const esContinuacion = (c: { rule: string; step: number | null }) => c.rule === "remark" && (c.step ?? 1) > 1;
    const batch = [...plan.candidates.filter(esContinuacion), ...plan.candidates.filter((c) => !esContinuacion(c))].slice(0, limit);
    const r = await runOutreach({ candidates: batch, agent: null, app, blog, source: "cron" });
    console.log(`[cron app-outreach] enviados ${r.sent}/${r.total} (fallidos ${r.failed}) batch ${r.batch_id}`);
    return NextResponse.json({ ok: true, mode: "auto", limit, batch_id: r.batch_id, total: r.total, sent: r.sent, failed: r.failed, pendientes_manana: Math.max(0, plan.candidates.length - batch.length), ...summary });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
