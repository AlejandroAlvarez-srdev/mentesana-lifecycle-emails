// Cron horario que avanza el funnel de seguimiento basado en inactividad del cliente.
// Reglas: si la conv lleva >24h sin INBOUND (cliente no respondió) avanza seguimiento_N → seguimiento_N+1.
// Tras seguimiento_4 + 24h sin inbound → marca como 'perdido'.
// Solo conversaciones sin paid_at/purchase_status='pagado'.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const NEXT_STAGE: Record<string, string> = {
  seguimiento_1: "seguimiento_2",
  seguimiento_2: "seguimiento_3",
  seguimiento_3: "seguimiento_4",
  seguimiento_4: "perdido",
};

export async function GET(req: NextRequest) {
  // Vercel cron auth header
  const cronSecret = req.headers.get("authorization");
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // conversaciones en seguimiento_1..4 cuyo last_inbound (o last_message_time) sea > 24h
  const { data: convs, error } = await sb
    .from("conversations_mentesana")
    .select("id, status, last_inbound_time, last_message_time, paid_at, purchase_status")
    .in("status", ["seguimiento_1", "seguimiento_2", "seguimiento_3", "seguimiento_4"])
    .or("paid_at.is.null,paid_at.is.null")
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let advanced = 0;
  let lost = 0;
  const errs: string[] = [];

  for (const c of convs ?? []) {
    if (c.purchase_status === "pagado" || c.paid_at) continue;
    const lastInbound = (c as any).last_inbound_time ?? c.last_message_time;
    if (!lastInbound) continue;
    if (new Date(lastInbound).toISOString() > cutoff) continue; // todavía dentro de la ventana 24h
    const next = NEXT_STAGE[c.status ?? ""];
    if (!next) continue;
    const patch: any = { status: next, updated_at: new Date().toISOString() };
    if (next === "perdido") patch.purchase_status = "perdido";
    const { error: upErr } = await sb.from("conversations_mentesana").update(patch).eq("id", c.id);
    if (upErr) { errs.push(`${c.id}: ${upErr.message}`); continue; }
    if (next === "perdido") lost++; else advanced++;
  }

  return NextResponse.json({ ok: true, scanned: convs?.length ?? 0, advanced, lost, errors: errs.slice(0, 10) });
}
