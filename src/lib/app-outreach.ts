// Plantillas AUTOMÁTICAS por el chat de la app según la situación de cada paciente.
// Reglas (CTO, 17-oct-2026):
//   • Bono activo + psicóloga que ya no está (provider Amelia no 'visible')  → "psi_baja" (saludo).
//   • Bono activo con ≤2 sesiones por usar (0, 1 o 2)                          → "renovacion".
//   • Bono activo que vence en ≤14 días y aún con sesiones (≥3)               → "caducidad" (ampliar vigencia).
//   • Bono activo, ≥2 meses desde su primer bono y sin la 19,99 ofrecida      → "saludo_1999" (sesión extra).
//   • Bono vencido (≤60 días) y sin otro activo                                → "bono_vencido" (renovar).
//   • Pagó el 9,99 (3-60 días) y nunca tuvo bono ni terapia                    → "remark" paso 1→6, un paso por día.
//   • NUNCA a quien pidió devolución/reclamó/dijo que no le interesa o que no le escribamos
//     (patrones en sus mensajes de la app, bajas de marketing y la lista manual app_outreach_optout).
//   • Nada si recibió una plantilla (o cualquier mensaje del equipo en la app) hace <3 días; la misma
//     regla no se repite antes de 14 días; el saludo 19,99 solo se manda una vez.
// Una sola plantilla por paciente y pasada. buildOutreachPlan() calcula el plan (sin enviar) y
// runOutreach() lo envía con startSupportChat (chat de la app + push + email) y lo registra en
// BLOG app_outreach_log (+ un resumen en support_bulk_sends para que cuente como envío masivo).
// Las plantillas viven en BLOG support_message_templates (category 'automatico', slug auto-*).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentProfile } from "@/lib/agent-auth";
import { ameliaQuery, ameliaTable } from "@/lib/amelia-db";
import { EMAIL_RE, personalize, startSupportChat } from "@/lib/support-start-chat";

const DAY = 86_400_000;

export const OUTREACH_CONFIG = {
  cooldownDays: 3,            // regla: nada si hubo plantilla/mensaje del equipo hace <3 días
  ruleRepeatDays: 14,         // la misma regla no se repite antes de N días
  vencidoDias: 60,            // bono vencido hace ≤N días
  venceDias: 14,              // "1 o 2 semanas para vencer"
  minTenureDays: 60,          // "mínimo 2 meses" (desde el primer bono aprobado)
  renovacionMaxRestantes: 2,  // 0, 1 o 2 sesiones por usar
  remarkDiasMin: 3,           // el 9,99 se pagó hace ≥3 días (ya tuvo su diagnóstico)
  remarkDiasMax: 60,
  remarkPasos: 6,
  logLookbackDays: 90,
};
export type OutreachConfig = typeof OUTREACH_CONFIG;

export type OutreachRule = "psi_baja" | "renovacion" | "caducidad" | "saludo_1999" | "bono_vencido" | "remark";
export const OUTREACH_RULES: OutreachRule[] = ["psi_baja", "renovacion", "caducidad", "saludo_1999", "bono_vencido", "remark"];
export const RULE_LABEL: Record<OutreachRule, string> = {
  psi_baja: "Psicóloga ya no está · saludo",
  renovacion: "Renovación · ≤2 sesiones",
  caducidad: "Vence en ≤14 días · ampliar caducidad",
  saludo_1999: "Saludo · sesión extra 19,99",
  bono_vencido: "Bono vencido · renovar",
  remark: "Remark 9,99 sin bono (1→6)",
};
export const AUTO_TEMPLATE_CATEGORY = "automatico";
export function templateSlugFor(rule: OutreachRule, step?: number | null): string {
  return rule === "remark" ? `auto-remark-${step ?? 1}` : `auto-${rule.replace(/_/g, "-")}`;
}

export type BonoInfo = {
  customerId: number;
  packageCustomerId: number;
  packageName: string;
  total: number;
  used: number;
  remaining: number;
  startMs: number | null;
  endMs: number | null;
  providerName: string;
  providerStatus: string | null;
  lastSessionMs: number | null;
  nextSessionMs: number | null;
};

export type PatientSnapshot = {
  email: string;
  nombre: string | null;
  phone: string | null;
  hasApp: boolean;
  bonos: BonoInfo[];              // aprobados: vigentes o caducados hace ≤ vencidoDias
  hasAnyBono: boolean;            // alguna vez tuvo un bono aprobado en Amelia
  tenureStartMs: number | null;   // inicio del primer bono aprobado
  offered1999: boolean;           // sesión extra ya ofrecida (upsell_ofrecidos) o ya comprada
  diagPaidMs: number | null;      // último pago del 9,99
  hasTherapyPayment: boolean;     // pago ≥40€ en Stripe o terapia pagada en la app
  outreach: { rule: OutreachRule; step: number | null; sentMs: number }[]; // envíos ok del motor
  lastAgentMsgMs: number | null;  // último mensaje de agente en el chat de la app (cualquiera)
  lastUserMsgMs: number | null;   // último mensaje del paciente en el chat de la app
  waitingForAgent: boolean;       // tiene mensaje sin responder → lo lleva el equipo
  excludedReason: string | null;  // devolución/reclamación/no interesa/no contactar/baja
};

