// Cron (cada 30 min): envía los justificantes de asistencia pagados que ya tienen sesión
// asistida en Amelia (cubre asistencias marcadas fuera del panel). Ver lib/justificante.
import { NextRequest, NextResponse } from "next/server";
import { cumplirPendientes } from "@/lib/justificante/fulfil";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const CRON_SECRET = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const r = await cumplirPendientes(20);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
