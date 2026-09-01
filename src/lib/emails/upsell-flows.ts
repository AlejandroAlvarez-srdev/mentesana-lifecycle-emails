import * as T from "./upsell-post-sesion";

/**
 * Los 4 FLUJOS de correos de upsell, uno por tipo de paquete. Cada flujo es la
 * secuencia de correos con su DISPARADOR (timing). El motor de envío (cron /
 * CRM) recorre `pasos` según el bono del cliente y el estado de sus sesiones.
 *
 * Reglas del manual respetadas:
 *   · 1 producto nuevo por semana (justificante/resumen no cuentan).
 *   · Sesión adicional 19,99 SOLO en bonos y solo en la ventana 24-48 h tras S1.
 *   · TEST y el INFORME son distintos y se venden los dos (test antes, informe después).
 *   · Desde 7 días antes de la última: cero upsells, solo renovación.
 *   · La sesión individual (sin bono) NO ofrece la de 19,99 (empuja el bono).
 *   · Bono Amor = dos personas: justificante/resumen/test ×2 e informe de pareja.
 */

export type FlowTrigger =
  | { kind: "post_diagnostico" }
  | { kind: "post_sesion"; n: number }
  | { kind: "post_sesion_delay"; n: number; hours: number }
  | { kind: "pre_ultima"; dias: number }
  | { kind: "post_ultima" }
  | { kind: "dia_bono"; dia: number };

export interface FlowCtx {
  name?: string;
  psychologistName?: string | null;
}

export interface FlowStep {
  id: string;
  trigger: FlowTrigger;
  descripcion: string;
  email: (ctx: FlowCtx) => { subject: string; html: string };
}

export interface BonoFlow {
  key: string;
  nombre: string;
  sesiones: number;
  precio: string;
  pasos: FlowStep[];
}

// Atajos de disparador
const diag: FlowTrigger = { kind: "post_diagnostico" };
const s = (n: number): FlowTrigger => ({ kind: "post_sesion", n });
const sDelay = (n: number, hours = 24): FlowTrigger => ({ kind: "post_sesion_delay", n, hours });
const preUlt = (dias = 7): FlowTrigger => ({ kind: "pre_ultima", dias });
const ult: FlowTrigger = { kind: "post_ultima" };
const dia = (d: number): FlowTrigger => ({ kind: "dia_bono", dia: d });

// ── 1 · SESIÓN INDIVIDUAL (sin bono) ─────────────────────────────────────────
const individual: BonoFlow = {
  key: "individual",
  nombre: "Sesión individual",
  sesiones: 1,
  precio: "—",
  pasos: [
    { id: "diag", trigger: diag, descripcion: "SOLO justificante (8,99€)", email: (c) => T.emailPostDiagnostico(c) },
    { id: "s1", trigger: s(1), descripcion: "Justificante + resumen", email: (c) => T.emailPostSesion1(c) },
    // OJO: aquí NO se envía la sesión de 19,99 (prohibida). El bono lo empuja ventas.
    { id: "s2", trigger: s(2), descripcion: "+ informe clínico (si se regala 2ª sesión)", email: (c) => T.emailPostSesionMedia(c) },
    { id: "rescate", trigger: dia(30), descripcion: "Rescate: segunda opinión (28,97€)", email: (c) => T.emailRescateSegundaOpinion(c) },
  ],
};

// ── 2 · BONO COMPAÑÍA · 4 sesiones · 149,99 € ────────────────────────────────
const compania: BonoFlow = {
  key: "compania",
  nombre: "Bono Compañía",
  sesiones: 4,
  precio: "149,99 €",
  pasos: [
    { id: "diag", trigger: diag, descripcion: "SOLO justificante", email: (c) => T.emailPostDiagnostico(c) },
    { id: "s1", trigger: s(1), descripcion: "Justificante + resumen", email: (c) => T.emailPostSesion1(c) },
    { id: "s1-adicional", trigger: sDelay(1, 24), descripcion: "Sesión adicional 19,99€ (única, caduca 48 h)", email: (c) => T.emailSesionAdicional(c) },
    { id: "s2", trigger: s(2), descripcion: "Justificante + resumen + informe", email: (c) => T.emailPostSesionMedia(c) },
    { id: "s2-test", trigger: sDelay(2, 24), descripcion: "Test psicométrico (49,99€)", email: (c) => T.emailTestPsicometrico(c) },
    { id: "s3", trigger: s(3), descripcion: "Justificante + resumen + informe", email: (c) => T.emailPostSesionMedia(c) },
    { id: "s3-pareja", trigger: sDelay(3, 24), descripcion: "Sesión de pareja o familiar (44,99€)", email: (c) => T.emailSesionParejaFamiliar({ ...c, variante: "pareja" }) },
    { id: "renovacion", trigger: preUlt(7), descripcion: "Renovación 149,99€ (desde 7 días antes)", email: (c) => T.emailRenovacion({ ...c, nombreBono: "el Bono Compañía", precioBono: "149,99 €" }) },
    { id: "ultima", trigger: ult, descripcion: "Justificante + resumen (SIN informe)", email: (c) => T.emailPostUltimaSesion(c) },
    { id: "prorroga", trigger: dia(30), descripcion: "Prórroga 20€/mes (tras un no a renovar)", email: (c) => T.emailProrroga(c) },
  ],
};