export type Decision = { rule: OutreachRule; step: number | null; templateSlug: string; reason: string; vars: Record<string, string>; bono: BonoInfo | null };
export type Skip = { skip: string; rule?: OutreachRule };
export const isDecision = (d: Decision | Skip): d is Decision => (d as Skip).skip === undefined;

const madridDay = (ms: number) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
const fmtFecha = (ms: number | null) => (ms == null ? "" : new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(ms)));
const sesionesTxt = (n: number) => (n === 1 ? "1 sesión" : `${n} sesiones`);

function mkVars(bono: BonoInfo | null, remaining: number, nowMs: number, step?: number): Record<string, string> {
  const dias = bono?.endMs != null ? Math.max(0, Math.ceil((bono.endMs - nowMs) / DAY)) : 0;
  // Los paquetes de Amelia se llaman "Bono Felicidad", "Bono Compañía"…: {bono} ya incluye la palabra
  // "bono" (se antepone si el nombre no la trae) para que las plantillas digan "tu {bono}".
  const nombreBono = (bono?.packageName ?? "").trim();
  return {
    sesiones: String(remaining),
    sesiones_txt: sesionesTxt(remaining),
    bono: !nombreBono ? "bono" : /^bono\b/i.test(nombreBono) ? nombreBono : `bono ${nombreBono}`,
    caduca: fmtFecha(bono?.endMs ?? null),
    dias: String(dias),
    psicologa: bono?.providerName?.trim() || "tu psicóloga",
    paso: String(step ?? ""),
  };
}

// Sustituye {sesiones}, {bono}, {caduca}, {dias}, {psicologa}, {sesiones_txt}, {paso}. {nombre} se deja
// para startSupportChat (usa el nombre de la cuenta de la app).
export function renderVars(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{?\s*([a-z_]+)\s*\}?\}/gi, (m, k: string) => {
    const key = k.toLowerCase();
    if (key === "nombre") return m;
    return key in vars ? vars[key] : m;
  });
}

