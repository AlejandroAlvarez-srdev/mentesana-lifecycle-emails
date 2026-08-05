// GET /api/cron/terapia-hold-cleanup
// Vercel Cron: cada 5 min libera holds terapia vencidos (status='pending' con
// ms_status='HoldPreStripe:<expires_iso>' donde expires < now).
import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredHolds } from "@/lib/terapia/hold-slot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const r = await cleanupExpiredHolds();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "cleanup_failed" }, { status: 500 });
  }
}
