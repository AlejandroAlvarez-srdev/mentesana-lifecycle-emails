// Ruta individual (test manual) de la secuencia CARRITO ABANDONADO.
// En producción la dispara el cron unificado /api/cron/recuperacion-emails.
import { NextRequest, NextResponse } from "next/server";
import { runCarritoAbandonado } from "@/lib/flujos-recuperacion-runners";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const res = await runCarritoAbandonado();
  return NextResponse.json({ ok: true, ...res });
}
