// Secuencia CEO con descuento (3 emails · tasks #181 y #182).
// Preview-only por ahora. NO se dispara desde ningún endpoint de envío en este PR.
// Diseñado siguiendo el patrón visual de regalo-ceo-diagnostico-gratis.ts.
// Firma SIEMPRE Alejandro Pérez González (CEO), ReplyTo a hola@mentesanapsicologia.com.
import { emailLayout } from "./layout";

const PURPLE = "#6A178C";
const GOLD = "#D4AF37";
const CREAM = "#FFFAF2";
const WHATSAPP_HREF = "https://wa.me/34XXXXXXXXX";

export type CeoDescuentoEmailNumber = 1 | 2 | 3;

interface Props {
  firstName?: string | null;
  email: string;
  redeemUrl: string;
  /** ISO string; se formatea a español dentro de la plantilla. */
  expiresAt: string;
}

// ─────────── helpers (mismo estilo que regalo-ceo-diagnostico-gratis.ts) ───────────
function kicker(t: string): string {
  return `<p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:26px;color:${PURPLE};line-height:1;">${t}</p>`;
}
function h1(t: string): string {
  return `<h1 style="margin:0 0 22px;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.2;color:#1a0a1f;font-weight:500;letter-spacing:-0.4px;">${t}</h1>`;
}
function para(t: string): string {
  return `<p style="margin:0 0 18px;font-size:15.5px;line-height:1.75;color:#1a0a1f;opacity:0.88;">${t}</p>`;
}
function bigCta(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:14px 0 14px;"><tr><td align="center">
    <a href="${href}" style="background:linear-gradient(135deg,${PURPLE} 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:20px 44px;border-radius:999px;font-weight:800;display:inline-block;font-size:18px;letter-spacing:0.2px;box-shadow:0 12px 36px rgba(106,23,140,0.32);">${label}</a>
  </td></tr></table>`;
}
function box(inner: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;"><tr>
    <td style="background:linear-gradient(135deg,${CREAM} 0%,#F0E3F7 100%);border:1px solid rgba(106,23,140,0.22);border-radius:18px;padding:24px 26px;">${inner}</td>
  </tr></table>`;
}
function reassure(t: string): string {
  return `<p style="margin:6px 0 22px;font-size:12.5px;line-height:1.65;color:#1a0a1f;opacity:0.6;text-align:center;">${t}</p>`;
}
function signature(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:10px 0 0;border-top:1px solid rgba(106,23,140,0.14);"><tr><td style="padding-top:22px;">
    <p style="margin:0;font-family:'Caveat',cursive;font-size:26px;color:${PURPLE};line-height:1;">Con cariño,</p>
    <p style="margin:8px 0 0;font-size:14px;color:${PURPLE};font-weight:700;">Alejandro Pérez González</p>
    <p style="margin:2px 0 0;font-size:12.5px;color:#1a0a1f;opacity:0.65;">CEO · Mente Sana</p>
  </td></tr></table>`;
}
function whatsappNote(): string {
  return `<p style="margin:24px 0 0;font-size:11.5px;color:#666;line-height:1.55;">¿Dudas antes de reservar? Escríbenos por WhatsApp al <a href="${WHATSAPP_HREF}" style="color:${PURPLE};text-decoration:underline;">+34 XXX XXX XXX</a>. Te contestamos a mano.</p>`;
}

function formatSpanishDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  // Restar 1ms para que 2026-XX-XXT00:00:00Z (martes 00:00 UTC = lunes 24:00 Madrid) se lea como el día anterior.
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

// ─────────── EMAIL 1 · Hola, soy Alejandro (humano, motivo del descuento) ───────────
function email1({ firstName, redeemUrl, expiresAt }: Props): { subject: string; html: string } {
  const cleanFirst = (firstName ?? "").trim() || null;
  const subject = cleanFirst
    ? `${cleanFirst}, hola — soy Alejandro (CEO de Mente Sana)`
    : "Hola — soy Alejandro (CEO de Mente Sana)";
  const preheader = "Te escribo yo, en persona. Quiero contarte por qué te ofrezco un descuento excepcional.";
  const heading = cleanFirst
    ? `${cleanFirst}, te escribo <em style="color:${PURPLE};font-style:italic;">en persona</em>`
    : `Te escribo <em style="color:${PURPLE};font-style:italic;">en persona</em>`;
  const dateShort = formatSpanishDate(expiresAt);

  const body = `
    ${para(`Soy Alejandro Pérez González, CEO de Mente Sana. No es un email automático de marketing — lo estoy escribiendo yo mismo.`)}
    ${para(`Miré nuestros datos esta semana. Hay miles de personas como tú que se acercaron a Mente Sana, dieron el primer paso… y por lo que sea, no llegaron a cerrar la primera sesión.`)}
    ${para(`No sé qué te frenó — el precio, la duda, el momento. Y no me sirve quedarme sentado sabiéndolo.`)}
    ${para(`Por eso he decidido hacer algo que <strong>nunca hacemos</strong>: abrir un descuento excepcional durante unos días, solo para las personas a las que ya conocemos.`)}
    ${box(`
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.14em;text-transform:uppercase;">Solo para ti</p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a0a1f;opacity:0.9;">
        Diagnóstico completo (50 min con psicóloga colegiada + informe clínico) por <strong>9,99€</strong>.
        Sin letra pequeña, sin permanencia, sin cargos ocultos.
      </p>
    `)}
    ${para(`Mañana te mando el enlace con más detalle. Hoy solo quería que lo supieras de mi parte.`)}
    ${para(`Si quieres ir directamente, aquí lo tienes — activo hasta el <strong>${dateShort}</strong>:`)}
  `;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader,
      content: `
        ${kicker("Un mensaje del CEO")}
        ${h1(heading)}
        <div style="height:2px;width:56px;background:${GOLD};border-radius:1px;margin:0 0 22px;"></div>
        ${body}
        ${bigCta(redeemUrl, "Ver mi descuento →")}
        ${reassure(`Válido hasta el ${formatSpanishDateTime(expiresAt)}.`)}
        ${signature()}
        ${whatsappNote()}
      `,
    }),
  };
}

// ─────────── EMAIL 2 · Tu descuento sigue disponible (recordatorio) ───────────
function email2({ firstName, redeemUrl, expiresAt }: Props): { subject: string; html: string } {
  const cleanFirst = (firstName ?? "").trim() || null;
  const subject = cleanFirst
    ? `${cleanFirst}, tu descuento sigue disponible`
    : "Tu descuento sigue disponible";
  const preheader = "Sigue activo unos días más. Diagnóstico con psicóloga colegiada por 9,99€.";
  const heading = cleanFirst
    ? `${cleanFirst}, tu descuento <em style="color:${PURPLE};font-style:italic;">sigue en pie</em>`
    : `Tu descuento <em style="color:${PURPLE};font-style:italic;">sigue en pie</em>`;
  const dateShort = formatSpanishDate(expiresAt);
  const dateFull = formatSpanishDateTime(expiresAt);

  const body = `
    ${para(`Ayer te escribí para contarte por qué había decidido abrir un descuento excepcional para ti. Hoy te lo recuerdo, sin darte la brasa.`)}
    ${box(`
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.14em;text-transform:uppercase;">Tu descuento</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="padding:6px 0;font-size:15.5px;line-height:1.6;color:#1a0a1f;">
          <span style="color:#1DB954;font-weight:700;">✅</span> <strong>Sesión de diagnóstico de 50 min</strong> con psicóloga colegiada
        </td></tr>
        <tr><td style="padding:6px 0;font-size:15.5px;line-height:1.6;color:#1a0a1f;">
          <span style="color:#1DB954;font-weight:700;">✅</span> <strong>Informe clínico personalizado</strong> post-sesión
        </td></tr>
        <tr><td style="padding:6px 0;font-size:15.5px;line-height:1.6;color:#1a0a1f;">
          <span style="color:#1DB954;font-weight:700;">✅</span> Precio hoy: <strong>9,99€</strong> (en consulta privada esto son 80-150€)
        </td></tr>
      </table>
    `)}
    ${para(`Es una prueba real: si después de la sesión decides que no es para ti, no pasa nada. No hay permanencia ni cargos automáticos.`)}
    ${para(`Sigue activo hasta el <strong>${dateShort}</strong>.`)}
  `;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader,
      content: `
        ${kicker("Recordatorio")}
        ${h1(heading)}
        <div style="height:2px;width:56px;background:${GOLD};border-radius:1px;margin:0 0 22px;"></div>
        ${body}
        ${bigCta(redeemUrl, "Reservar mi diagnóstico →")}
        ${reassure(`Válido hasta el ${dateFull}.`)}
        ${signature()}
        ${whatsappNote()}
      `,
    }),
  };
}

// ─────────── EMAIL 3 · Último aviso (urgencia final) ───────────
function email3({ firstName, redeemUrl, expiresAt }: Props): { subject: string; html: string } {
  const cleanFirst = (firstName ?? "").trim() || null;
  const subject = cleanFirst
    ? `${cleanFirst}, último aviso — se cierra hoy`
    : "Último aviso — se cierra hoy";
  const preheader = "El descuento del CEO se cierra hoy. No lo volvemos a abrir en 2026.";
  const heading = cleanFirst
    ? `${cleanFirst}, hoy se <em style="color:${PURPLE};font-style:italic;">cierra</em>`
    : `Hoy se <em style="color:${PURPLE};font-style:italic;">cierra</em>`;
  const dateFull = formatSpanishDateTime(expiresAt);

  const body = `
    ${para(`Te escribo por última vez sobre esto. A las <strong>${dateFull}</strong> se cierra el descuento y no lo volveré a abrir en lo que queda de año.`)}
    ${para(`Lo entiendo perfectamente si el momento no es ahora. Solo me queda una cosa por decirte:`)}
    ${box(`
      <p style="margin:0;font-size:15.5px;line-height:1.75;color:#1a0a1f;opacity:0.92;font-style:italic;">
        &ldquo;Todos los pacientes que han pasado por Mente Sana empezaron con la misma duda. Casi ninguno se arrepintió de dar el primer paso. La mayoría se arrepintió de no darlo antes.&rdquo;
      </p>
    `)}
    ${para(`Si vas a hacerlo, hazlo ahora. Después ya no depende de mí.`)}
  `;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader,
      content: `
        ${kicker("Último aviso")}
        ${h1(heading)}
        <div style="height:2px;width:56px;background:${GOLD};border-radius:1px;margin:0 0 22px;"></div>
        ${body}
        ${bigCta(redeemUrl, "Activar mi descuento antes de que cierre →")}
        ${reassure(`Se cierra el ${dateFull}. Después vuelve al precio normal.`)}
        ${signature()}
        ${whatsappNote()}
      `,
    }),
  };
}

// ─────────── router público ───────────
export function ceoDescuentoEmail(
  n: CeoDescuentoEmailNumber,
  props: Props,
): { subject: string; html: string } {
  if (n === 1) return email1(props);
  if (n === 2) return email2(props);
  if (n === 3) return email3(props);
  throw new Error(`ceoDescuentoEmail: número inválido ${String(n)}`);
}
