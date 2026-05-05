/**
 * GET /api/cron/partners-release-holds
 * Vercel Cron: cada hora pasa comisiones de pending → available cuando hold_until vence.
 * Configurar en vercel.json o Vercel Cron UI: cada hora.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPartnersDb } from "@/lib/partners/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Auth simple por header secret. En Vercel Cron usa CRON_SECRET.
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getPartnersDb();
  const { data, error } = await db.rpc("partners_release_holds");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, released: data });
}
