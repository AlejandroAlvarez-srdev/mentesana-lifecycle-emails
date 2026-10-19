// Plantillas AUTOMÁTICAS según la situación de cada paciente. Dos canales comparten este motor:
//   • chat de la app (este archivo: buildOutreachPlan / runOutreach, plantillas support_message_templates)
//   • WhatsApp (src/lib/wa-outreach.ts: mismas reglas, plantillas aprobadas en Meta rotando versiones)
// Reglas (CTO, 17-oct-2026):
//   • Bono activo + psicóloga que ya no está (provider Amelia no 'visible')  → "psi_baja" (saludo).
//   • Bono activo con ≤2 sesiones por usar (0, 1 o 2)                          → "renovacion".
//   • Bono activo que vence en ≤14 días y aún con sesiones (≥3)               → "caducidad" (ampliar vigencia).
//   • Bono activo, ≥2 meses desde su primer bono y sin la 19,99 ofrecida      → "saludo_1999" (sesión extra).
//   • Bono vencido (≤60 días) y sin otro activo                                → "bono_vencido" (renovar).
//   • Pagó el 9,99 (3-60 días) y nunca tuvo bono ni terapia                    → "remark" paso 1→6, un paso por día.
//   • NUNCA a quien pidió devolución/reclamó/dijo que no le interesa o que no le escribamos
//     (patrones en sus mensajes, bajas de marketing y la lista manual app_outreach_optout).
//   • Nada si recibió una plantilla (o cualquier mensaje del equipo, en la app O en WhatsApp) hace <3 días;
//     la misma regla no se repite antes de 14 días EN EL MISMO CANAL (WhatsApp puede llegar a quien ya recibió
//     la versión de la app pasados los 3 días); el saludo 19,99 solo se manda una vez. El remark sigue en el
//     canal donde empezó.
// Una sola plantilla por paciente y pasada. Todo envío (ambos canales) se registra en BLOG app_outreach_log
// (channel app|wa), que es lo que sostiene la cadencia y los pasos del remark.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentProfile } from "@/lib/agent-auth";
import { ameliaQuery, ameliaTable } from "@/lib/amelia-db";
import { EXCLUDED_PATIENT_EMAILS, dropExcludedPatients } from "@/lib/excluded-patients";
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
export type OutreachChannel = "app" | "wa";
export const CHANNEL_LABEL: Record<OutreachChannel, string> = { app: "la app", wa: "WhatsApp" };

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
export const RULE_ORDER: Record<OutreachRule, number> = { psi_baja: 0, renovacion: 1, caducidad: 2, bono_vencido: 3, saludo_1999: 4, remark: 5 };
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

export type OutreachLogEntry = { rule: OutreachRule; step: number | null; sentMs: number; channel: OutreachChannel };

export type PatientSnapshot = {
  email: string;
  nombre: string | null;
  phone: string | null;           // normalizado (dígitos con prefijo país)
  hasApp: boolean;
  bonos: BonoInfo[];              // aprobados: vigentes o caducados hace ≤ vencidoDias
  hasAnyBono: boolean;            // alguna vez tuvo un bono aprobado en Amelia
  tenureStartMs: number | null;   // inicio del primer bono aprobado
  offered1999: boolean;           // sesión extra ya ofrecida (upsell_ofrecidos) o ya comprada
  diagPaidMs: number | null;      // último pago del 9,99
  hasTherapyPayment: boolean;     // pago ≥40€ en Stripe o terapia pagada en la app
  outreach: OutreachLogEntry[];   // envíos ok del motor (ambos canales)
  lastAgentMsgMs: number | null;  // último mensaje del equipo (app o WhatsApp)
  lastUserMsgMs: number | null;   // último mensaje del paciente (app o WhatsApp)
  waitingForAgent: boolean;       // tiene mensaje sin responder → lo lleva el equipo
  excludedReason: string | null;  // devolución/reclamación/no interesa/no contactar/baja
};

export type Decision = { rule: OutreachRule; step: number | null; templateSlug: string; reason: string; vars: Record<string, string>; bono: BonoInfo | null };
export type Skip = { skip: string; rule?: OutreachRule };
export const isDecision = (d: Decision | Skip): d is Decision => (d as Skip).skip === undefined;

