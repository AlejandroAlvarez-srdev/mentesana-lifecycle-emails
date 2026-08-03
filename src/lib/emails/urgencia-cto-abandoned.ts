// Email transaccional · SEGMENTO B "URGENCIA CTO — abandonaron sin pagar".
// Universo: diagnostico_tests con paid=false + email presente + sin agendar
// (session_scheduled_at IS NULL AND scheduled_date IS NULL), EXCLUYENDO a los
// que ya recibieron el regalo del CEO (diagnostico_gratis_tokens con
// brevo_message_id != NULL). Tono: "te regalo la sesión".
//
// Firma: Alejandro Álvarez · CTO Mente Sana (ex-Microsoft). Paleta rojo/naranja
// (NO morado suave) — se diferencia visualmente del CEO.
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
  redeemUrl: string;
  /** ISO string; se formatea a español dentro de la plantilla. */
  expiresAt: string;
  /** Cupos restantes visibles en el hero. Por defecto 15. */
  cuposRestantes?: number;
}

// ─────────── helpers (mismo enfoque inline que regalo-ceo) ───────────
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
function alertBar(cupos: number, dateShort: string): string {
  // Hero rojo con countdown visual — el elemento que diferencia esta ola del CEO.
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 26px;"><tr>
    <td style="background:linear-gradient(135deg,${RED} 0%,#8A1010 100%);border-radius:16px;padding:22px 24px;text-align:center;">
      <p style="margin:0 0 6px;font-family:'Inter',sans-serif;font-size:11px;font-weight:800;color:#FFD9D9;letter-spacing:0.22em;text-transform:uppercase;">Aviso del CTO</p>
      <p style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#ffffff;font-weight:600;line-height:1.25;">
        Solo quedan <span style="background:${ORANGE};color:#ffffff;padding:2px 12px;border-radius:8px;font-weight:800;">${cupos} cupos</span> gratuitos
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
  return `<p style="margin:22px 0 0;font-size:11.5px;color:#666;line-height:1.55;">¿Dudas antes de reservar? WhatsApp <a href="${WHATSAPP_HREF}" style="color:${RED};text-decoration:underline;">+34 XXX XXX XXX</a> · te contestamos a mano.</p>`;
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
export function urgenciaCtoAbandonedEmail({
  firstName,
  email: _email,
  psychologistName,
  redeemUrl,
  expiresAt,
  cuposRestantes = 15,
}: Props): { subject: string; html: string } {
  const cleanFirst = (firstName ?? "").trim() || null;
  const psi = (psychologistName ?? "").trim() || null;

  // Subject SEG B — "regalo/gratis" (nunca pagaron)
  const subject = cleanFirst
    ? `🎁 ${cleanFirst}, cita psicóloga GRATIS mañana — solo ${cuposRestantes} cupos`
    : `🎁 Cita psicóloga GRATIS mañana — solo ${cuposRestantes} cupos`;

  const preheader = "Cita con psicóloga colegiada. Sin tarjeta. Sin trampa. Se cierra mañana.";

  const heading = cleanFirst
    ? `${cleanFirst}, tengo que <em style="color:${RED};font-style:italic;">devolver tu cupo mañana</em>`
    : `Tengo que <em style="color:${RED};font-style:italic;">devolver tu cupo mañana</em>`;

  const dateShort = formatSpanishDate(expiresAt);
  const dateFull = formatSpanishDateTime(expiresAt);

  // Cuerpo — carta directa del CTO. Palabras textuales del brief.
  const psiLine = psi
    ? `El sistema todavía te tiene asignada a <strong>${psi}</strong> (colegiada). Si dejas pasar este email, mañana libero su hueco.`
    : `El sistema todavía te tiene una psicóloga colegiada asignada. Si dejas pasar este email, mañana libero su hueco.`;

  const letter = `
    ${para(`Soy <strong>Alejandro Álvarez</strong>, CTO de Mente Sana. Miré la data y te vi ahí.`)}
    ${para(`Iniciaste el diagnóstico. No pagaste. No pasa nada — entiendo el miedo.`)}
    ${para(`Por eso hoy tomo una decisión que va contra el manual: <strong>te regalo tu diagnóstico completo + sesión con psicóloga colegiada.</strong> Sin tarjeta. Sin costes ocultos. Sin trampa.`)}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 18px;background:${CREAM};border:1px solid rgba(200,30,30,0.18);border-radius:14px;">
      <tr><td style="padding:18px 20px 6px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:800;color:${RED};letter-spacing:0.16em;text-transform:uppercase;">Qué llevas si reservas hoy</p>
      </td></tr>
      <tr><td style="padding:0 20px 6px;font-size:15px;line-height:1.6;color:${DEEP};">
        <span style="color:${RED};font-weight:800;">✓</span> <strong>Sesión de diagnóstico</strong> de 50 min con psicóloga colegiada
      </td></tr>
      <tr><td style="padding:0 20px 6px;font-size:15px;line-height:1.6;color:${DEEP};">
        <span style="color:${RED};font-weight:800;">✓</span> <strong>Informe clínico personalizado</strong> por escrito
      </td></tr>
      <tr><td style="padding:0 20px 18px;font-size:15px;line-height:1.6;color:${DEEP};">
        <span style="color:${RED};font-weight:800;">✓</span> <strong>1 mes GRATIS</strong> de la app Mente Sana
      </td></tr>
    </table>
    ${para(`<strong style="color:${RED};">Solo hay ${cuposRestantes} cupos entre HOY y MAÑANA.</strong> Cuando se acaban, no vuelven a abrir hasta septiembre.`)}
    ${para(psiLine)}
    ${para(`Si dejas pasar este email, <strong>mañana ${dateShort} a las 23:59 pierdes acceso.</strong> Sin excepciones. Tengo que devolver los cupos al equipo.`)}
  `;

  const reassureTxt = `Token único ligado a tu email. Expira el ${dateFull}. Sin trampas — te lo firma el CTO.`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader,
      content: `
        ${alertBar(cuposRestantes, dateShort)}
        ${kicker("Última oportunidad · 24 horas")}
        ${h1(heading)}
        ${letter}
        ${bigCta(redeemUrl, "🎁 Reservar mi cita GRATIS ahora")}
        ${reassure(reassureTxt)}
        ${signature()}
        ${ps(`Si tienes cualquier duda, respóndeme a este email. Lo leo yo mismo.`)}
        ${whatsappNote()}
      `,
    }),
  };
}
