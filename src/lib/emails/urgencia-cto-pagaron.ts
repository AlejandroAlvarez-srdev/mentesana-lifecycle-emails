// Email transaccional · SEGMENTO A "URGENCIA CTO — pagaron pero no agendaron".
// Universo: diagnostico_tests con paid=true + email presente + sin agendar
// (session_scheduled_at IS NULL AND scheduled_date IS NULL). Estos leads YA
// desembolsaron 9,99€, así que el tono es "reclama lo tuyo, mañana lo pierdes"
// (no es un regalo — el sistema libera el hueco a otras pacientes).
//
// Firma: Alejandro Álvarez · CTO Mente Sana (ex-Microsoft). Paleta rojo/naranja.
// Reply-to fijo: hola@mentesanapsicologia.com.
import { emailLayout } from "./layout";

const RED = "#C81E1E"; // urgencia principal
const ORANGE = "#F97316"; // acento y CTA
const DEEP = "#1a0a1f";
const CREAM = "#FFFAF2";
const WHATSAPP_HREF = "https://wa.me/34XXXXXXXXX";

interface Props {
  firstName?: string | null;
  email: string;
  psychologistName?: string | null;
  reserveUrl: string;
  /** ISO string; se formatea a español dentro de la plantilla. */
  expiresAt: string;
}