export const madridDay = (ms: number) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
export const fmtFecha = (ms: number | null) => (ms == null ? "" : new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(ms)));
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

// Decide la regla de UN paciente para un canal. Pura: sin IO, testeable.
export function decideRule(p: PatientSnapshot, nowMs: number, cfg: OutreachConfig = OUTREACH_CONFIG, channel: OutreachChannel = "app"): Decision | Skip {
  if (p.excludedReason) return { skip: p.excludedReason };
  if (p.waitingForAgent) return { skip: "tiene un mensaje sin responder en el chat (lo lleva el equipo)" };

  // Cooldown de 3 días: cualquier canal. Repetición de la misma regla (14 días): por canal, para que
  // WhatsApp pueda llegar a quien ya recibió la versión de la app (y viceversa) pasado el margen.
  const sentWithin = (days: number, rule?: OutreachRule, sameChannel = false) => p.outreach.some((o) => (!rule || o.rule === rule) && (!sameChannel || o.channel === channel) && nowMs - o.sentMs < days * DAY);
  const recentTeamMsg = p.lastAgentMsgMs != null && nowMs - p.lastAgentMsgMs < cfg.cooldownDays * DAY;
  const recentTemplate = sentWithin(cfg.cooldownDays) || recentTeamMsg;
  const gate = (rule: OutreachRule): Skip | null => {
    if (recentTemplate) return { skip: `plantilla o mensaje del equipo hace menos de ${cfg.cooldownDays} días`, rule };
    if (sentWithin(cfg.ruleRepeatDays, rule, true)) return { skip: `ya recibió "${RULE_LABEL[rule]}" por ${CHANNEL_LABEL[channel]} hace menos de ${cfg.ruleRepeatDays} días`, rule };
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
      if (last.channel !== channel) return { skip: `secuencia remark en curso por ${CHANNEL_LABEL[last.channel]}`, rule: "remark" };
      if (p.lastUserMsgMs != null && p.lastUserMsgMs > last.sentMs) return { skip: "respondió al remark: lo sigue el equipo", rule: "remark" };
      if (p.lastAgentMsgMs != null && p.lastAgentMsgMs > last.sentMs + 60_000) return { skip: "el equipo ya le escribió después del remark", rule: "remark" };
      if (madridDay(last.sentMs) === madridDay(nowMs)) return { skip: `remark ${lastStep} ya enviado hoy`, rule: "remark" };
      step = lastStep + 1;
    } else if (recentTemplate) return { skip: `plantilla o mensaje del equipo hace menos de ${cfg.cooldownDays} días`, rule: "remark" };
    return { rule: "remark", step, templateSlug: templateSlugFor("remark", step), reason: `pagó el 9,99 hace ${dias} días y no tiene bono · paso ${step}/${cfg.remarkPasos}`, vars: mkVars(null, 0, nowMs, step), bono: null };
  }

  return { skip: "sin situación aplicable" };
}

// ─── Utilidades de carga ────────────────────────────────────────────────────

type AmeliaBonoRow = {
  customer_id: number; firstName: string | null; lastName: string | null; email: string | null; phone: string | null;
  package_customer_id: number; package_name: string | null; bono_start: unknown; bono_purchased: unknown; bono_end: unknown;
  override_count: number | null; plan_count: number | null; provider_name: string | null; provider_status: string | null;
  used_count: number | null; last_session: unknown; next_session: unknown;
};

export function toMs(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;
  const s = String(v).trim();
  // Sin zona (Amelia "YYYY-MM-DD HH:MM:SS" o un timestamp naive de PostgREST) = UTC.
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) return Date.parse(s.replace(" ", "T") + "Z");
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}
export const normEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();
export function normPhone(raw: string | null | undefined): string {
  let d = (raw ?? "").replace(/\D/g, "").replace(/^00/, "");
  if (d.length === 9) d = "34" + d;
  return d;
}
export const esInterno = (e: string) => !e.includes("@") || e.endsWith("@mentesanapsicologia.com") || e.startsWith("qa.") || e.includes("@test");
// ISO sin zona para filtrar columnas `timestamp without time zone` (naive = UTC).
export const naiveIso = (ms: number) => new Date(ms).toISOString().slice(0, 19);

