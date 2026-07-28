// Email masivo B2C · Audiencia YA REGISTRADA en la app móvil pero con actividad
// stale (>30 días sin abrir). Copy: hay novedades dentro de la app —
// abre Play Store / App Store y toca "Actualizar". Un solo CTA.
import { PLAY_STORE_URL, APP_STORE_URL, SMART_DOWNLOAD_HREF } from "@/lib/app-links";
import { emailLayout } from "./layout";

const PURPLE = "#6A178C";
const WHATSAPP_HREF = "https://wa.me/34XXXXXXXXX";
const SITE = "https://mentesanapsicologia.com";
const SMART_HREF = `${SITE}${SMART_DOWNLOAD_HREF}`;

interface Props {
  firstName?: string;
  email: string;
}

const hi = (n?: string) => n || "hola";

function kicker(t: string): string {
  return `<p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:24px;color:${PURPLE};line-height:1;">${t}</p>`;
}
function h1(t: string): string {
  return `<h1 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.18;color:#1a0a1f;font-weight:500;letter-spacing:-0.4px;">${t}</h1>`;
}
function para(t: string): string {
  return `<p style="margin:0 0 18px;font-size:15.5px;line-height:1.75;color:#1a0a1f;opacity:0.85;">${t}</p>`;
}
function heroImage(src: string, alt: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 26px;"><tr><td align="center">
    <img src="${SITE}${src}" alt="${alt}" width="360" style="width:100%;max-width:360px;height:auto;border-radius:18px;border:1px solid rgba(106,23,140,0.15);display:block;" />
  </td></tr></table>`;
}
function ctaBadges(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:6px 0 12px;"><tr><td align="center">
    <a href="${SMART_HREF}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:16px 42px;border-radius:999px;font-weight:700;display:inline-block;font-size:16px;box-shadow:0 8px 30px rgba(106,23,140,0.28);">
      Abrir la app y actualizar →
    </a>
  </td></tr></table>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 22px;"><tr><td align="center">
    <a href="${PLAY_STORE_URL}" style="display:inline-block;margin:0 6px;">
      <img src="${SITE}/images/app/google-play-badge-3x1.png" alt="Actualizar en Google Play" width="150" style="height:44px;width:auto;border:0;" />
    </a>
    <a href="${APP_STORE_URL}" style="display:inline-block;margin:0 6px;">
      <img src="${SITE}/images/app/app-store-badge.png" alt="Actualizar en App Store" width="150" style="height:44px;width:auto;border:0;" />
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
function signature(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 0;border-top:1px solid rgba(106,23,140,0.12);"><tr><td style="padding-top:22px;">
    <p style="margin:0;font-family:'Caveat',cursive;font-size:24px;color:${PURPLE};line-height:1;">Con cariño,</p>
    <p style="margin:6px 0 0;font-size:13px;color:${PURPLE};font-weight:700;">El equipo de Mente Sana</p>
  </td></tr></table>`;
}
function whatsappNote(): string {
  return `<p style="margin: 24px 0 0; font-size: 11.5px; color: #666; line-height: 1.5;">¿Alguna duda? Escríbenos por WhatsApp al <a href="${WHATSAPP_HREF}" style="color: #6A178C; text-decoration: underline;">+34 XXX XXX XXX</a>.</p>`;
}

const WHATS_NEW = `
  <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Novedades desde la última vez que abriste la app</p>
  <p style="margin:0 0 12px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.65;">🎧 <strong>+18 meditaciones nuevas</strong> — insomnio, autoestima, decisiones difíciles, duelo. Grabadas con psicólogas de la red.</p>
  <p style="margin:0 0 12px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.65;">📚 <strong>6 audiolibros añadidos</strong> — &ldquo;Enamórate de ti&rdquo; (Walter Riso), &ldquo;El monje que vendió su Ferrari&rdquo; (Robin Sharma), &ldquo;Cómo ganar amigos&rdquo; (Carnegie) y más.</p>
  <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.65;">⚡ <strong>María 3× más rápida</strong> — nueva versión del asistente IA, respuestas casi al instante y con mejor memoria de tu contexto.</p>
`;

const INSTRUCTIONS = `
  <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Cómo actualizar en 20 segundos</p>
  <p style="margin:0 0 12px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.65;"><strong>Android</strong>: abre Google Play → Mente Sana Psicología → <strong>Actualizar</strong>.</p>
  <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.65;"><strong>iPhone</strong>: abre App Store → Mente Sana → <strong>Actualizar</strong>.</p>
`;

export function appDownloadActualizaEmail({ firstName }: Props): { subject: string; html: string } {
  const subject = firstName
    ? `${firstName}, tienes que actualizar la app`
    : "Actualiza la app de Mente Sana — hay novedades importantes";

  return {
    subject,
    html: emailLayout({
      title: "Actualiza la app de Mente Sana",
      preheader: "Nuevas meditaciones, audiolibros y una María 3× más rápida. Abre Play Store y pulsa Actualizar.",
      content: `
        ${kicker(`${hi(firstName)},`)}
        ${h1(`Hay <em style="color:${PURPLE};font-style:italic;">novedades importantes</em> dentro de la app.`)}
        ${heroImage("/images/app/app-hero-retos.png", "Supera tus retos, un paso a la vez — rutas guiadas para calmar la ansiedad, dormir mejor y conocerte más")}
        ${para("Vimos que hace tiempo que no abres la app. Este mes hemos añadido bastante contenido y arreglado cosas que estaban lentas. Merece un update — te lo prometemos.")}
        ${box(WHATS_NEW)}
        ${heroImage("/images/app/app-hero-dormir.png", "Duerme mejor cada noche — nuevas meditaciones, cuentos y sonidos relajantes")}
        ${box(INSTRUCTIONS)}
        ${ctaBadges()}
        ${reassure("Android e iOS · Gratis · Sin suscripción")}
        ${para("<strong>+8.000 personas</strong> la usan · <strong>4,6★</strong> · más de <strong>200 valoraciones nuevas</strong> este trimestre.")}
        ${signature()}
        ${whatsappNote()}
      `,
    }),
  };
}
