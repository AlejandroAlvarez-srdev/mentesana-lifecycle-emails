// GET /api/cron/bienvenida-ametralladora
//
// "Ametralladora" post-reserva de citas de bienvenida — dispara emails y
// mensajes de WhatsApp en cadencia agresiva HASTA que el paciente confirme
// (`confirmed_at IS NOT NULL`) o hasta que el slot haya pasado (~30 min de
// gracia). Se ejecuta cada 5 minutos vía Vercel Cron.
//
// Cadencia (post-reserva → hasta confirmed):
//   step_email_2min          · T+2min                        · Email "Confirma tu cita — 2 min"
//   step_email_descarga_app  · T+30min (si app_login IS NULL)· Email "Descarga la app"
//   step_wa_15min            · T+15min                       · WhatsApp "te esperamos el {slot}"
//   step_email_2h            · T+2h                          · Email "{psi} tiene tu hueco parado"
//   step_email_acceso_app    · T+30min desde app_login_at    · Email suave "Ya estás en la app"
//   step_email_manana        · T-24h (approx)                · Email "Mañana es tu bienvenida"
//   step_wa_manana           · T-24h (approx)                · WhatsApp "Mañana ({slot}) tu sesión"
//   step_email_atencion      · T-6h del slot                 · Email URGENTE (agresivo)
//   step_wa_en2h             · T-2h                          · WhatsApp "En 2h empieza tu sesión"
//   step_push_en2h           · T-2h                          · Push (skipped: solo app nativa)
//   step_push_meet           · T-15min                       · Push con {meet_url} (skipped)
//
// Idempotencia: cada step se guarda en `bienvenida_reservas.sent_steps` (text[]).
// Nunca se reenvía el mismo step para la misma reserva. La query también filtra
// `confirmed_at IS NULL` para PARAR toda la ametralladora en cuanto confirmen.
//
// Cortes por login en la app (nuevo):
//   Si `app_login_at IS NOT NULL AND confirmed_at IS NULL` la fila entra en
//   modo "logged_not_confirmed": el paciente ya está dentro de la app, así que
//   los canales ruidosos (WA, push, email agresivo, email descarga) se saltan
//   y SOLO se dispara `step_email_acceso_app` como recordatorio suave.
//   Si ambos son NULL → modo "ametralladora_completa" (comportamiento clásico).
//
// Auth: Bearer CRON_SECRET (mismo patrón que el resto de crons).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/emails/send";
import {
  emailBienvenidaConfirma2min,
  emailBienvenidaRecordatorio2h,
  emailBienvenidaManana,
  emailBienvenidaDescargaApp,
  emailBienvenidaAccesoApp,
  emailBienvenidaAtencionAgresivo,
  emailBienvenidaHuecoRiesgo12h,
  type BienvenidaEmailProps,
  type BienvenidaAppEmailProps,
  type RenderedEmail,
} from "@/emails/bienvenida-templates";
import {
  waBienvenidaConfirma15min,
  waBienvenidaManana,
  waBienvenidaEn2h,
  type BienvenidaWaProps,
  type WaTemplateDescriptor,
} from "@/emails/bienvenida-wa-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const SITE = "https://mentesanapsicologia.com";
const CRON_SECRET = process.env.CRON_SECRET;

const EDGE_BASE = `${process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL}/functions/v1/inbox-v2-server`;
const ANON_KEY = process.env.NEXT_PUBLIC_BLOG_SUPABASE_ANON_KEY ?? "";
const INBOX_SECRET = process.env.INBOX_SECRET ?? process.env.INSIGHTS_SECRET ?? "REDACTED_SECRET";

const sb = createClient(
  (process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL ?? "").replace(/\\n/g, "").trim(),
  (process.env.BLOG_SUPABASE_SERVICE_KEY ?? "").replace(/\\n/g, "").trim(),
  { auth: { persistSession: false } },
);

// ─── Cadencia ─────────────────────────────────────────────────────────────

