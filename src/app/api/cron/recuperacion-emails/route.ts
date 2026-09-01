// Cron UNIFICADO de las secuencias de recuperación (1 solo slot de Vercel):
//  · carrito_abandonado (llegó a la pasarela, no pagó)
//  · lead_sin_compra   (dejó email en el gate, no agendó ni pagó)
// Cada corrida envía como mucho 1 paso por destinatario y secuencia.
// Cron cada 30 min. Auth: Bearer CRON_SECRET.
import { NextRequest, NextResponse } from "next/server";
import { runCarritoAbandonado, runLeadSinCompra, runPostCitaSinCompra } from "@/lib/flujos-recuperacion-runners";
import { runUpsellPostSesion } from "@/lib/flujos-upsell-runner";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const results = [];
  for (const run of [runCarritoAbandonado, runLeadSinCompra, runPostCitaSinCompra, runUpsellPostSesion]) {
    try { results.push(await run()); }
    catch (e) { results.push({ automation: run.name, candidates: 0, sent: 0, errors: [String((e as Error)?.message ?? e).slice(0, 120)] }); }
  }
  return NextResponse.json({ ok: true, results });
}
