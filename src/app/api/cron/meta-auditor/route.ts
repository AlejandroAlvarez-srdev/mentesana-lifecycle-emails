// Cron cada 6h: ejecuta el Meta Auditor Agent.
import { NextRequest, NextResponse } from "next/server";
import { runMetaAuditor } from "@/lib/meta-auditor";

const CRON_SECRET = process.env.CRON_SECRET;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id, report } = await runMetaAuditor();
    return NextResponse.json({ ok: true, report_id: id, findings: report.findings.length, high: report.findings.filter(f => f.severity === "high").length, actions_taken: (report.actions_taken ?? []).length });
  } catch (e: any) {
    return NextResponse.json({ error: "auditor_failed", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