type StepId =
  | "step_email_2min"
  | "step_email_descarga_app"
  | "step_wa_15min"
  | "step_email_2h"
  | "step_email_acceso_app"
  | "step_email_manana"
  | "step_wa_manana"
  | "step_email_riesgo_12h"
  | "step_email_atencion"
  | "step_wa_en2h"
  | "step_push_en2h"
  | "step_push_meet";

type Channel = "email" | "whatsapp" | "push";

interface StepDef {
  id: StepId;
  channel: Channel;
  /** Offset relativo a `created_at` (ms). null → se ancla al slot / app_login en su lugar. */
  offsetFromCreatedMs: number | null;
  /** Offset relativo a `slot_iso` (ms, negativo = antes del slot). */
  offsetFromSlotMs: number | null;
  /**
   * Offset relativo a `app_login_at` (ms). Solo aplica en modo
   * "logged_not_confirmed". Si es null, no depende del login.
   */
  offsetFromLoginMs?: number | null;
}

// Nota: el orden importa solo para la salida del log — el `elapsed` decide qué dispara.
const CADENCE: StepDef[] = [
  { id: "step_email_2min",         channel: "email",    offsetFromCreatedMs: 2 * 60_000,        offsetFromSlotMs: null },
  { id: "step_email_descarga_app", channel: "email",    offsetFromCreatedMs: 30 * 60_000,       offsetFromSlotMs: null },
  { id: "step_wa_15min",           channel: "whatsapp", offsetFromCreatedMs: 15 * 60_000,       offsetFromSlotMs: null },
  { id: "step_email_2h",           channel: "email",    offsetFromCreatedMs: 2 * 3600_000,      offsetFromSlotMs: null },
  { id: "step_email_acceso_app",   channel: "email",    offsetFromCreatedMs: null,              offsetFromSlotMs: null, offsetFromLoginMs: 30 * 60_000 },
  { id: "step_email_manana",       channel: "email",    offsetFromCreatedMs: null,              offsetFromSlotMs: -24 * 3600_000 },
  { id: "step_wa_manana",          channel: "whatsapp", offsetFromCreatedMs: null,              offsetFromSlotMs: -24 * 3600_000 },
  { id: "step_email_riesgo_12h",   channel: "email",    offsetFromCreatedMs: null,              offsetFromSlotMs: -12 * 3600_000 },
  { id: "step_email_atencion",     channel: "email",    offsetFromCreatedMs: null,              offsetFromSlotMs: -6 * 3600_000 },
  { id: "step_wa_en2h",            channel: "whatsapp", offsetFromCreatedMs: null,              offsetFromSlotMs: -2 * 3600_000 },
  { id: "step_push_en2h",          channel: "push",     offsetFromCreatedMs: null,              offsetFromSlotMs: -2 * 3600_000 },
  { id: "step_push_meet",          channel: "push",     offsetFromCreatedMs: null,              offsetFromSlotMs: -15 * 60_000 },
];

/**
 * Cadencia EFECTIVA = CADENCE hardcodeada + overrides del panel /admin/flujos
 * (tabla `flow_step_config`). Cualquier fallo (tabla ausente, error, vacío) cae
 * a la CADENCE hardcodeada → comportamiento idéntico y CERO riesgo de romper el
 * envío. El panel solo puede: (a) desactivar un paso, (b) cambiar su offset.
 * El TIPO de ancla (created/slot/login) nunca cambia.
 */
interface EffectiveStep extends StepDef { active: boolean }