export async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>, pageSize = 1000, maxPages = 40): Promise<T[]> {
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

// Mensajes del paciente que lo sacan de todo envío automático (app y WhatsApp).
export const EXCLUSION_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "pidió devolución/reembolso", re: /reembols|devoluci[oó]n|devolver(me)? el dinero|devu[eé]lv/i },
  { label: "reclamación", re: /reclamaci|reclamar|denunci|queja formal/i },
  { label: "dijo que no le interesa", re: /no (me|nos) interesa|no estoy interesad|no quiero (seguir|continuar|más sesiones|mas sesiones|contratar|renovar)/i },
  { label: "pidió que no le escribamos", re: /no me escrib|no me contact|no (me )?(env[ií]en|manden|escriban) m[aá]s|dejen? de (escribir|enviar|mandar|contactar)|darme de baja|quiero darme de baja|no quiero recibir/i },
];
export const EXCLUSION_ILIKE = ["%reembols%", "%devoluci%", "%devolver%", "%devuelv%", "%reclama%", "%denunci%", "%queja formal%", "%no me interesa%", "%no nos interesa%", "%no estoy interesad%", "%no quiero seguir%", "%no quiero continuar%", "%no quiero más sesiones%", "%no quiero mas sesiones%", "%no quiero contratar%", "%no quiero renovar%", "%no me escrib%", "%no me contact%", "%manden más%", "%manden mas%", "%dejen de%", "%deja de escribir%", "%darme de baja%", "%no quiero recibir%"];
export const exclusionOr = (col: string) => EXCLUSION_ILIKE.map((p) => `${col}.ilike.${p}`).join(",");

export type AutoTemplate = { id: number; slug: string; title: string; body: string; category: string | null; sort_order: number | null };
export async function loadAutoTemplates(blog: SupabaseClient): Promise<AutoTemplate[]> {
  const { data, error } = await blog.from("support_message_templates").select("id, slug, title, body, category, sort_order").eq("category", AUTO_TEMPLATE_CATEGORY).order("sort_order");
  if (error) throw new Error("templates: " + error.message);
  return (data ?? []) as AutoTemplate[];
}

// ─── Base común (Amelia + BLOG) ─────────────────────────────────────────────

export type BaseData = {
  snaps: Map<string, PatientSnapshot>;      // por email
  byPhone: Map<string, PatientSnapshot[]>;  // por teléfono normalizado
  ameliaOk: boolean;
  warnings: string[];
};

