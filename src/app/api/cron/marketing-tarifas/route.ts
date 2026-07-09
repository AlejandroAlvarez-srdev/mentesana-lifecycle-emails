// Cron diario/por tandas: continúa la campaña "oferta de tarifas" enviando un
// lote en cada invocación. Vercel llama a este path con Authorization: Bearer
// <CRON_SECRET>. Reutiliza la ruta de envío probada (no duplica la lógica).
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Nº de correos por invocación. 300 * ~0.5s ≈ 150s, holgado bajo maxDuration.
const BATCH_PER_RUN = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const mts = process.env.MARKETING_TRIGGER_SECRET || process.env.CRON_SECRET;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://mentesanapsicologia.com").replace(/\/$/, "");

  try {
    const r = await fetch(`${base}/api/agent/marketing/tarifas`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${mts}` },
      body: JSON.stringify({ mode: "send", segment: "both", batch: BATCH_PER_RUN }),
    });
    const j = await r.json().catch(() => ({}));
    return NextResponse.json({ cron: "marketing-tarifas", upstream_status: r.status, ...j });
  } catch (e) {
    return NextResponse.json({ cron: "marketing-tarifas", error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
