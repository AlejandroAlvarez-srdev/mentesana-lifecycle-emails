// Ruta individual (test manual) de la secuencia RECUPERACIÓN LEAD SIN COMPRA.
// En producción la dispara el cron unificado /api/cron/recuperacion-emails.
// SALIDA AUTOMÁTICA: en cuanto el lead agenda (session_scheduled_at/scheduled_date)
// o paga (paid=true), deja de aparecer en la query → sale de la secuencia y su
// recordatorio pasa a la ametralladora "Confirma tu cita".
import { NextRequest, NextResponse } from "next/server";
import { runLeadSinCompra } from "@/lib/flujos-recuperacion-runners";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const res = await runLeadSinCompra();
  return NextResponse.json({ ok: true, ...res });
}
