// Cron cada 2 minutos: clasifica convs sin client_type que tengan mensajes inbound.
// Procesa hasta 25 por ejecución para no agotar APIs.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { classifyConversation, applyAutoRoute } from "@/lib/auto-route";

const sb = createClient(
  process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("authorization");
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Convs SIN client_type con mensaje inbound en últimos 7 días
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: pending } = await sb
    .from("conversations_mentesana")
    .select("id, last_message_time")
    .is("client_type", null)
    .gte("last_message_time", since)
    .order("last_message_time", { ascending: false, nullsFirst: false })
    .limit(40);
  if (!pending || pending.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  let ok = 0, failed = 0;
  let toVentas = 0, toSoporte = 0;
  const errors: string[] = [];
  let processed = 0;
  for (const c of pending) {
    if (processed >= 25) break;
    processed++;
    try {
      const r = await classifyConversation(c.id);
      if (!r) { failed++; continue; }
      await applyAutoRoute(c.id, null, r);
      ok++;
      if (r.client_type === "ventas") toVentas++; else toSoporte++;
    } catch (e: any) {
      failed++;
      errors.push(`${c.id}: ${e?.message ?? e}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return NextResponse.json({ ok: true, scanned: pending.length, processed, routed: ok, failed, to_ventas: toVentas, to_soporte: toSoporte, errors: errors.slice(0, 5) });
}
