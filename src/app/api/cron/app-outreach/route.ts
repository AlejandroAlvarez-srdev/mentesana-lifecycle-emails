// Cron diario de las plantillas automáticas del chat de la app (src/lib/app-outreach.ts).
// Auth: Bearer CRON_SECRET. Solo ENVÍA si APP_OUTREACH_AUTO=1 (si no, devuelve el plan sin tocar nada,
// para poder vigilarlo antes de activarlo). Tope diario APP_OUTREACH_DAILY_LIMIT (def. 120).
// El remark 1→6 necesita esta pasada diaria para avanzar un paso por día.
import { NextRequest, NextResponse } from "next/server";
import { sbApp, sbBlog } from "@/lib/support-start-chat";
import { buildOutreachPlan, runOutreach } from "@/lib/app-outreach";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const app = sbApp(), blog = sbBlog();
  if (!app || !blog) return NextResponse.json({ error: "supabase_envs_missing" }, { status: 503 });

  const autoOn = (process.env.APP_OUTREACH_AUTO ?? "").trim() === "1";
  const limit = Math.max(1, Math.min(300, Number(process.env.APP_OUTREACH_DAILY_LIMIT ?? 120) || 120));
  try {
    const plan = await buildOutreachPlan({ app, blog });
    const summary = { auto: autoOn, amelia_ok: plan.amelia_ok, counts: plan.counts, candidates: plan.candidates.length, skipped: plan.skipped.length, warnings: plan.warnings };
    if (!autoOn) return NextResponse.json({ ok: true, sent: 0, mode: "dry (APP_OUTREACH_AUTO≠1)", ...summary });
    if (!plan.amelia_ok) return NextResponse.json({ ok: false, sent: 0, mode: "abortado: Amelia no responde", ...summary }, { status: 503 });
    const r = await runOutreach({ candidates: plan.candidates.slice(0, limit), agent: null, app, blog, source: "cron" });
    console.log(`[cron app-outreach] enviados ${r.sent}/${r.total} (fallidos ${r.failed}) batch ${r.batch_id}`);
    return NextResponse.json({ ok: true, mode: "auto", limit, batch_id: r.batch_id, total: r.total, sent: r.sent, failed: r.failed, ...summary });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