async function loadEffectiveCadence(): Promise<EffectiveStep[]> {
  const base: EffectiveStep[] = CADENCE.map((s) => ({ ...s, active: true }));
  try {
    const { data, error } = await sb
      .from("flow_step_config")
      .select("step_id, active, offset_from_created_ms, offset_from_slot_ms, offset_from_login_ms")
      .eq("flow", "bienvenida");
    if (error || !data || data.length === 0) return base;
    const byId = new Map<string, Record<string, unknown>>(
      data.map((r: Record<string, unknown>) => [String(r.step_id), r]),
    );
    return base.map((s) => {
      const o = byId.get(s.id);
      if (!o) return s;
      const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
      return {
        ...s,
        active: o.active !== false,
        offsetFromCreatedMs: o.offset_from_created_ms != null ? num(o.offset_from_created_ms) : s.offsetFromCreatedMs,
        offsetFromSlotMs: o.offset_from_slot_ms != null ? num(o.offset_from_slot_ms) : s.offsetFromSlotMs,
        offsetFromLoginMs: o.offset_from_login_ms != null ? num(o.offset_from_login_ms) : s.offsetFromLoginMs,
      };
    });
  } catch (e) {
    console.warn("[ametralladora] loadEffectiveCadence fallback:", (e as Error).message);
    return base;
  }
}

/**
 * Único step permitido específicamente en modo logged_not_confirmed. Además
 * es el único que se ancla a `app_login_at` (recordatorio 30min post-login).
 *
 * En modo logged_not_confirmed, TODOS los demás steps se saltan (WA, push,
 * email agresivo, email descarga). Regla implementada en `stepAllowedForMode`.
 */
const STEP_ONLY_WHEN_LOGGED: StepId = "step_email_acceso_app";

type ReservaMode = "confirmed" | "logged_not_confirmed" | "ametralladora_completa";

function classifyReserva(r: ReservaRow): ReservaMode {
  if (r.confirmed_at) return "confirmed";
  if (r.app_login_at) return "logged_not_confirmed";
  return "ametralladora_completa";
}

/**
 * Decide si un step está permitido para el modo actual de la fila.
 * Se aplica ANTES de comprobar el timing en el loop principal Y también
 * defensivamente en cada handler (por si el modo cambió mid-run).
 */
function stepAllowedForMode(stepId: StepId, mode: ReservaMode): boolean {
  if (mode === "confirmed") return false;
  if (mode === "logged_not_confirmed") return stepId === STEP_ONLY_WHEN_LOGGED;
  // ametralladora_completa: todo permitido excepto el step exclusivo de login
  return stepId !== STEP_ONLY_WHEN_LOGGED;
}

// ─── Types ────────────────────────────────────────────────────────────────

interface ReservaRow {
  id: number;
  appointment_id: number;
  email: string | null;
  name: string | null;
  full_name: string | null;
  phone: string | null;
  angulo: string | null;
  psi_name: string | null;
  slot_iso: string | null;
  confirmed_at: string | null;
  created_at: string | null;
  meet_url: string | null;
  sent_steps: string[] | null;
  /** ISO timestamp de la primera apertura de la app tras la reserva. */
  app_login_at: string | null;
}

interface StepAction {
  reserva: ReservaRow;
  step: StepDef;
}

interface StepResult {
  appointment_id: number;
  step: StepId;
  channel: Channel;
  ok: boolean;
  detail?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatSlotLocal(iso: string | null): string {
  if (!iso) return "próximamente";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(ms));
}

/**
 * Devuelve true si el step ya debería haberse disparado según los offsets.
 * Los steps anclados a `app_login_at` requieren que loginMs sea finito — si el
 * paciente aún no ha entrado a la app, nunca se marcan como due.
 */
function stepIsDue(
  step: StepDef,
  createdMs: number,
  slotMs: number,
  nowMs: number,
  loginMs: number,
): boolean {
  if (step.offsetFromLoginMs !== null && step.offsetFromLoginMs !== undefined) {
    if (!Number.isFinite(loginMs)) return false;
    return nowMs >= loginMs + step.offsetFromLoginMs;
  }
  if (step.offsetFromCreatedMs !== null) {
    return nowMs >= createdMs + step.offsetFromCreatedMs;
  }
  if (step.offsetFromSlotMs !== null) {
    return nowMs >= slotMs + step.offsetFromSlotMs;
  }
  return false;
}