export async function loadBaseSnapshots(opts: { blog: SupabaseClient; nowMs: number; cfg: OutreachConfig }): Promise<BaseData> {
  const { blog, nowMs, cfg } = opts;
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
    bonoRows = dropExcludedPatients(bonoRows);
    ameliaOk = true;
  } catch (e) {
    warnings.push("Amelia no responde: " + (e instanceof Error ? e.message : String(e)) + ". Sin Amelia no se calcula ninguna regla.");
  }

  // 2) BLOG: exclusiones, log del motor (ambos canales), 19,99 ofrecida/comprada, pagos.
  const [optouts, mktUnsub, pdUnsub, logRows, ofrecidos, upsellPaid, payments] = await Promise.all([
    fetchAll<{ email: string | null; phone: string | null; reason: string | null }>((a, b) => blog.from("app_outreach_optout").select("email, phone, reason").range(a, b)),
    fetchAll<{ email: string }>((a, b) => blog.from("marketing_unsubscribes").select("email").range(a, b)),
    fetchAll<{ email: string }>((a, b) => blog.from("post_diag_unsubscribes").select("email").range(a, b)),
    fetchAll<{ email: string; phone: string | null; rule: string; step: number | null; sent_at: string; channel: string | null }>((a, b) => blog.from("app_outreach_log").select("email, phone, rule, step, sent_at, channel").eq("ok", true).gte("sent_at", iso(nowMs - cfg.logLookbackDays * DAY)).range(a, b)),
    fetchAll<{ email: string | null; phone_norm: string | null }>((a, b) => blog.from("upsell_ofrecidos").select("email, phone_norm").eq("upsell_key", "sesion_extra").eq("ofrecido", true).range(a, b)),
    fetchAll<{ email: string | null }>((a, b) => blog.from("upsell_paid").select("email").range(a, b)),
    fetchAll<{ patient_email: string | null; patient_phone: string | null; patient_name: string | null; amount_cents: number; created_at: string }>((a, b) => blog.from("payments").select("patient_email, patient_phone, patient_name, amount_cents, created_at").eq("status", "completed").order("created_at", { ascending: false }).range(a, b)),
  ]);

  const excludedByEmail = new Map<string, string>(), excludedByPhone = new Map<string, string>();
  for (const o of optouts) {
    const why = `no contactar (lista manual${o.reason ? ": " + o.reason : ""})`;
    const e = normEmail(o.email); if (e) excludedByEmail.set(e, why);
    const ph = normPhone(o.phone); if (ph.length >= 8) excludedByPhone.set(ph, why);
  }
  for (const r of mktUnsub) { const e = normEmail(r.email); if (e && !excludedByEmail.has(e)) excludedByEmail.set(e, "se dio de baja de los emails"); }
  for (const r of pdUnsub) { const e = normEmail(r.email); if (e && !excludedByEmail.has(e)) excludedByEmail.set(e, "se dio de baja de la secuencia post-diagnóstico"); }

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
  const logByEmail = new Map<string, OutreachLogEntry[]>(), logByPhone = new Map<string, OutreachLogEntry[]>();
  for (const r of logRows) {
    const rule = r.rule as OutreachRule;
    if (!OUTREACH_RULES.includes(rule)) continue;
    const entry: OutreachLogEntry = { rule, step: r.step, sentMs: Date.parse(r.sent_at), channel: r.channel === "wa" ? "wa" : "app" };
    const e = normEmail(r.email); if (e) { const l = logByEmail.get(e) ?? []; l.push(entry); logByEmail.set(e, l); }
    const ph = normPhone(r.phone); if (ph.length >= 8) { const l = logByPhone.get(ph) ?? []; l.push(entry); logByPhone.set(ph, l); }
  }

  // 3) Snapshots: clientes con bono (Amelia) ∪ pagos del 9,99 en ventana.
  const snaps = new Map<string, PatientSnapshot>();
  const ensure = (email: string, nombre: string | null, phoneRaw: string | null): PatientSnapshot => {
    let s = snaps.get(email);
    if (!s) {
      const phone = normPhone(phoneRaw);
      const ph = phone.length >= 8 ? phone : null;
      const byE = logByEmail.get(email) ?? [], byP = ph ? logByPhone.get(ph) ?? [] : [];
      const seen = new Set<string>();
      const outreach = [...byE, ...byP].filter((o) => { const k = `${o.rule}|${o.step}|${o.sentMs}`; if (seen.has(k)) return false; seen.add(k); return true; });
      s = {
        email, nombre, phone: ph, hasApp: false,
        bonos: [], hasAnyBono: tenure.has(email), tenureStartMs: tenure.get(email) || null,
        offered1999: offeredEmails.has(email) || (ph ? offeredPhones.has(ph) : false),
        diagPaidMs: diagPaid.get(email) ?? null,
        hasTherapyPayment: therapyPaid.has(email),
        outreach,
        lastAgentMsgMs: null, lastUserMsgMs: null, waitingForAgent: false,
        excludedReason: excludedByEmail.get(email) ?? (ph ? excludedByPhone.get(ph) : null) ?? null,
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
    if (!s.phone) { const ph = normPhone(r.phone); if (ph.length >= 8) s.phone = ph; }
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
  const byPhone = new Map<string, PatientSnapshot[]>();
  for (const e of EXCLUDED_PATIENT_EMAILS) snaps.delete(e); // nunca en plantillas automáticas (app ni WhatsApp)
  for (const s of snaps.values()) { if (!s.phone) continue; const l = byPhone.get(s.phone) ?? []; l.push(s); byPhone.set(s.phone, l); }
  return { snaps, byPhone, ameliaOk, warnings };
}

// ─── Señales del chat de la app (proyecto APP) ──────────────────────────────

export async function applyAppSignals(opts: { base: BaseData; app: SupabaseClient; nowMs: number; cfg: OutreachConfig }): Promise<void> {
  const { base, app, nowMs, cfg } = opts;
  const { snaps } = base;
  const iso = (ms: number) => new Date(ms).toISOString();
  const [appUsers, convs, agentMsgs, userMsgs, exclMsgs] = await Promise.all([
    fetchAll<{ email: string | null; name: string | null; terapia_paid_at: string | null }>((a, b) => app.from("users").select("email, name, terapia_paid_at").range(a, b)),
    fetchAll<{ id: number; email: string | null; last_sender: string | null; unread_for_agent: number | null; status: string | null }>((a, b) => app.from("support_conversations").select("id, email, last_sender, unread_for_agent, status").range(a, b)),
    fetchAll<{ conversation_id: number; created_at: string }>((a, b) => app.from("support_messages").select("conversation_id, created_at").eq("sender_type", "agent").gte("created_at", iso(nowMs - cfg.cooldownDays * DAY)).range(a, b)),
    fetchAll<{ conversation_id: number; created_at: string }>((a, b) => app.from("support_messages").select("conversation_id, created_at").eq("sender_type", "user").gte("created_at", iso(nowMs - cfg.remarkDiasMax * DAY)).range(a, b), 1000, 20),
    fetchAll<{ conversation_id: number; body: string | null }>((a, b) => app.from("support_messages").select("conversation_id, body").eq("sender_type", "user").gte("created_at", iso(nowMs - 365 * DAY)).or(exclusionOr("body")).range(a, b), 1000, 5),
  ]);
  const appByEmail = new Map<string, { name: string | null; terapia_paid_at: string | null }>();
  for (const r of appUsers) { const e = normEmail(r.email); if (e) appByEmail.set(e, { name: r.name, terapia_paid_at: r.terapia_paid_at }); }
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
  for (const m of exclMsgs) {
    const e = convEmail.get(m.conversation_id);
    if (!e || excluded.has(e)) continue;
    const hit = EXCLUSION_PATTERNS.find((x) => x.re.test(m.body ?? ""));
    if (hit) excluded.set(e, `${hit.label} (mensaje en el chat de la app)`);
  }
  for (const s of snaps.values()) {
    const a = appByEmail.get(s.email);
    if (a) { s.hasApp = true; if (a.name?.trim()) s.nombre = a.name.trim(); if (a.terapia_paid_at) s.hasTherapyPayment = true; }
    const la = lastAgent.get(s.email); if (la != null && la > (s.lastAgentMsgMs ?? 0)) s.lastAgentMsgMs = la;
    const lu = lastUser.get(s.email); if (lu != null && lu > (s.lastUserMsgMs ?? 0)) s.lastUserMsgMs = lu;
    if (waiting.has(s.email)) s.waitingForAgent = true;
    if (!s.excludedReason && excluded.has(s.email)) s.excludedReason = excluded.get(s.email)!;
  }
}

// ─── Señales de WhatsApp (messages_mentesana, por teléfono) ─────────────────
// full=false (plan de la app): solo lo que hace falta para el cooldown cruzado (mensajes del equipo
// por WhatsApp en los últimos N días). full=true (plan de WhatsApp): además último mensaje del
// paciente, pendientes de respuesta, fallos de Meta (opt-out / throttling) y patrones de exclusión.
export type WaSignals = { throttled: Map<string, number>; metaOptOut: Set<string>; lastOutTemplate: Map<string, { ms: number; name: string | null }> };

export async function applyWaSignals(opts: { base: BaseData; blog: SupabaseClient; nowMs: number; cfg: OutreachConfig; full: boolean }): Promise<WaSignals> {
  const { base, blog, nowMs, cfg, full } = opts;
  const { byPhone } = base;
  const sig: WaSignals = { throttled: new Map(), metaOptOut: new Set(), lastOutTemplate: new Map() };
  if (byPhone.size === 0) return sig;
  const sinceOut = naiveIso(nowMs - (full ? cfg.logLookbackDays : cfg.cooldownDays) * DAY);
  const outbound = await fetchAll<{ phone: string | null; timestamp: string; type: string; is_template: boolean | null; template_name: string | null; status: string | null; error_reason: string | null }>((a, b) =>
    blog.from("messages_mentesana").select("phone, timestamp, type, is_template, template_name, status, error_reason").neq("type", "received").gte("timestamp", sinceOut).order("timestamp", { ascending: false }).range(a, b), 1000, full ? 40 : 10);
  const lastAgent = new Map<string, number>();
  for (const m of outbound) {
    const ph = normPhone(m.phone); if (ph.length < 8 || !byPhone.has(ph)) continue;
    const ms = toMs(m.timestamp); if (ms == null) continue;
    const failed = m.status === "failed";
    const err = (m.error_reason ?? "").toLowerCase();
    if (failed && /chosen to stop receiving|stop receiving/.test(err)) sig.metaOptOut.add(ph);
    if (failed && /healthy ecosystem|spam rate limit/.test(err) && nowMs - ms < 7 * DAY) { if (ms > (sig.throttled.get(ph) ?? 0)) sig.throttled.set(ph, ms); }
    if (failed) continue; // un fallo no cuenta como contacto
    if (ms > (lastAgent.get(ph) ?? 0)) lastAgent.set(ph, ms);
    if (m.is_template && !sig.lastOutTemplate.has(ph)) sig.lastOutTemplate.set(ph, { ms, name: m.template_name });
  }
  for (const [ph, ms] of lastAgent) for (const s of byPhone.get(ph) ?? []) if (ms > (s.lastAgentMsgMs ?? 0)) s.lastAgentMsgMs = ms;
  if (!full) return sig;

  const inbound = await fetchAll<{ phone: string | null; sender: string | null; timestamp: string }>((a, b) =>
    blog.from("messages_mentesana").select("phone, sender, timestamp").eq("type", "received").gte("timestamp", naiveIso(nowMs - cfg.remarkDiasMax * DAY)).order("timestamp", { ascending: false }).range(a, b), 1000, 40);
  const lastUser = new Map<string, number>();
  for (const m of inbound) {
    const ph = normPhone(m.sender ?? m.phone); if (ph.length < 8 || !byPhone.has(ph)) continue;
    const ms = toMs(m.timestamp); if (ms == null) continue;
    if (ms > (lastUser.get(ph) ?? 0)) lastUser.set(ph, ms);
  }
  for (const [ph, ms] of lastUser) for (const s of byPhone.get(ph) ?? []) {
    if (ms > (s.lastUserMsgMs ?? 0)) s.lastUserMsgMs = ms;
    // Escribió después del último mensaje del equipo → está esperando respuesta: lo lleva el equipo.
    if (s.lastAgentMsgMs == null || ms > s.lastAgentMsgMs) s.waitingForAgent = true;
  }
  const excl = await fetchAll<{ phone: string | null; sender: string | null; content: string | null }>((a, b) =>
    blog.from("messages_mentesana").select("phone, sender, content").eq("type", "received").gte("timestamp", naiveIso(nowMs - 365 * DAY)).or(exclusionOr("content")).range(a, b), 1000, 5);
  for (const m of excl) {
    const ph = normPhone(m.sender ?? m.phone); if (ph.length < 8) continue;
    const list = byPhone.get(ph); if (!list) continue;
    const hit = EXCLUSION_PATTERNS.find((x) => x.re.test(m.content ?? ""));
    if (!hit) continue;
    for (const s of list) if (!s.excludedReason) s.excludedReason = `${hit.label} (mensaje por WhatsApp)`;
  }
  for (const ph of sig.metaOptOut) for (const s of byPhone.get(ph) ?? []) if (!s.excludedReason) s.excludedReason = "bloqueó los mensajes de la empresa en WhatsApp (Meta: stop receiving)";
  return sig;
}

// ─── Plan y envío por el chat de la app ─────────────────────────────────────

export type OutreachCandidate = {
  email: string;
  nombre: string | null;
  phone: string | null;
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

export const skipKey = (reason: string) => reason.replace(/\d+ días/g, "N días");
export const lastOutreachLabel = (s: PatientSnapshot): string | null => {
  const last = [...s.outreach].sort((a, b) => b.sentMs - a.sentMs)[0];
  return last ? `${RULE_LABEL[last.rule]}${last.step ? " " + last.step : ""} · ${CHANNEL_LABEL[last.channel]} · ${fmtFecha(last.sentMs)}` : null;
};

export async function buildOutreachPlan(opts: { app: SupabaseClient; blog: SupabaseClient; nowMs?: number; cfg?: OutreachConfig }): Promise<OutreachPlan> {
  const { app, blog } = opts;
  const cfg = opts.cfg ?? OUTREACH_CONFIG;
  const nowMs = opts.nowMs ?? Date.now();
  const [templates, base] = await Promise.all([loadAutoTemplates(blog), loadBaseSnapshots({ blog, nowMs, cfg })]);
  const warnings = [...base.warnings];
  const tplBySlug = new Map(templates.map((t) => [t.slug, t]));
  if (base.ameliaOk) {
    await applyAppSignals({ base, app, nowMs, cfg });
    try { await applyWaSignals({ base, blog, nowMs, cfg, full: false }); } catch (e) { warnings.push("WhatsApp (cooldown cruzado) no disponible: " + (e instanceof Error ? e.message : String(e))); }
  }

  const candidates: OutreachCandidate[] = [];
  const skipped: OutreachSkipped[] = [];
  const counts: Record<string, number> = {};
  const skippedCounts: Record<string, number> = {};
  const missing = new Set<string>();
  if (base.ameliaOk) {
    for (const s of base.snaps.values()) {
      const d = decideRule(s, nowMs, cfg, "app");
      if (!isDecision(d)) { skipped.push({ email: s.email, nombre: s.nombre, reason: d.skip, rule: d.rule }); skippedCounts[skipKey(d.skip)] = (skippedCounts[skipKey(d.skip)] ?? 0) + 1; continue; }
      const tpl = tplBySlug.get(d.templateSlug);
      if (!tpl) { missing.add(d.templateSlug); skipped.push({ email: s.email, nombre: s.nombre, reason: `falta la plantilla ${d.templateSlug}`, rule: d.rule }); continue; }
      const body = renderVars(tpl.body, d.vars);
      const first = s.nombre?.split(/\s+/)[0] ?? null;
      candidates.push({
        email: s.email, nombre: s.nombre, phone: s.phone, has_app: s.hasApp,
        rule: d.rule, rule_label: RULE_LABEL[d.rule], step: d.step,
        template_slug: tpl.slug, template_title: tpl.title, template_id: tpl.id,
        body, preview: personalize(body, first), reason: d.reason,
        context: {
          bono: d.bono?.packageName ?? null, sesiones: d.bono ? d.bono.remaining : null, caduca: d.bono?.endMs ? fmtFecha(d.bono.endMs) : null,
          psicologa: d.bono?.providerName || null, diag_pagado: s.diagPaidMs ? fmtFecha(s.diagPaidMs) : null,
          ultimo_envio: lastOutreachLabel(s), amelia_customer_id: d.bono?.customerId ?? null,
        },
      });
      counts[d.rule] = (counts[d.rule] ?? 0) + 1;
    }
  }
  candidates.sort((a, b) => RULE_ORDER[a.rule] - RULE_ORDER[b.rule] || (a.step ?? 0) - (b.step ?? 0) || a.email.localeCompare(b.email));
  if (missing.size) warnings.push(`Faltan plantillas en support_message_templates: ${[...missing].join(", ")}`);

  return { ok: true, generated_at: new Date(nowMs).toISOString(), config: cfg, amelia_ok: base.ameliaOk, warnings, counts, candidates, skipped, skipped_counts: skippedCounts, missing_templates: [...missing] };
}

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
      email: r.email, phone: candidates[i].phone, channel: "app", amelia_customer_id: candidates[i].context.amelia_customer_id, rule: r.rule, step: r.step,
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
