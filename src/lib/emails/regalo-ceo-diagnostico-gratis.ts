// Email transaccional · Regalo directo del CEO a leads que no terminaron el diagnóstico.
// Sesión de diagnóstico + informe clínico + 1 mes de app GRATIS. Token único ligado al email.
// Caduca típicamente el lunes 24:00 Madrid.
import { emailLayout } from "./layout";

const PURPLE = "#6A178C";
const GOLD = "#D4AF37";
const CREAM = "#FFFAF2";
const WHATSAPP_HREF = "https://wa.me/34XXXXXXXXX";

interface Props {
  firstName?: string | null;
  email: string;
  psychologistName: string;
  redeemUrl: string;
  /** ISO string; se formatea a español dentro de la plantilla. */
  expiresAt: string;
}

// ─────────── helpers (mismo estilo que app-actualiza-o-descarga.ts) ───────────
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
  // Restar 1ms para que 2026-07-28T00:00:00Z (martes 00:00 UTC = lunes 24:00 Madrid) se lea como "lunes 27".
  const boundary = new Date(d.getTime() - 1);
  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  // Fijar en zona Europa/Madrid.
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
export function regaloCeoDiagnosticoGratisEmail({
  firstName,
  email: _email,
  psychologistName,
  redeemUrl,
  expiresAt,
}: Props): { subject: string; html: string } {
  const cleanFirst = (firstName ?? "").trim() || null;
  const psi = (psychologistName ?? "").trim() || "tu psicóloga";

  const subject = cleanFirst
    ? `${cleanFirst}, el CEO de Mente Sana vio tu caso — regalo dentro`
    : "El CEO de Mente Sana vio tu caso — regalo dentro";

  const preheader = "Sesión de diagnóstico + informe + 1 mes de app GRATIS. Sin pagar nada. Caduca el lunes.";

  const heading = cleanFirst
    ? `${cleanFirst}, ${psi} <em style="color:${PURPLE};font-style:italic;">te está esperando</em>`
    : `Tu psicóloga ya <em style="color:${PURPLE};font-style:italic;">te está esperando</em>`;

  const dateShort = formatSpanishDate(expiresAt);
  const dateFull = formatSpanishDateTime(expiresAt);

  // Cuerpo — carta personal del CEO. Palabras textuales del brief.
  const letter = `
    ${para(`Vi tu caso en el sistema. Empezaste el diagnóstico, elegiste día, pero al final no lo terminaste. No sé qué te frenó — el precio, la duda, la vida. No importa.`)}
    ${para(`Quiero que lo hagas. Por eso te regalo:`)}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 18px;">
      <tr><td style="padding:6px 0;font-size:15.5px;line-height:1.6;color:#1a0a1f;">
        <span style="color:#1DB954;font-weight:700;">✅</span> Tu <strong>sesión de diagnóstico de 50 min</strong> con ${psi} (colegiada)
      </td></tr>
      <tr><td style="padding:6px 0;font-size:15.5px;line-height:1.6;color:#1a0a1f;">
        <span style="color:#1DB954;font-weight:700;">✅</span> Tu <strong>informe clínico personalizado</strong>
      </td></tr>
      <tr><td style="padding:6px 0;font-size:15.5px;line-height:1.6;color:#1a0a1f;">
        <span style="color:#1DB954;font-weight:700;">✅</span> <strong>1 mes GRATIS</strong> de la app Mente Sana (meditaciones, IA, contenido)
      </td></tr>
    </table>
    ${para(`Sin pagar nada. Sin letra pequeña. Solo hoy y hasta el lunes.`)}
    ${para(`Agenda cuando puedas antes del <strong>${dateShort}</strong>.`)}
  `;

  const reassureTxt = `Es un token único ligado a tu email. Caduca el ${dateFull}. Sin trampas.`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader,
      content: `
        ${kicker("Un regalo directo del CEO")}
        ${h1(heading)}
        <div style="height:2px;width:56px;background:${GOLD};border-radius:1px;margin:0 0 22px;"></div>
        ${box(`
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.14em;text-transform:uppercase;">Mensaje del CEO · Alejandro Pérez</p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#1a0a1f;opacity:0.9;font-style:italic;">
            &ldquo;El CEO de Mente Sana vio tu caso y quiere ayudarte esta única vez, dejándote la cita y diagnóstico y un mes de prueba en la app GRATIS para que puedas hacer las cosas bien.&rdquo;
          </p>
        `)}
        ${letter}
        ${bigCta(redeemUrl, "Reservar mi cita GRATIS →")}
        ${reassure(reassureTxt)}
        ${signature()}
        ${whatsappNote()}
      `,
    }),
  };
}