/** Marca el step como enviado sin sobrescribir concurrentes (usa append). */
async function markSentStep(reservaId: number, currentSent: string[], stepId: StepId): Promise<void> {
  const next = Array.from(new Set([...currentSent, stepId]));
  const { error } = await sb
    .from("bienvenida_reservas")
    .update({ sent_steps: next, updated_at: new Date().toISOString() })
    .eq("id", reservaId);
  if (error) {
    console.error("[ametralladora] mark sent failed", reservaId, stepId, error.message);
  }
}

function buildEmailProps(r: ReservaRow): BienvenidaEmailProps {
  const displayName = r.name ?? r.full_name ?? "";
  return {
    name: displayName,
    angulo: r.angulo ?? "",
    psiName: r.psi_name ?? "tu psicóloga",
    slotLocal: formatSlotLocal(r.slot_iso),
    confirmUrl: `${SITE}/app/bienvenida/confirmar?a=${r.appointment_id}`,
  };
}

/** Props para los emails "app-only" (descarga + acceso). */
function buildAppEmailProps(r: ReservaRow): BienvenidaAppEmailProps {
  const displayName = r.name ?? r.full_name ?? "";
  return {
    name: displayName,
    angulo: r.angulo ?? "",
    confirmUrl: `${SITE}/app/bienvenida/confirmar?a=${r.appointment_id}`,
  };
}

function buildWaProps(r: ReservaRow): BienvenidaWaProps {
  const displayName = r.name ?? r.full_name ?? "";
  return {
    name: displayName,
    psiName: r.psi_name ?? "tu psicóloga",
    slotLocal: formatSlotLocal(r.slot_iso),
    confirmUrl: `${SITE}/app/bienvenida/confirmar?a=${r.appointment_id}`,
  };
}

// ─── Senders ──────────────────────────────────────────────────────────────

async function sendEmailStep(
  r: ReservaRow,
  rendered: RenderedEmail,
): Promise<{ ok: boolean; detail?: string }> {
  if (!r.email) return { ok: false, detail: "no_email" };
  const res = await sendEmail({
    to: r.email,
    toName: r.name ?? r.full_name ?? undefined,
    subject: rendered.subject,
    html: rendered.html,
  });
  return { ok: res.success, detail: res.error };
}

/**
 * Envía plantilla WhatsApp aprobada a través de la Edge Function del inbox-v2.
 * Requiere que exista una conversación para el phone (o la creamos on-the-fly
 * con el mismo patrón que /api/cron/send-scheduled-templates).
 */