// Decide la regla de UN paciente. Pura: sin IO, testeable.
export function decideRule(p: PatientSnapshot, nowMs: number, cfg: OutreachConfig = OUTREACH_CONFIG): Decision | Skip {
  if (p.excludedReason) return { skip: p.excludedReason };
  if (p.waitingForAgent) return { skip: "tiene un mensaje sin responder en el chat (lo lleva el equipo)" };

  const sentWithin = (days: number, rule?: OutreachRule) => p.outreach.some((o) => (!rule || o.rule === rule) && nowMs - o.sentMs < days * DAY);
  const recentTeamMsg = p.lastAgentMsgMs != null && nowMs - p.lastAgentMsgMs < cfg.cooldownDays * DAY;
  const recentTemplate = sentWithin(cfg.cooldownDays) || recentTeamMsg;
  const gate = (rule: OutreachRule): Skip | null => {
    if (recentTemplate) return { skip: `plantilla o mensaje del equipo hace menos de ${cfg.cooldownDays} días`, rule };
    if (sentWithin(cfg.ruleRepeatDays, rule)) return { skip: `ya recibió "${RULE_LABEL[rule]}" hace menos de ${cfg.ruleRepeatDays} días`, rule };
    return null;
  };

  const active = p.bonos.filter((b) => b.endMs == null || b.endMs >= nowMs);
  const expired = p.bonos.filter((b) => b.endMs != null && b.endMs < nowMs).sort((a, b) => (b.endMs ?? 0) - (a.endMs ?? 0));

  if (active.length) {
    const remaining = active.reduce((n, b) => n + b.remaining, 0);
    // Bono de referencia: el que más sesiones tiene (si está renovado, manda el nuevo).
    const b = active.reduce((best, x) => (x.remaining > best.remaining ? x : best), active[0]);
    const providerGone = b.providerStatus != null && b.providerStatus !== "visible";
    const vars = mkVars(b, remaining, nowMs);
    let rule: OutreachRule;
    let reason: string;
    if (providerGone) { rule = "psi_baja"; reason = `${b.providerName || "su psicóloga"} ya no está (Amelia: ${b.providerStatus}) · ${sesionesTxt(remaining)} en ${b.packageName}`; }
    else if (remaining <= cfg.renovacionMaxRestantes) { rule = "renovacion"; reason = `${sesionesTxt(remaining)} por usar en ${b.packageName}${b.endMs ? ` · caduca ${fmtFecha(b.endMs)}` : ""}`; }
    else if (b.endMs != null && b.endMs - nowMs <= cfg.venceDias * DAY) { rule = "caducidad"; reason = `${b.packageName} caduca ${fmtFecha(b.endMs)} (${vars.dias} días) con ${sesionesTxt(remaining)} por usar`; }
    else if (p.tenureStartMs != null && nowMs - p.tenureStartMs >= cfg.minTenureDays * DAY && !p.offered1999) {
      if (p.outreach.some((o) => o.rule === "saludo_1999")) return { skip: "saludo 19,99 ya enviado", rule: "saludo_1999" };
      rule = "saludo_1999"; reason = `bono activo (${sesionesTxt(remaining)}) · cliente desde ${fmtFecha(p.tenureStartMs)} · 19,99 no ofrecida`;
    } else if (p.offered1999) return { skip: "bono activo con sesiones; la 19,99 ya se le ofreció" };
    else return { skip: "bono activo con sesiones; menos de 2 meses de antigüedad" };
    const g = gate(rule);
    if (g) return g;
    return { rule, step: null, templateSlug: templateSlugFor(rule), reason, vars, bono: b };
  }

  if (expired.length) {
    const b = expired[0];
    const diasVencido = Math.floor((nowMs - (b.endMs ?? nowMs)) / DAY);
    if (diasVencido > cfg.vencidoDias) return { skip: `bono vencido hace ${diasVencido} días (>${cfg.vencidoDias})` };
    const g = gate("bono_vencido");
    if (g) return g;
    return { rule: "bono_vencido", step: null, templateSlug: templateSlugFor("bono_vencido"), reason: `${b.packageName} venció ${fmtFecha(b.endMs)} (hace ${diasVencido} días) · ${sesionesTxt(b.remaining)} sin usar`, vars: mkVars(b, b.remaining, nowMs), bono: b };
  }

  if (p.hasAnyBono) return { skip: "tuvo bono (vencido hace más de 60 días) y no tiene activo" };

  if (p.diagPaidMs != null) {
    const dias = Math.floor((nowMs - p.diagPaidMs) / DAY);
    if (dias < cfg.remarkDiasMin) return { skip: `9,99 hace ${dias} días (<${cfg.remarkDiasMin})` };
    if (dias > cfg.remarkDiasMax) return { skip: `9,99 hace ${dias} días (>${cfg.remarkDiasMax})` };
    if (p.hasTherapyPayment) return { skip: "ya pagó terapia" };
    const remarks = p.outreach.filter((o) => o.rule === "remark").sort((a, b) => b.sentMs - a.sentMs);
    const last = remarks[0];
    let step = 1;
    if (last) {
      const lastStep = last.step ?? 1;
      if (lastStep >= cfg.remarkPasos) return { skip: `secuencia remark completada (${cfg.remarkPasos}/${cfg.remarkPasos})`, rule: "remark" };
      if (p.lastUserMsgMs != null && p.lastUserMsgMs > last.sentMs) return { skip: "respondió al remark: lo sigue el equipo", rule: "remark" };
      if (p.lastAgentMsgMs != null && p.lastAgentMsgMs > last.sentMs + 60_000) return { skip: "el equipo ya le escribió después del remark", rule: "remark" };
      if (madridDay(last.sentMs) === madridDay(nowMs)) return { skip: `remark ${lastStep} ya enviado hoy`, rule: "remark" };
      step = lastStep + 1;
    } else if (recentTemplate) return { skip: `plantilla o mensaje del equipo hace menos de ${cfg.cooldownDays} días`, rule: "remark" };
    return { rule: "remark", step, templateSlug: templateSlugFor("remark", step), reason: `pagó el 9,99 hace ${dias} días y no tiene bono · paso ${step}/${cfg.remarkPasos}`, vars: mkVars(null, 0, nowMs, step), bono: null };
  }

  return { skip: "sin situación aplicable" };
}

// ─── Carga de datos (Amelia + BLOG + APP) ───────────────────────────────────

type AmeliaBonoRow = {
  customer_id: number; firstName: string | null; lastName: string | null; email: string | null; phone: string | null;
  package_customer_id: number; package_name: string | null; bono_start: unknown; bono_purchased: unknown; bono_end: unknown;
  override_count: number | null; plan_count: number | null; provider_name: string | null; provider_status: string | null;
  used_count: number | null; last_session: unknown; next_session: unknown;
};

