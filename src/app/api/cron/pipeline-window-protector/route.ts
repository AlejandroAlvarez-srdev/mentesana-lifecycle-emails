// Cron horario: protege pipelines activos antes de que la ventana 24h Meta cierre.
// Si un pipeline tiene tareas pendientes de tipo whatsapp_text o manual y la ventana cierra <3h,
// inserta una tarea AUTO al inicio de la cola: "Enviar plantilla URGENTE antes de cerrar ventana".
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

const CRON_SECRET = (process.env.CRON_SECRET || "").trim();

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authOk(req: NextRequest): boolean {
  const v = req.headers.get("authorization") ?? "";
  if (CRON_SECRET && v === `Bearer ${CRON_SECRET}`) return true;
  if (CRON_SECRET && req.headers.get("x-cron-secret") === CRON_SECRET) return true;
  if (!CRON_SECRET && process.env.NODE_ENV !== "production") return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const t0 = Date.now();

  // 1) Pipelines activos
  const { data: pipelines } = await sb
    .from("customer_pipelines")
    .select("id, phone, conversation_id, agent_id")
    .eq("status", "active")
    .not("conversation_id", "is", null);
  if (!pipelines || pipelines.length === 0) return NextResponse.json({ ok: true, inserted: 0, duration_ms: Date.now() - t0 });

  // 2) Para cada pipeline, leer info de ventana 24h
  let inserted = 0;
  const errors: any[] = [];
  for (const p of pipelines) {
    try {
      const { data: win } = await sb.rpc("conversation_window_info", { conv_id: p.conversation_id });
      const wd: any = win;
      if (!wd) continue;
      const status = wd.window_status;
      const minutesLeft = Number(wd.minutes_left ?? 0);

      // Decidir tipo de protección según estado de ventana
      // - expiring_soon: ventana ABIERTA pero cerrando en <3h → texto libre urgente (no plantilla)
      // - expired: ventana CERRADA → solo plantilla aprobada puede reactivar
      let taskKind: "whatsapp_text" | "whatsapp_template" | null = null;
      let title = "";
      let desc = "";
      let trigger = "";

      if (status === "expiring_soon" && minutesLeft <= 180 && minutesLeft > 0) {
        taskKind = "whatsapp_text";
        title = `🚨 Mensaje URGENTE — ventana cierra en ${minutesLeft}m`;
        desc = `La ventana 24h de Meta cierra en ${minutesLeft} minutos. Mándale cualquier mensaje normal (no plantilla) para resetear el contador a 24h. Si esperas y cierra, ya solo podrás reabrirla con plantilla aprobada.`;
        trigger = `ventana_abierta_cierra_${minutesLeft}m`;
      } else if (status === "expired") {
        taskKind = "whatsapp_template";
        title = "🔴 Ventana cerrada — reactivar con plantilla";
        desc = "La conversación lleva más de 24h cerrada. La única forma de reabrirla es enviar una plantilla Meta aprobada. Elige una adecuada al perfil.";
        trigger = "ventana_cerrada";
      } else {
        continue; // ventana abierta con margen, no hacer nada
      }

      // ¿Ya hay tarea auto_inserted PENDING para este pipeline?
      const { data: existing } = await sb
        .from("pipeline_tasks")
        .select("id, status, action_kind")
        .eq("pipeline_id", p.id)
        .eq("auto_inserted", true)
        .eq("status", "pending");
      if ((existing ?? []).length > 0) continue;

      const { data: conv } = await sb.from("conversations_mentesana").select("id, assigned_to, client_type, lead_name").eq("id", p.conversation_id).single();
      const { data: maxPos } = await sb.from("pipeline_tasks").select("position").eq("pipeline_id", p.id).order("position", { ascending: false }).limit(1).single();
      const nextPos = (maxPos?.position ?? 0) + 1;

      const { error: insErr } = await sb.from("pipeline_tasks").insert({
        pipeline_id: p.id,
        position: nextPos,
        title,
        description: desc,
        action_kind: taskKind,
        action_payload: null,
        trigger,
        due_at: new Date().toISOString(),
        status: "pending",
        assigned_to: conv?.assigned_to ?? p.agent_id,
        client_type: conv?.client_type ?? null,
        auto_inserted: true,
      });
      if (insErr) { errors.push({ pipeline_id: p.id, err: insErr.message }); continue; }
      inserted++;
    } catch (e: any) {
      errors.push({ pipeline_id: p.id, err: String(e?.message ?? e) });
    }
  }

  return NextResponse.json({ ok: true, inserted, errors_count: errors.length, errors: errors.slice(0, 5), duration_ms: Date.now() - t0 });
}
