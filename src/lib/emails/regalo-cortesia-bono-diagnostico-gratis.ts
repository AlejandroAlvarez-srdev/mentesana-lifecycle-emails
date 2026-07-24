// Email transaccional · "Cortesía" a pacientes que YA son clientes MS (compraron bono)
// pero nunca hicieron el Diagnóstico Clínico completo de 9,99€.
// Regalo: sesión de diagnóstico + informe personalizado + 1 mes de app GRATIS.
// Token único ligado al email; expira típicamente lunes 24:00 Madrid.
import { emailLayout } from "./layout";

const PURPLE = "#6A178C";
const GOLD = "#D4AF37";
const CREAM = "#FFFAF2";
const WHATSAPP_HREF = "https://wa.me/34XXXXXXXXX";

interface Props {
  firstName?: string | null;
  email: string;
  /** Puede venir null; el fallback cross-psi de /slots se encarga. */
  psychologistName?: string | null;
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
    <p style="margin:0;font-family:'Caveat',cursive;font-size:26px;color:${PURPLE};line-height:1;">Un abrazo,</p>
    <p style="margin:8px 0 0;font-size:14px;color:${PURPLE};font-weight:700;">El equipo de Mente Sana</p>
  </td></tr></table>`;
}
function whatsappNote(): string {
  return `<p style="margin:24px 0 0;font-size:11.5px;color:#666;line-height:1.55;">¿Dudas antes de reservar? Escríbenos por WhatsApp al <a href="${WHATSAPP_HREF}" style="color:${PURPLE};text-decoration:underline;">+34 XXX XXX XXX</a>. Te contestamos a mano.</p>`;
}

function formatSpanishDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  // Restar 1ms para que 2026-07-28T00:00:00Z (martes 00:00 UTC = lunes 24:00 Madrid) se lea como "lunes 27".
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
export function regaloCortesiaBonoDiagnosticoGratisEmail({
  firstName,
  email: _email,
  psychologistName,
  redeemUrl,
  expiresAt,
}: Props): { subject: string; html: string } {
  const cleanFirst = (firstName ?? "").trim() || null;
  const psi = (psychologistName ?? "").trim() || "tu psicóloga";

  const subject = cleanFirst
    ? `${cleanFirst}, tienes un regalo pendiente de Mente Sana`
    : "Tienes un regalo pendiente de Mente Sana";

  const preheader = "El diagnóstico clínico completo (que no está en tu bono) + 1 mes de app GRATIS. Cortesía para ti.";

  const heading = cleanFirst
    ? `${cleanFirst}, te regalamos algo que <em style="color:${PURPLE};font-style:italic;">muchos pacientes no reciben</em>`
    : `Te regalamos algo que <em style="color:${PURPLE};font-style:italic;">muchos pacientes no reciben</em>`;

  const dateShort = formatSpanishDate(expiresAt);
  const dateFull = formatSpanishDateTime(expiresAt);

  const intro = `
    ${para(`Detectamos que estás en Mente Sana, tienes tu bono activo, pero nunca pasaste por nuestro <strong>Diagnóstico Clínico completo</strong> (el proceso de 50 min + informe personalizado que ofrecemos a los nuevos pacientes por 9,99€).`)}
    ${para(`Es la pieza que da contexto profundo a las sesiones — tu psicóloga entiende de dónde vienes en un solo encuentro. Muchos de nuestros pacientes lo hacen fuera del bono y les cambia el trabajo terapéutico.`)}
  `;

  const offerBox = box(`
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.14em;text-transform:uppercase;">Cortesía Mente Sana</p>
    <p style="margin:0 0 14px;font-size:15.5px;line-height:1.7;color:#1a0a1f;">
      <strong>Como cortesía por ser parte de Mente Sana, te lo regalamos hoy</strong> — junto con:
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 14px;">
      <tr><td style="padding:6px 0;font-size:15px;line-height:1.6;color:#1a0a1f;">
        <span style="color:#1DB954;font-weight:700;">✅</span> Sesión de diagnóstico de <strong>50 min</strong> con <strong>${psi}</strong>
      </td></tr>
      <tr><td style="padding:6px 0;font-size:15px;line-height:1.6;color:#1a0a1f;">
        <span style="color:#1DB954;font-weight:700;">✅</span> <strong>Informe clínico personalizado</strong> (evaluación completa)
      </td></tr>
      <tr><td style="padding:6px 0;font-size:15px;line-height:1.6;color:#1a0a1f;">
        <span style="color:#1DB954;font-weight:700;">✅</span> <strong>1 mes GRATIS de la app</strong> Mente Sana (meditaciones, IA, contenido)
      </td></tr>
    </table>
    <p style="margin:0;font-size:13.5px;line-height:1.6;color:#1a0a1f;opacity:0.75;">
      Sin coste extra. No consume sesiones de tu bono. Válido hasta el <strong>${dateShort}</strong>.
    </p>
  `);

  const reassureTxt = `Es un link único ligado a tu email — solo tú puedes canjearlo. Tu bono actual queda intacto. Caduca el ${dateFull}.`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader,
      content: `
        ${kicker("Como agradecimiento por confiar en nosotras")}
        ${h1(heading)}
        <div style="height:2px;width:56px;background:${GOLD};border-radius:1px;margin:0 0 22px;"></div>
        ${intro}
        ${offerBox}
        ${bigCta(redeemUrl, "Agendar mi diagnóstico gratis →")}
        ${reassure(reassureTxt)}
        ${signature()}
        ${whatsappNote()}
      `,
    }),
  };
}