// ── 3 · BONO FELICIDAD · 8 sesiones · 229,99 € ───────────────────────────────
const felicidad: BonoFlow = {
  key: "felicidad",
  nombre: "Bono Felicidad",
  sesiones: 8,
  precio: "229,99 €",
  pasos: [
    { id: "diag", trigger: diag, descripcion: "SOLO justificante", email: (c) => T.emailPostDiagnostico(c) },
    { id: "s1", trigger: s(1), descripcion: "Justificante + resumen", email: (c) => T.emailPostSesion1(c) },
    { id: "s1-adicional", trigger: sDelay(1, 24), descripcion: "Sesión adicional 19,99€ (única, 48 h)", email: (c) => T.emailSesionAdicional(c) },
    { id: "s2", trigger: s(2), descripcion: "Justificante + resumen + informe", email: (c) => T.emailPostSesionMedia(c) },
    { id: "s2-test", trigger: sDelay(2, 24), descripcion: "Test psicométrico (49,99€)", email: (c) => T.emailTestPsicometrico(c) },
    { id: "s3", trigger: s(3), descripcion: "Justificante + resumen + informe", email: (c) => T.emailPostSesionMedia(c) },
    { id: "s3-pareja", trigger: sDelay(3, 24), descripcion: "Sesión de pareja o familiar (44,99€)", email: (c) => T.emailSesionParejaFamiliar({ ...c, variante: "pareja" }) },
    { id: "s4", trigger: s(4), descripcion: "Justificante + resumen + informe (ecuador)", email: (c) => T.emailPostSesionMedia(c) },
    { id: "s4-cartilla", trigger: sDelay(4, 24), descripcion: "Refuerza la cartilla de terapia (39,99€)", email: (c) => T.emailCartillaTerapia(c) },
    { id: "s5", trigger: s(5), descripcion: "Justificante + resumen + informe", email: (c) => T.emailPostSesionMedia(c) },
    { id: "s6", trigger: s(6), descripcion: "Justificante + resumen + informe", email: (c) => T.emailPostSesionMedia(c) },
    { id: "s7", trigger: s(7), descripcion: "Justificante + resumen + informe (penúltima)", email: (c) => T.emailPostSesionMedia(c) },
    { id: "renovacion", trigger: preUlt(7), descripcion: "Renovación 229,99€ (desde 7 días antes)", email: (c) => T.emailRenovacion({ ...c, nombreBono: "el Bono Felicidad", precioBono: "229,99 €" }) },
    { id: "ultima", trigger: ult, descripcion: "Justificante + resumen (SIN informe)", email: (c) => T.emailPostUltimaSesion(c) },
    { id: "prorroga", trigger: dia(30), descripcion: "Prórroga 20€/mes (tras un no)", email: (c) => T.emailProrroga(c) },
  ],
};

// ── 4 · BONO AMOR · 4 sesiones de pareja · 179 € (todo ×2) ───────────────────
const P2 = { personas: 2 as const };
const amor: BonoFlow = {
  key: "amor",
  nombre: "Bono Amor",
  sesiones: 4,
  precio: "179 €",
  pasos: [
    { id: "diag", trigger: diag, descripcion: "SOLO justificante", email: (c) => T.emailPostDiagnostico(c) },
    { id: "s1", trigger: s(1), descripcion: "Justificante + resumen ×2 (uno por persona)", email: (c) => T.emailPostSesion1({ ...c, ...P2 }) },
    { id: "s1-individual", trigger: sDelay(1, 24), descripcion: "Sesión individual para uno 19,99€ (única, 48 h)", email: (c) => T.emailSesionAdicional({ ...c, ...P2 }) },
    { id: "s2", trigger: s(2), descripcion: "Justificante + resumen ×2 + informe de pareja", email: (c) => T.emailPostSesionMedia({ ...c, ...P2 }) },
    { id: "s2-test", trigger: sDelay(2, 24), descripcion: "Test psicométrico a cada uno (49,99€ ×2)", email: (c) => T.emailTestPsicometrico({ ...c, ...P2 }) },
    { id: "s3", trigger: s(3), descripcion: "Justificante + resumen ×2 + informe de pareja", email: (c) => T.emailPostSesionMedia({ ...c, ...P2 }) },
    { id: "s3-tercero", trigger: sDelay(3, 24), descripcion: "Sumar a un tercero / sesión familiar (44,99€)", email: (c) => T.emailSesionParejaFamiliar({ ...c, variante: "tercero" }) },
    { id: "renovacion", trigger: preUlt(7), descripcion: "Renovación 179€ (desde 7 días antes)", email: (c) => T.emailRenovacion({ ...c, nombreBono: "el Bono Amor", precioBono: "179 €" }) },
    { id: "ultima", trigger: ult, descripcion: "Justificante + resumen ×2 (SIN informe)", email: (c) => T.emailPostUltimaSesion({ ...c, ...P2 }) },
    { id: "rescate", trigger: dia(30), descripcion: "Rescate: segunda opinión (con cuidado en pareja)", email: (c) => T.emailRescateSegundaOpinion({ ...c, ...P2 }) },
  ],
};

export const FLOWS: BonoFlow[] = [individual, compania, felicidad, amor];

export function getFlow(key: string): BonoFlow | undefined {
  return FLOWS.find((f) => f.key === key);
}