function toMs(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) return Date.parse(s.replace(" ", "T") + "Z");
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}
const normEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();
function normPhone(raw: string | null | undefined): string {
  let d = (raw ?? "").replace(/\D/g, "").replace(/^00/, "");
  if (d.length === 9) d = "34" + d;
  return d;
}
const esInterno = (e: string) => !e.includes("@") || e.endsWith("@mentesanapsicologia.com") || e.startsWith("qa.") || e.includes("@test");

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>, pageSize = 1000, maxPages = 40): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < maxPages; i++) {
    const from = i * pageSize;
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const chunk = data ?? [];
    out.push(...chunk);
    if (chunk.length < pageSize) break;
  }
  return out;
}

// Mensajes del paciente que lo sacan de todo envío automático.
export const EXCLUSION_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "pidió devolución/reembolso", re: /reembols|devoluci[oó]n|devolver(me)? el dinero|devu[eé]lv/i },
  { label: "reclamación", re: /reclamaci|reclamar|denunci|queja formal/i },
  { label: "dijo que no le interesa", re: /no (me|nos) interesa|no estoy interesad|no quiero (seguir|continuar|más sesiones|mas sesiones|contratar|renovar)/i },
  { label: "pidió que no le escribamos", re: /no me escrib|no me contact|no (me )?(env[ií]en|manden|escriban) m[aá]s|dejen? de (escribir|enviar|mandar|contactar)|darme de baja|quiero darme de baja|no quiero recibir/i },
];
const EXCLUSION_OR = "body.ilike.%reembols%,body.ilike.%devoluci%,body.ilike.%devolver%,body.ilike.%devuelv%,body.ilike.%reclama%,body.ilike.%denunci%,body.ilike.%queja formal%,body.ilike.%no me interesa%,body.ilike.%no nos interesa%,body.ilike.%no estoy interesad%,body.ilike.%no quiero seguir%,body.ilike.%no quiero continuar%,body.ilike.%no quiero más sesiones%,body.ilike.%no quiero mas sesiones%,body.ilike.%no quiero contratar%,body.ilike.%no quiero renovar%,body.ilike.%no me escrib%,body.ilike.%no me contact%,body.ilike.%manden más%,body.ilike.%manden mas%,body.ilike.%dejen de%,body.ilike.%deja de escribir%,body.ilike.%darme de baja%,body.ilike.%no quiero recibir%";

export type AutoTemplate = { id: number; slug: string; title: string; body: string; category: string | null; sort_order: number | null };

export type OutreachCandidate = {
  email: string;
  nombre: string | null;
  has_app: boolean;
  rule: OutreachRule;
  rule_label: string;
  step: number | null;
  template_slug: string;
  template_title: string;
  template_id: number;
  body: string;      // con {nombre} (startSupportChat lo personaliza con la cuenta de la app)
  preview: string;   // personalizado para el panel
  reason: string;
  context: { bono: string | null; sesiones: number | null; caduca: string | null; psicologa: string | null; diag_pagado: string | null; ultimo_envio: string | null; amelia_customer_id: number | null };
};
export type OutreachSkipped = { email: string; nombre: string | null; reason: string; rule?: OutreachRule };
export type OutreachPlan = {
  ok: boolean;
  generated_at: string;
  config: OutreachConfig;
  amelia_ok: boolean;
  warnings: string[];
  counts: Record<string, number>;
  candidates: OutreachCandidate[];
  skipped: OutreachSkipped[];
  skipped_counts: Record<string, number>;
  missing_templates: string[];
};

export async function loadAutoTemplates(blog: SupabaseClient): Promise<AutoTemplate[]> {
  const { data, error } = await blog.from("support_message_templates").select("id, slug, title, body, category, sort_order").eq("category", AUTO_TEMPLATE_CATEGORY).order("sort_order");
  if (error) throw new Error("templates: " + error.message);
  return (data ?? []) as AutoTemplate[];
}