// ─────────── helpers (mismos primitives que urgencia-cto-abandoned) ───────────
function kicker(t: string): string {
  return `<p style="margin:0 0 8px;font-family:'Inter',sans-serif;font-size:12px;font-weight:800;color:${RED};line-height:1;letter-spacing:0.18em;text-transform:uppercase;">${t}</p>`;
}
function h1(t: string): string {
  return `<h1 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.2;color:${DEEP};font-weight:600;letter-spacing:-0.4px;">${t}</h1>`;
}
function para(t: string): string {
  return `<p style="margin:0 0 16px;font-size:15.5px;line-height:1.75;color:${DEEP};opacity:0.9;">${t}</p>`;
}
function bigCta(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:20px 0 12px;"><tr><td align="center">
    <a href="${href}" style="background:linear-gradient(135deg,${RED} 0%,${ORANGE} 100%);color:#ffffff !important;text-decoration:none;padding:22px 40px;border-radius:999px;font-weight:800;display:inline-block;font-size:17px;letter-spacing:0.2px;box-shadow:0 14px 36px rgba(200,30,30,0.35);text-transform:uppercase;">${label}</a>
  </td></tr></table>`;
}
function alertBar(dateShort: string): string {
  // Hero rojo — variante SEG A: destaca la fecha de caducidad, no cupos.
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 26px;"><tr>
    <td style="background:linear-gradient(135deg,${RED} 0%,#8A1010 100%);border-radius:16px;padding:22px 24px;text-align:center;">
      <p style="margin:0 0 6px;font-family:'Inter',sans-serif;font-size:11px;font-weight:800;color:#FFD9D9;letter-spacing:0.22em;text-transform:uppercase;">Aviso urgente del CTO</p>
      <p style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#ffffff;font-weight:600;line-height:1.25;">
        Tu diagnóstico caduca <span style="background:${ORANGE};color:#ffffff;padding:2px 12px;border-radius:8px;font-weight:800;">mañana</span>
      </p>
      <p style="margin:0;font-size:13px;color:#FFEDED;line-height:1.55;">Cierre: <strong style="color:#ffffff;">${dateShort} · 23:59 Madrid</strong></p>
    </td>
  </tr></table>`;
}
function reassure(t: string): string {
  return `<p style="margin:6px 0 22px;font-size:12.5px;line-height:1.65;color:${DEEP};opacity:0.6;text-align:center;">${t}</p>`;
}
function signature(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:12px 0 0;border-top:1px solid rgba(0,0,0,0.08);"><tr><td style="padding-top:22px;">
    <p style="margin:0;font-family:'Caveat',cursive;font-size:26px;color:${DEEP};line-height:1;">— Alejandro</p>
    <p style="margin:10px 0 0;font-size:14px;color:${DEEP};font-weight:700;">Alejandro Álvarez</p>
    <p style="margin:2px 0 0;font-size:12.5px;color:${DEEP};opacity:0.7;">CTO · Mente Sana Psicología · ex-Microsoft</p>
  </td></tr></table>`;
}
function ps(t: string): string {
  return `<p style="margin:20px 0 0;font-size:13.5px;line-height:1.7;color:${DEEP};opacity:0.85;font-style:italic;"><strong style="font-style:normal;color:${RED};">PS.</strong> ${t}</p>`;
}
function whatsappNote(): string {
  return `<p style="margin:22px 0 0;font-size:11.5px;color:#666;line-height:1.55;">¿Algo se atascó al reservar? WhatsApp <a href="${WHATSAPP_HREF}" style="color:${RED};text-decoration:underline;">+34 XXX XXX XXX</a> · lo resolvemos a mano.</p>`;
}

function formatSpanishDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const boundary = new Date(d.getTime() - 1);
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const madrid = new Date(boundary.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  return `${days[madrid.getDay()]} ${madrid.getDate()} de ${months[madrid.getMonth()]}`;
}
function formatSpanishDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const boundary = new Date(d.getTime() - 1);
  const madrid = new Date(boundary.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const dateStr = formatSpanishDate(iso);
  const hh = String(madrid.getHours()).padStart(2, "0");
  const mm = String(madrid.getMinutes()).padStart(2, "0");
  return `${dateStr} a las ${hh}:${mm} (hora Madrid)`;
}

// ─────────── template ───────────
export function urgenciaCtoPagaronEmail({
  firstName,
  email: _email,
  psychologistName,
  reserveUrl,
  expiresAt,
}: Props): { subject: string; html: string } {
  const cleanFirst = (firstName ?? "").trim() || null;
  const psi = (psychologistName ?? "").trim() || null;

  // Subject SEG A — "reclama lo tuyo" con fallbacks progresivos.
  const subject = cleanFirst && psi
    ? `🔥 ${cleanFirst}, tu diagnóstico caduca mañana — ${psi} sigue esperándote`
    : cleanFirst && !psi
      ? `🔥 ${cleanFirst}, tu diagnóstico caduca mañana`
      : !cleanFirst && psi
        ? `🔥 Tu diagnóstico caduca mañana — ${psi} sigue esperándote`
        : `🔥 Tu diagnóstico caduca mañana`;

  const preheader = "Ya lo pagaste. No agendaste. Mañana devuelvo tu hueco.";

  const heading = cleanFirst
    ? `${cleanFirst}, ya pagaste. <em style="color:${RED};font-style:italic;">Mañana pierdes tu cita.</em>`
    : `Ya pagaste. <em style="color:${RED};font-style:italic;">Mañana pierdes tu cita.</em>`;

  const dateShort = formatSpanishDate(expiresAt);
  const dateFull = formatSpanishDateTime(expiresAt);

  const psiLineOpen = psi
    ? `<strong>Pagaste tu diagnóstico de 9,99€.</strong> El matching se hizo. Tu psicóloga <strong>${psi}</strong> (colegiada) tiene tu ficha lista. Pero nunca elegiste hora.`
    : `<strong>Pagaste tu diagnóstico de 9,99€.</strong> El matching se hizo. Tu psicóloga colegiada tiene tu ficha lista. Pero nunca elegiste hora.`;

  const psiLineCierre = psi
    ? `mañana martes ${dateShort} a las 23:59</strong> el sistema libera automáticamente los cupos no reservados y <strong>${psi} pasa a atender a otras pacientes.`
    : `mañana martes ${dateShort} a las 23:59</strong> el sistema libera automáticamente los cupos no reservados y <strong>tu psicóloga pasa a atender a otras pacientes.`;

  const bulletSesion = psi
    ? `<strong>Sesión de 50 min</strong> con ${psi} (colegiada, especialista)`
    : `<strong>Sesión de 50 min</strong> con tu psicóloga colegiada asignada`;

  const letter = `
    ${para(`Soy <strong>Alejandro Álvarez</strong>, CTO de Mente Sana. Revisando la base de datos te vi:`)}
    ${para(psiLineOpen)}
    ${para(`No sé qué pasó — la vida, el miedo, se te olvidó. Da igual. Lo que sé es que <strong>${psiLineCierre}</strong>`)}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 18px;background:${CREAM};border:1px solid rgba(200,30,30,0.18);border-radius:14px;">
      <tr><td style="padding:18px 20px 6px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:800;color:${RED};letter-spacing:0.16em;text-transform:uppercase;">Qué tienes ya pagado y esperando</p>
      </td></tr>
      <tr><td style="padding:0 20px 6px;font-size:15px;line-height:1.6;color:${DEEP};">
        <span style="color:${RED};font-weight:800;">✓</span> ${bulletSesion}
      </td></tr>
      <tr><td style="padding:0 20px 6px;font-size:15px;line-height:1.6;color:${DEEP};">
        <span style="color:${RED};font-weight:800;">✓</span> <strong>Informe clínico personalizado</strong> por escrito
      </td></tr>
      <tr><td style="padding:0 20px 18px;font-size:15px;line-height:1.6;color:${DEEP};">
        <span style="color:${RED};font-weight:800;">✓</span> <strong>Acceso 1 mes GRATIS</strong> a la app Mente Sana
      </td></tr>
    </table>
    ${para(`<strong>No pagas nada más.</strong> Ya lo hiciste. Solo entra, elige hora, y en 24-72h tienes tu diagnóstico.`)}
  `;

  const closing = para(
    `Si no reservas antes de <strong>mañana ${dateShort} · 23:59</strong>, tu psi cede el hueco y tendrías que volver a pagar los 9,99€ para poder acceder. No es una amenaza, es cómo funciona el sistema.`
  );

  const reassureTxt = `Sin coste extra. Sin trampas. Expira el ${dateFull}. Te lo firma el CTO.`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader,
      content: `
        ${alertBar(dateShort)}
        ${kicker("Última oportunidad · 24 horas")}
        ${h1(heading)}
        ${letter}
        ${bigCta(reserveUrl, "🎯 Reservar mi cita ahora (5 segundos)")}
        ${closing}
        ${reassure(reassureTxt)}
        ${signature()}
        ${ps(`Si tienes dudas o pasó algo, respóndeme a este email. Lo leo yo mismo, te ayudo a resolverlo. No hace falta llamar a soporte.`)}
        ${whatsappNote()}
      `,
    }),
  };
}