async function sendWaStep(
  r: ReservaRow,
  descriptor: WaTemplateDescriptor,
): Promise<{ ok: boolean; detail?: string }> {
  if (!r.phone) return { ok: false, detail: "no_phone" };
  if (!ANON_KEY) return { ok: false, detail: "missing_supabase_anon_key" };

  const phone = r.phone.replace(/\s+/g, "");

  // Las 3 plantillas bienvenida_*_v1 viven en el WABA REDACTED_ID
  // (número Mente Sana +34 XXX XXX XXX). Los demás WABAs (Soporte, Ventas)
  // tienen restringida la creación de plantillas nuevas por Meta.
  // Hardcodeamos el phone_number_id para que broadcast/template use el WABA
  // correcto — el is_default global sigue siendo Soporte para el resto de flujos.
  const fromNumber = process.env.BIENVENIDA_WA_PHONE_NUMBER_ID ?? "REDACTED_ID";

  // Ensure conversación existe (para que broadcast persista el msg en messages_mentesana).
  try {
    const { data: existing } = await sb
      .from("conversations_mentesana")
      .select("id")
      .eq("phone", phone)
      .limit(1)
      .maybeSingle();
    if (!existing) {
      const newId = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      await sb.from("conversations_mentesana").insert({
        id: newId,
        phone,
        lead_name: r.name ?? r.full_name ?? null,
        status: "sin_contactar",
        client_type: "ventas",
        pipeline_type: "ventas",
        source: "bienvenida",
        notes: `Creada por cron bienvenida-ametralladora (appointment ${r.appointment_id})`,
      });
    }
  } catch (e) {
    console.warn("[ametralladora] ensure-conv failed for", phone, (e as Error).message);
  }

  // Enviar via broadcast/template (con phones=[x]) — mismo patrón que send-scheduled-templates.
  try {
    const res = await fetch(`${EDGE_BASE}/broadcast/template`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
        "x-inbox-secret": INBOX_SECRET,
      },
      body: JSON.stringify({
        template_name: descriptor.template_name,
        language: descriptor.language,
        from_number: fromNumber,
        phones: [phone],
        components: descriptor.components,
        agent_name: "bienvenida-ametralladora",
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, detail: `edge_${res.status}: ${txt.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}

/** Push web: por ahora solo app nativa. Log + skip idempotente. */
async function sendPushStep(
  r: ReservaRow,
  step: StepId,
): Promise<{ ok: boolean; detail?: string }> {
  console.log(`[ametralladora] push_skipped: app-native only · appointment=${r.appointment_id} step=${step}`);
  // Devolvemos ok=true para marcarlo como "procesado" y no seguir intentando en cada cron.
  return { ok: true, detail: "push_skipped: app-native only" };
}

// ─── Dispatch por step ────────────────────────────────────────────────────

async function dispatchStep(action: StepAction): Promise<StepResult> {
  const { reserva, step } = action;
  const base: StepResult = {
    appointment_id: reserva.appointment_id,
    step: step.id,
    channel: step.channel,
    ok: false,
  };

  try {
    if (step.channel === "email") {
      // Segundo gate defensivo: recomprobamos el modo por si cambió mid-run.
      const mode = classifyReserva(reserva);
      if (!stepAllowedForMode(step.id, mode)) {
        return { ...base, detail: `blocked_by_mode:${mode}` };
      }

      let rendered: RenderedEmail;
      switch (step.id) {
        case "step_email_2min":
          rendered = emailBienvenidaConfirma2min(buildEmailProps(reserva));
          break;
        case "step_email_2h":
          rendered = emailBienvenidaRecordatorio2h(buildEmailProps(reserva));
          break;
        case "step_email_manana":
          rendered = emailBienvenidaManana(buildEmailProps(reserva));
          break;
        case "step_email_descarga_app":
          // Salvaguarda: si mientras tanto el paciente entró a la app, no
          // enviamos el push a descargarla (redundante).
          if (reserva.app_login_at) {
            return { ...base, ok: true, detail: "skip_already_logged_in" };
          }
          rendered = emailBienvenidaDescargaApp(buildAppEmailProps(reserva));
          break;
        case "step_email_acceso_app":
          // Solo tiene sentido si sigue logueado y sin confirmar.
          if (!reserva.app_login_at) {
            return { ...base, detail: "skip_no_app_login" };
          }
          rendered = emailBienvenidaAccesoApp(buildAppEmailProps(reserva));
          break;
        case "step_email_riesgo_12h":
          rendered = emailBienvenidaHuecoRiesgo12h({
            name: reserva.name ?? reserva.full_name ?? "",
            psiName: reserva.psi_name ?? "tu psicóloga",
            slotLocal: formatSlotLocal(reserva.slot_iso),
            confirmUrl: `${SITE}/app/bienvenida/confirmar?a=${reserva.appointment_id}`,
          });
          break;
        case "step_email_atencion":
          rendered = emailBienvenidaAtencionAgresivo({
            name: reserva.name ?? reserva.full_name ?? "",
            psiName: reserva.psi_name ?? "tu psicóloga",
            slotLocal: formatSlotLocal(reserva.slot_iso),
            confirmUrl: `${SITE}/app/bienvenida/confirmar?a=${reserva.appointment_id}`,
          });
          break;
        default:
          return { ...base, detail: "unknown_email_step" };
      }
      const r = await sendEmailStep(reserva, rendered);
      return { ...base, ok: r.ok, detail: r.detail };
    }

    if (step.channel === "whatsapp") {
      const mode = classifyReserva(reserva);
      if (!stepAllowedForMode(step.id, mode)) {
        return { ...base, detail: `blocked_by_mode:${mode}` };
      }
      const props = buildWaProps(reserva);
      let descriptor: WaTemplateDescriptor;
      switch (step.id) {
        case "step_wa_15min":
          descriptor = waBienvenidaConfirma15min(props);
          break;
        case "step_wa_manana":
          descriptor = waBienvenidaManana(props);
          break;
        case "step_wa_en2h":
          descriptor = waBienvenidaEn2h(props);
          break;
        default:
          return { ...base, detail: "unknown_wa_step" };
      }
      const r = await sendWaStep(reserva, descriptor);
      return { ...base, ok: r.ok, detail: r.detail };
    }

    if (step.channel === "push") {
      const mode = classifyReserva(reserva);
      if (!stepAllowedForMode(step.id, mode)) {
        return { ...base, detail: `blocked_by_mode:${mode}` };
      }
      const r = await sendPushStep(reserva, step.id);
      return { ...base, ok: r.ok, detail: r.detail };
    }

    return { ...base, detail: "unknown_channel" };
  } catch (e) {
    return { ...base, detail: (e as Error).message };
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const nowMs = Date.now();
  const graceCutoffIso = new Date(nowMs - 30 * 60_000).toISOString();

  // Fetch reservas activas: sin confirmar y con slot todavía en el futuro
  // (con 30 min de gracia para no cortar el push T-15min si el cron tarda).
  const { data: reservas, error } = await sb
    .from("bienvenida_reservas")
    .select("id, appointment_id, email, name, full_name, phone, angulo, psi_name, slot_iso, confirmed_at, created_at, meet_url, sent_steps, app_login_at")
    .is("confirmed_at", null)
    .gt("slot_iso", graceCutoffIso)
    .order("slot_iso", { ascending: true })
    .limit(200);

  if (error) {
    console.error("[ametralladora] fetch error:", error.message);
    return NextResponse.json({ error: "fetch_failed", detail: error.message }, { status: 500 });
  }
  if (!reservas || reservas.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, results: [] });
  }

  // Cadencia efectiva (defaults + overrides del panel). Se carga UNA vez por tick.
  const cadence = await loadEffectiveCadence();

  const results: StepResult[] = [];
  const errors: string[] = [];

  for (const raw of reservas) {
    const r = raw as ReservaRow;
    const createdMs = r.created_at ? Date.parse(r.created_at) : NaN;
    const slotMs = r.slot_iso ? Date.parse(r.slot_iso) : NaN;
    const loginMs = r.app_login_at ? Date.parse(r.app_login_at) : NaN;
    if (!Number.isFinite(createdMs) || !Number.isFinite(slotMs)) continue;

    // Gate 1 (query ya excluye confirmed_at != null): recomprobamos por si acaso.
    const mode = classifyReserva(r);
    if (mode === "confirmed") continue;

    const alreadySent = new Set(r.sent_steps ?? []);

    // Recorrer cadencia y disparar todos los steps vencidos aún no enviados.
    // Nota: en cada tick del cron pueden ser 0, 1 o varios (por si perdemos ejecuciones).
    for (const step of cadence) {
      if (alreadySent.has(step.id)) continue;
      // Gate 0: paso desactivado desde el panel /admin/flujos.
      if (!step.active) continue;
      // Gate 2: filtrar por modo antes de mirar timing (evita trabajo inútil).
      if (!stepAllowedForMode(step.id, mode)) continue;
      if (!stepIsDue(step, createdMs, slotMs, nowMs, loginMs)) continue;

      const res = await dispatchStep({ reserva: r, step });
      results.push(res);
      if (res.ok) {
        await markSentStep(r.id, [...alreadySent], step.id);
        alreadySent.add(step.id);
      } else {
        errors.push(`${r.appointment_id}:${step.id}:${res.detail ?? "unknown"}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    processed: reservas.length,
    dispatched: results.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    errors: errors.slice(0, 20),
    error_count: errors.length,
    results: results.slice(0, 50),
  });
}
