// Email B2C · App promo para audiencia NO clínica.
// Idea: no hace falta estar en terapia para usar la app —
// meditaciones + audiolibros + María 24/7 + talleres, gratis.
import { PLAY_STORE_URL, APP_STORE_URL, SMART_DOWNLOAD_HREF } from "@/lib/app-links";
import { emailLayout } from "./layout";

const PURPLE = "#6A178C";
const MARKETING_APP = "https://mentesanapsicologia.com/marketing-app";
const WHATSAPP_HREF = "https://wa.me/34XXXXXXXXX";
const SITE = "https://mentesanapsicologia.com";
const SMART_HREF = `${SITE}${SMART_DOWNLOAD_HREF}`;

interface Props {
  firstName?: string;
  email: string;
}

const hi = (n?: string) => n || "hola";

// ─────────── helpers (mismo estilo que funnel.ts) ───────────
function kicker(t: string): string {
  return `<p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:24px;color:${PURPLE};line-height:1;">${t}</p>`;
}
function h1(t: string): string {
  return `<h1 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.18;color:#1a0a1f;font-weight:500;letter-spacing:-0.4px;">${t}</h1>`;
}
function para(t: string): string {
  return `<p style="margin:0 0 18px;font-size:15.5px;line-height:1.75;color:#1a0a1f;opacity:0.85;">${t}</p>`;
}
function cta(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:6px 0 20px;"><tr><td align="center">
    <a href="${href}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:16px 38px;border-radius:999px;font-weight:700;display:inline-block;font-size:16px;box-shadow:0 8px 30px rgba(106,23,140,0.28);">${label}</a>
  </td></tr></table>`;
}
function heroImage(src: string, alt: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 26px;"><tr><td align="center">
    <img src="${SITE}${src}" alt="${alt}" width="360" style="width:100%;max-width:360px;height:auto;border-radius:18px;border:1px solid rgba(106,23,140,0.15);display:block;" />
  </td></tr></table>`;
}
function ctaBadges(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:6px 0 12px;"><tr><td align="center">
    <a href="${SMART_HREF}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:16px 42px;border-radius:999px;font-weight:700;display:inline-block;font-size:16px;box-shadow:0 8px 30px rgba(106,23,140,0.28);">
      Descargar / Actualizar la app →
    </a>
  </td></tr></table>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 22px;"><tr><td align="center">
    <a href="${PLAY_STORE_URL}" style="display:inline-block;margin:0 6px;">
      <img src="${SITE}/images/app/google-play-badge-3x1.png" alt="Disponible en Google Play" width="150" style="height:44px;width:auto;border:0;" />
    </a>
    <a href="${APP_STORE_URL}" style="display:inline-block;margin:0 6px;">
      <img src="${SITE}/images/app/app-store-badge.png" alt="Descargar en App Store" width="150" style="height:44px;width:auto;border:0;" />
    </a>
  </td></tr></table>`;
}
function reassure(t: string): string {
  return `<p style="margin:0 0 26px;font-size:12.5px;line-height:1.6;color:#1a0a1f;opacity:0.55;text-align:center;">${t}</p>`;
}
function box(inner: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;"><tr>
    <td style="background:linear-gradient(135deg,#FBF4E8 0%,#F0E3F7 100%);border:1px solid rgba(106,23,140,0.22);border-radius:18px;padding:22px 24px;">${inner}</td>
  </tr></table>`;
}
function quote(t: string, author: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:4px 0 24px;"><tr>
    <td style="border-left:3px solid ${PURPLE};padding:6px 0 6px 16px;">
      <p style="margin:0 0 6px;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:16px;line-height:1.55;color:#1a0a1f;opacity:0.85;">&ldquo;${t}&rdquo;</p>
      <p style="margin:0;font-size:12.5px;color:${PURPLE};font-weight:700;letter-spacing:0.02em;">— ${author}</p>
    </td></tr></table>`;
}
function signature(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 0;border-top:1px solid rgba(106,23,140,0.12);"><tr><td style="padding-top:22px;">
    <p style="margin:0;font-family:'Caveat',cursive;font-size:24px;color:${PURPLE};line-height:1;">Con cariño,</p>
    <p style="margin:6px 0 0;font-size:13px;color:${PURPLE};font-weight:700;">El equipo de Mente Sana</p>
  </td></tr></table>`;
}
function whatsappNote(): string {
  return `<p style="margin: 24px 0 0; font-size: 11.5px; color: #666; line-height: 1.5;">¿Alguna duda? Escríbenos por WhatsApp al <a href="${WHATSAPP_HREF}" style="color: #6A178C; text-decoration: underline;">+34 XXX XXX XXX</a>.</p>`;
}

// ─────────── bloque de features FREE ───────────
const FREE_FEATURES = `
  <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Qué hay dentro (todo gratis)</p>
  <p style="margin:0 0 12px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.65;">🎧 <strong>Meditaciones guiadas</strong> para ansiedad, sueño y autoestima. Estilo Spotify — pones play y ya.</p>
  <p style="margin:0 0 12px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.65;">📚 <strong>Audiolibros de psicología</strong> (Walter Riso, Robin Sharma, Carnegie). Nuevos títulos cada mes.</p>
  <p style="margin:0 0 12px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.65;">🤖 <strong>María, tu asistente 24/7</strong> — chat o voz cuando lo necesites, a cualquier hora. Escucha, valida, ayuda.</p>
  <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.65;">🎥 <strong>Talleres en directo</strong> con psicólogas colegiadas. Grupos pequeños, temas concretos.</p>
`;

export function appNoNecesitasTerapiaEmail({ firstName }: Props): { subject: string; html: string } {
  const subject = firstName
    ? `${firstName}, no necesitas estar en terapia para cuidarte`
    : "No necesitas estar en terapia para cuidarte. La app es para ti.";

  return {
    subject,
    html: emailLayout({
      title: "La app también es para ti",
      preheader: "Meditaciones, audiolibros, chat 24/7 con María y talleres. Todo dentro de la app oficial de Mente Sana.",
      content: `
        ${kicker(`${hi(firstName)},`)}
        ${h1(`No hace falta estar en terapia para <em style="color:${PURPLE};font-style:italic;">cuidar tu mente</em>.`)}
        ${heroImage("/images/app/app-hero-bienestar.png", "Tu bienestar en un solo lugar — terapia, hábitos y acompañamiento diario en una sola app")}
        ${para("A veces solo necesitas un espacio donde parar. Respirar. Escuchar algo que te devuelva el aire. La app de Mente Sana es eso — un rincón para tu bienestar diario, estés o no en proceso con una psicóloga.")}
        ${box(FREE_FEATURES)}
        ${heroImage("/images/app/app-hero-dormir.png", "Duerme mejor cada noche — meditaciones, cuentos y sonidos relajantes que te acompañan hasta soñar")}
        ${para("Sin tener que reservar sesión. Sin tener que decidir nada. La app está ahí para los días buenos y los raros.")}
        ${heroImage("/images/app/app-hero-juegos.png", "Juega y relájate — pausas breves y divertidas para soltar la mente")}
        ${ctaBadges()}
        ${reassure("Android e iOS · Sin coste · Sin suscripción · Cancela cuando quieras")}
        ${quote("Descargué la app pensando que era 'otra más'. Ahora las meditaciones antes de dormir y María a las 2am cuando no puedo pensar bien son parte de mi rutina.", "Elena, 33")}
        ${para("<strong>+8.000 personas</strong> ya la usan · <strong>4,6★</strong> en Google Play · Mente Sana lleva 6 años acompañando.")}
        ${signature()}
        ${whatsappNote()}
      `,
    }),
  };
}
