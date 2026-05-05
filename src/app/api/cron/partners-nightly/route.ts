/**
 * GET /api/cron/partners-nightly
 * Cron diario: recalcula leaderboard del mes + tiers de partners activos.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPartnersDb } from "@/lib/partners/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getPartnersDb();

  // 1. Recalcula leaderboard del mes actual
  const ym = new Date().toISOString().slice(0, 7);
  try { await Promise.resolve(db.rpc("partners_recalc_leaderboard" as never, { p_year_month: ym })); } catch {}

  // 2. Recalcula tier de cada partner activo
  const { data: activePartners } = await db.from("partners").select("id").eq("status", "active");
  let tierUpdates = 0;
  for (const p of activePartners || []) {
    try {
      await db.rpc("partners_recalc_tier" as never, { p_partner_id: p.id });
      tierUpdates++;
    } catch {}
  }

  return NextResponse.json({ ok: true, year_month: ym, tier_updates: tierUpdates });
}