export async function buildOutreachPlan(opts: { app: SupabaseClient; blog: SupabaseClient; nowMs?: number; cfg?: OutreachConfig }): Promise<OutreachPlan> {
  const { app, blog } = opts;
  const cfg = opts.cfg ?? OUTREACH_CONFIG;
  const nowMs = opts.nowMs ?? Date.now();
  const warnings: string[] = [];
  const iso = (ms: number) => new Date(ms).toISOString();

  // 1) Amelia: bonos aprobados vigentes o caducados ≤ vencidoDias, con psicóloga y sesiones; antigüedad por email.
  const u = ameliaTable("users"), p = ameliaTable("packages_to_customers"), pcs = ameliaTable("packages_customers_to_services"), cb = ameliaTable("customer_bookings"), ab = ameliaTable("appointments"), pk = ameliaTable("packages");
  let ameliaOk = false;
  let bonoRows: AmeliaBonoRow[] = [];
  const tenure = new Map<string, number>();
  try {
    bonoRows = await ameliaQuery<AmeliaBonoRow>(
      `SELECT u.id customer_id, u.firstName, u.lastName, LOWER(u.email) email, u.phone,
              p.id package_customer_id, pk.name package_name, p.start bono_start, p.purchased bono_purchased, p.\`end\` bono_end,
              p.bookingsCount override_count, pcs.bookingsCount plan_count,
              TRIM(CONCAT(COALESCE(pu.firstName,''), ' ', COALESCE(pu.lastName,''))) provider_name, pu.status provider_status,
              COALESCE(x.used_count, 0) used_count, x.last_session, x.next_session
       FROM ${p} p
       JOIN ${u} u ON u.id = p.customerId AND u.type = 'customer'
       JOIN ${pk} pk ON pk.id = p.packageId
       LEFT JOIN ${pcs} pcs ON pcs.packageCustomerId = p.id
       LEFT JOIN ${u} pu ON pu.id = pcs.providerId
       LEFT JOIN (
         SELECT cb.packageCustomerServiceId pcs_id, COUNT(DISTINCT cb.appointmentId) used_count,
                MAX(CASE WHEN a.bookingStart <= NOW() THEN a.bookingStart END) last_session,
                MIN(CASE WHEN a.bookingStart > NOW() THEN a.bookingStart END) next_session
         FROM ${cb} cb JOIN ${ab} a ON a.id = cb.appointmentId
         WHERE cb.status IN ('approved','pending') AND cb.packageCustomerServiceId IS NOT NULL
         GROUP BY cb.packageCustomerServiceId
       ) x ON x.pcs_id = pcs.id
       WHERE p.status = 'approved' AND u.email IS NOT NULL AND u.email <> ''
         AND (p.\`end\` IS NULL OR p.\`end\` >= DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [cfg.vencidoDias],
    );
    const t = await ameliaQuery<{ email: string; first_start: unknown }>(
      `SELECT LOWER(u.email) email, MIN(COALESCE(p.start, p.purchased)) first_start
       FROM ${p} p JOIN ${u} u ON u.id = p.customerId AND u.type = 'customer'
       WHERE p.status = 'approved' AND u.email IS NOT NULL AND u.email <> '' GROUP BY LOWER(u.email)`,
    );
    for (const r of t) { const ms = toMs(r.first_start); const e = normEmail(r.email); if (e) tenure.set(e, ms ?? 0); }
    ameliaOk = true;
  } catch (e) {
    warnings.push("Amelia no responde: " + (e instanceof Error ? e.message : String(e)) + ". Sin Amelia no se calcula ninguna regla.");
  }

  // 2) BLOG: plantillas, exclusiones, log del motor, 19,99 ofrecida/comprada, pagos.
  const [templates, optouts, mktUnsub, pdUnsub, logRows, ofrecidos, upsellPaid, payments] = await Promise.all([
    loadAutoTemplates(blog),
    fetchAll<{ email: string; reason: string | null }>((a, b) => blog.from("app_outreach_optout").select("email, reason").range(a, b)),
    fetchAll<{ email: string }>((a, b) => blog.from("marketing_unsubscribes").select("email").range(a, b)),
    fetchAll<{ email: string }>((a, b) => blog.from("post_diag_unsubscribes").select("email").range(a, b)),
    fetchAll<{ email: string; rule: string; step: number | null; sent_at: string }>((a, b) => blog.from("app_outreach_log").select("email, rule, step, sent_at").eq("ok", true).gte("sent_at", iso(nowMs - cfg.logLookbackDays * DAY)).range(a, b)),
    fetchAll<{ email: string | null; phone_norm: string | null }>((a, b) => blog.from("upsell_ofrecidos").select("email, phone_norm").eq("upsell_key", "sesion_extra").eq("ofrecido", true).range(a, b)),
    fetchAll<{ email: string | null }>((a, b) => blog.from("upsell_paid").select("email").range(a, b)),
    fetchAll<{ patient_email: string | null; patient_phone: string | null; patient_name: string | null; amount_cents: number; created_at: string }>((a, b) => blog.from("payments").select("patient_email, patient_phone, patient_name, amount_cents, created_at").eq("status", "completed").order("created_at", { ascending: false }).range(a, b)),
  ]);
  const tplBySlug = new Map(templates.map((t) => [t.slug, t]));

  // 3) APP: cuentas, conversaciones y mensajes (último del equipo, último del paciente, exclusiones).
  const [appUsers, convs, agentMsgs, userMsgs, exclMsgs] = await Promise.all([
    fetchAll<{ email: string | null; name: string | null; terapia_paid_at: string | null }>((a, b) => app.from("users").select("email, name, terapia_paid_at").range(a, b)),
    fetchAll<{ id: number; email: string | null; user_id: string | number | null; last_sender: string | null; unread_for_agent: number | null; status: string | null }>((a, b) => app.from("support_conversations").select("id, email, user_id, last_sender, unread_for_agent, status").range(a, b)),
    fetchAll<{ conversation_id: number; created_at: string }>((a, b) => app.from("support_messages").select("conversation_id, created_at").eq("sender_type", "agent").gte("created_at", iso(nowMs - cfg.cooldownDays * DAY)).range(a, b)),
    fetchAll<{ conversation_id: number; created_at: string }>((a, b) => app.from("support_messages").select("conversation_id, created_at").eq("sender_type", "user").gte("created_at", iso(nowMs - cfg.remarkDiasMax * DAY)).range(a, b), 1000, 20),
    fetchAll<{ conversation_id: number; body: string | null }>((a, b) => app.from("support_messages").select("conversation_id, body").eq("sender_type", "user").gte("created_at", iso(nowMs - 365 * DAY)).or(EXCLUSION_OR).range(a, b), 1000, 5),
  ]);
  const appByEmail = new Map<string, { name: string | null; terapia_paid_at: string | null }>();
  for (const r of appUsers) { const e = normEmail(r.email); if (!e) continue; appByEmail.set(e, { name: r.name, terapia_paid_at: r.terapia_paid_at }); }
  // support_conversations siempre lleva email (también las creadas por user_id).
  const convEmail = new Map<number, string>();
  const waiting = new Set<string>();
  for (const c of convs) {
    const e = normEmail(c.email);
    if (!e) continue;
    convEmail.set(c.id, e);
    if (c.last_sender === "user" && Number(c.unread_for_agent ?? 0) > 0 && c.status !== "resolved") waiting.add(e);
  }
  const lastAgent = new Map<string, number>(), lastUser = new Map<string, number>();
  for (const m of agentMsgs) { const e = convEmail.get(m.conversation_id); if (!e) continue; const ms = Date.parse(m.created_at); if (ms > (lastAgent.get(e) ?? 0)) lastAgent.set(e, ms); }
  for (const m of userMsgs) { const e = convEmail.get(m.conversation_id); if (!e) continue; const ms = Date.parse(m.created_at); if (ms > (lastUser.get(e) ?? 0)) lastUser.set(e, ms); }
  const excluded = new Map<string, string>();
  for (const o of optouts) excluded.set(normEmail(o.email), `no contactar (lista manual${o.reason ? ": " + o.reason : ""})`);
  for (const r of mktUnsub) { const e = normEmail(r.email); if (e && !excluded.has(e)) excluded.set(e, "se dio de baja de los emails"); }
  for (const r of pdUnsub) { const e = normEmail(r.email); if (e && !excluded.has(e)) excluded.set(e, "se dio de baja de la secuencia post-diagnóstico"); }
  for (const m of exclMsgs) {
    const e = convEmail.get(m.conversation_id);
    if (!e || excluded.has(e)) continue;
    const hit = EXCLUSION_PATTERNS.find((x) => x.re.test(m.body ?? ""));
    if (hit) excluded.set(e, `${hit.label} (mensaje en el chat de la app)`);
  }

  // 4) Señales de BLOG por email.
  const offeredEmails = new Set<string>(), offeredPhones = new Set<string>();
  for (const o of ofrecidos) { const e = normEmail(o.email); if (e) offeredEmails.add(e); const ph = normPhone(o.phone_norm); if (ph.length >= 8) offeredPhones.add(ph); }
  for (const r of upsellPaid) { const e = normEmail(r.email); if (e) offeredEmails.add(e); }
  const diagPaid = new Map<string, number>(), therapyPaid = new Set<string>(), payName = new Map<string, string>(), payPhone = new Map<string, string>();
  for (const r of payments) {
    const e = normEmail(r.patient_email); if (!e) continue;
    const ms = Date.parse(r.created_at);
    if (r.amount_cents >= 900 && r.amount_cents <= 1050) { if (ms > (diagPaid.get(e) ?? 0)) diagPaid.set(e, ms); if (r.patient_name && !payName.has(e)) payName.set(e, r.patient_name); if (r.patient_phone && !payPhone.has(e)) payPhone.set(e, r.patient_phone); }
    else if (r.amount_cents >= 1990 && r.amount_cents <= 2010) offeredEmails.add(e);
    else if (r.amount_cents >= 4000) therapyPaid.add(e);
  }
  const outreachByEmail = new Map<string, PatientSnapshot["outreach"]>();
  for (const r of logRows) {
    const e = normEmail(r.email); if (!e) continue;
    const rule = r.rule as OutreachRule;
    if (!OUTREACH_RULES.includes(rule)) continue;
    const l = outreachByEmail.get(e) ?? []; l.push({ rule, step: r.step, sentMs: Date.parse(r.sent_at) }); outreachByEmail.set(e, l);
  }

  // 5) Snapshots: clientes con bono (Amelia) ∪ pagos del 9,99 en ventana.
  const snaps = new Map<string, PatientSnapshot>();
  const ensure = (email: string, nombre: string | null, phone: string | null): PatientSnapshot => {
    let s = snaps.get(email);
    if (!s) {
      const a = appByEmail.get(email);
      s = {
        email, nombre: a?.name?.trim() || nombre, phone, hasApp: !!a,
        bonos: [], hasAnyBono: tenure.has(email), tenureStartMs: tenure.get(email) || null,
        offered1999: offeredEmails.has(email) || (phone ? offeredPhones.has(normPhone(phone)) : false),
        diagPaidMs: diagPaid.get(email) ?? null,
        hasTherapyPayment: therapyPaid.has(email) || !!a?.terapia_paid_at,
        outreach: outreachByEmail.get(email) ?? [],
        lastAgentMsgMs: lastAgent.get(email) ?? null,
        lastUserMsgMs: lastUser.get(email) ?? null,
        waitingForAgent: waiting.has(email),
        excludedReason: excluded.get(email) ?? null,
      };
      snaps.set(email, s);
    }
    return s;
  };
  const seenPkg = new Set<number>();
  for (const r of bonoRows) {
    const email = normEmail(r.email);
    if (!email || esInterno(email) || seenPkg.has(r.package_customer_id)) continue;
    seenPkg.add(r.package_customer_id);
    const override = Number(r.override_count ?? 0);
    const total = override > 0 ? override : Number(r.plan_count ?? 0);
    if (total <= 0) continue;
    const used = Number(r.used_count ?? 0);
    const nombre = `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || null;
    const s = ensure(email, nombre, r.phone);
    if (!s.offered1999 && r.phone && offeredPhones.has(normPhone(r.phone))) s.offered1999 = true;
    s.bonos.push({
      customerId: r.customer_id, packageCustomerId: r.package_customer_id, packageName: (r.package_name ?? "bono").trim(),
      total, used, remaining: Math.max(0, total - used),
      startMs: toMs(r.bono_start) ?? toMs(r.bono_purchased), endMs: toMs(r.bono_end),
      providerName: (r.provider_name ?? "").trim(), providerStatus: r.provider_status ?? null,
      lastSessionMs: toMs(r.last_session), nextSessionMs: toMs(r.next_session),
    });
  }
  for (const [email, ms] of diagPaid) {
    if (esInterno(email) || nowMs - ms > cfg.remarkDiasMax * DAY) continue;
    ensure(email, payName.get(email) ?? null, payPhone.get(email) ?? null);
  }

  // 6) Decidir.
  const candidates: OutreachCandidate[] = [];
  const skipped: OutreachSkipped[] = [];
  const counts: Record<string, number> = {};
  const skippedCounts: Record<string, number> = {};
  const missing = new Set<string>();
  if (ameliaOk) {
    for (const s of snaps.values()) {
      const d = decideRule(s, nowMs, cfg);
      if (!isDecision(d)) { skipped.push({ email: s.email, nombre: s.nombre, reason: d.skip, rule: d.rule }); skippedCounts[d.skip.replace(/\d+ días/, "N días")] = (skippedCounts[d.skip.replace(/\d+ días/, "N días")] ?? 0) + 1; continue; }
      const tpl = tplBySlug.get(d.templateSlug);
      if (!tpl) { missing.add(d.templateSlug); skipped.push({ email: s.email, nombre: s.nombre, reason: `falta la plantilla ${d.templateSlug}`, rule: d.rule }); continue; }
      const body = renderVars(tpl.body, d.vars);
      const first = s.nombre?.split(/\s+/)[0] ?? null;
      const lastOut = s.outreach.sort((a, b) => b.sentMs - a.sentMs)[0];
      candidates.push({
        email: s.email, nombre: s.nombre, has_app: s.hasApp,
        rule: d.rule, rule_label: RULE_LABEL[d.rule], step: d.step,
        template_slug: tpl.slug, template_title: tpl.title, template_id: tpl.id,
        body, preview: personalize(body, first), reason: d.reason,
        context: {
          bono: d.bono?.packageName ?? null, sesiones: d.bono ? d.bono.remaining : null, caduca: d.bono?.endMs ? fmtFecha(d.bono.endMs) : null,
          psicologa: d.bono?.providerName || null, diag_pagado: s.diagPaidMs ? fmtFecha(s.diagPaidMs) : null,
          ultimo_envio: lastOut ? `${RULE_LABEL[lastOut.rule]}${lastOut.step ? " " + lastOut.step : ""} · ${fmtFecha(lastOut.sentMs)}` : null,
          amelia_customer_id: d.bono?.customerId ?? null,
        },
      });
      counts[d.rule] = (counts[d.rule] ?? 0) + 1;
    }
  }
  const order: Record<OutreachRule, number> = { psi_baja: 0, renovacion: 1, caducidad: 2, bono_vencido: 3, saludo_1999: 4, remark: 5 };
  candidates.sort((a, b) => order[a.rule] - order[b.rule] || (a.step ?? 0) - (b.step ?? 0) || a.email.localeCompare(b.email));
  if (missing.size) warnings.push(`Faltan plantillas en support_message_templates: ${[...missing].join(", ")}`);

  return { ok: true, generated_at: new Date(nowMs).toISOString(), config: cfg, amelia_ok: ameliaOk, warnings, counts, candidates, skipped, skipped_counts: skippedCounts, missing_templates: [...missing] };
}

// ─── Envío ──────────────────────────────────────────────────────────────────

export type OutreachResult = { email: string; rule: OutreachRule; step: number | null; ok: boolean; conversation_id?: number; reused?: boolean; user_found?: boolean; push_sent?: number; email_sent?: boolean; error?: string };

export async function runOutreach(opts: { candidates: OutreachCandidate[]; agent: AgentProfile | null; app: SupabaseClient; blog: SupabaseClient; source: "panel" | "cron"; batchId?: string; concurrency?: number }): Promise<{ batch_id: string; total: number; sent: number; failed: number; results: OutreachResult[] }> {
  const { candidates, agent, app, blog } = opts;
  const batchId = opts.batchId ?? `auto_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const results: OutreachResult[] = new Array(candidates.length);
  let next = 0;
  const worker = async () => {
    while (next < candidates.length) {
      const i = next++;
      const c = candidates[i];
      if (!EMAIL_RE.test(c.email)) { results[i] = { email: c.email, rule: c.rule, step: c.step, ok: false, error: "email inválido" }; continue; }
      try {
        const r = await startSupportChat({ email: c.email, body: c.body, agent, app, blog });
        results[i] = r.ok
          ? { email: c.email, rule: c.rule, step: c.step, ok: true, conversation_id: r.conversation_id, reused: r.reused, user_found: r.user_found, push_sent: r.push_sent, email_sent: r.email_sent, error: r.email_error }
          : { email: c.email, rule: c.rule, step: c.step, ok: false, conversation_id: r.conversation_id, error: [r.error, r.detail].filter(Boolean).join(": ") };
      } catch (e) {
        results[i] = { email: c.email, rule: c.rule, step: c.step, ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(opts.concurrency ?? 3, Math.max(1, candidates.length)) }, worker));

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  const agentEmail = agent?.email ?? null;
  const agentName = agent?.name?.trim() || agent?.email || (opts.source === "cron" ? "cron" : null);
  if (results.length) {
    const rows = results.map((r, i) => ({
      email: r.email, amelia_customer_id: candidates[i].context.amelia_customer_id, rule: r.rule, step: r.step,
      template_slug: candidates[i].template_slug, template_title: candidates[i].template_title, body: candidates[i].body,
      batch_id: batchId, conversation_id: r.conversation_id ?? null, ok: r.ok, error: r.ok ? null : (r.error ?? "error"),
      agent_email: agentEmail, agent_name: agentName, source: opts.source,
      context: { reason: candidates[i].reason, ...candidates[i].context, push_sent: r.push_sent ?? null, email_sent: r.email_sent ?? null, user_found: r.user_found ?? null },
    }));
    const { error } = await blog.from("app_outreach_log").insert(rows);
    if (error) console.warn("[app-outreach] log failed:", error.message);
    const porRegla = Object.entries(results.reduce<Record<string, number>>((acc, r) => { const k = r.rule + (r.step ? " " + r.step : ""); acc[k] = (acc[k] ?? 0) + 1; return acc; }, {})).map(([k, n]) => `${k}: ${n}`).join(" · ");
    await blog.from("support_bulk_sends").insert({
      batch_id: batchId, agent_email: agentEmail ?? "cron", agent_name: agentName ?? "cron",
      template_id: null, template_title: `🤖 Automático (${opts.source})`, body: porRegla,
      total: results.length, sent, failed,
      results: results.map((r) => ({ ok: r.ok, email: r.email, reused: r.reused, push_sent: r.push_sent, email_sent: r.email_sent, user_found: r.user_found, conversation_id: r.conversation_id, error: r.error, rule: r.rule, step: r.step })),
    }).then(() => {}, (e) => console.warn("[app-outreach] bulk log failed:", e));
  }
  return { batch_id: batchId, total: results.length, sent, failed, results };
}
