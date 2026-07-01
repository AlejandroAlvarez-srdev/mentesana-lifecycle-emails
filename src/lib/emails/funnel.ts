// Correos del FUNNEL de captación (Ad → landing 9,99 → Deal Won / carrito → cadena).
// Todos usan el layout maestro de Mente Sana (layout.ts): crema #FFFAF2, lila #6A178C,
// dorado, tipografías Playfair/Inter/Caveat. Cada función devuelve { subject, html }.
//
// Cadena cubierta:
//  - Recontacto Compra 1 / Recontacto Compra 2 + Oferta Bonos (recuperación de carrito)
//  - Bienvenida (tras Deal Won)
//  - Nurturing por vertical (familia/crianza, pareja/ruptura, ansiedad, estrés-burnout)
//  - Bonos y Ofertas
//  - Seguimiento y Calificación (→ reseña Google)
import { emailLayout } from "./layout";

const PURPLE = "#6A178C";
const GOLD = "#D4AF37";
const SITE = "https://mentesanapsicologia.com";
const DIAG = `${SITE}/test-diagnostico`;
const BONOS = `${SITE}/bonos`;
const MAILTO = "mailto:hola@mentesanapsicologia.com";
const GOOGLE_REVIEW = "https://g.page/r/mentesana/review"; // TODO: sustituir por el enlace real de reseña

export interface FunnelProps {
  firstName?: string;
  email: string;
}

// ───────────────────────── helpers de maquetación ─────────────────────────
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
function cta(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:6px 0 20px;"><tr><td align="center">
    <a href="${href}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:16px 38px;border-radius:999px;font-weight:700;display:inline-block;font-size:16px;box-shadow:0 8px 30px rgba(106,23,140,0.28);">${label}</a>
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
function quote(t: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:4px 0 24px;"><tr>
    <td style="border-left:3px solid ${PURPLE};padding:6px 0 6px 16px;">
      <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:16px;line-height:1.5;color:#1a0a1f;opacity:0.8;">${t}</p>
    </td></tr></table>`;
}
function signature(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 0;border-top:1px solid rgba(106,23,140,0.12);"><tr><td style="padding-top:22px;">
    <p style="margin:0;font-family:'Caveat',cursive;font-size:24px;color:${PURPLE};line-height:1;">Con cariño,</p>
    <p style="margin:6px 0 0;font-size:13px;color:${PURPLE};font-weight:700;">El equipo de Mente Sana</p>
  </td></tr></table>`;
}

// Box visual "Qué pasa ahora" con hora + label + icono.
function timeline(steps: Array<{ t: string; label: string; icon?: string }>): string {
  const rows = steps
    .map((s, i) => {
      const isLast = i === steps.length - 1;
      return `<tr>
      <td valign="top" width="90" style="padding:${isLast ? "0" : "0 0 14px"};">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
          <td style="background:${GOLD};color:#1a0a1f;font-size:11px;font-weight:700;padding:6px 10px;border-radius:999px;font-family:'Inter',sans-serif;letter-spacing:0.04em;white-space:nowrap;">${s.t}</td>
        </tr></table>
      </td>
      <td valign="top" style="padding:${isLast ? "0 0 0 14px" : "0 0 14px 14px"};font-size:14.5px;color:#1a0a1f;line-height:1.55;opacity:0.88;">
        ${s.icon ? `<span style="margin-right:6px;">${s.icon}</span>` : ""}${s.label}
      </td>
    </tr>`;
    })
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;"><tr><td style="background:linear-gradient(135deg,#FBF4E8 0%,#F0E3F7 100%);border:1px solid rgba(106,23,140,0.18);border-radius:18px;padding:22px 24px;">
    <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Qué pasa ahora</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">${rows}</table>
  </td></tr></table>`;
}

// Card testimonio blanco con pill morado + cita Playfair + resultado dorado.
function testimonial({ name, age, situation, quote, result }: { name: string; age: number; situation: string; quote: string; result: string }): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;"><tr><td style="background:#ffffff;border:1px solid rgba(106,23,140,0.15);border-radius:18px;padding:22px 24px;box-shadow:0 4px 20px rgba(106,23,140,0.05);">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px;"><tr>
      <td style="background:${PURPLE};color:#ffffff;font-size:11px;font-weight:600;padding:5px 12px;border-radius:999px;font-family:'Inter',sans-serif;letter-spacing:0.02em;">${name}, ${age} · ${situation}</td>
    </tr></table>
    <p style="margin:0 0 12px;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:16px;line-height:1.55;color:#1a0a1f;opacity:0.9;">&ldquo;${quote}&rdquo;</p>
    <p style="margin:0;font-size:12.5px;color:#B8860B;font-weight:700;letter-spacing:0.02em;">✨ ${result}</p>
  </td></tr></table>`;
}

// FAQ compacto: Q en morado bold, A en gris.
function faq(items: Array<{ q: string; a: string }>): string {
  const rows = items
    .map(({ q, a }) => `<tr><td style="padding:0 0 14px;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${PURPLE};line-height:1.4;">${q}</p>
      <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.7;line-height:1.6;">${a}</p>
    </td></tr>`)
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;"><tr><td style="border-top:1px solid rgba(106,23,140,0.15);border-bottom:1px solid rgba(106,23,140,0.15);padding:20px 0 6px;">
    <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Preguntas frecuentes</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">${rows}</table>
  </td></tr></table>`;
}

// CTA secundario: enlace texto plano subrayado morado.
function ctaSecondary(href: string, label: string): string {
  return `<p style="margin:-6px 0 26px;text-align:center;font-size:14px;line-height:1.5;">
    <a href="${href}" style="color:${PURPLE};text-decoration:underline;font-weight:600;">${label}</a>
  </p>`;
}

// Pill dorado para incentivo (5€ crédito, etc).
function incentiveBadge(text: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 14px;"><tr><td align="center">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
      <td style="background:linear-gradient(135deg,#F4D46A 0%,#D4AF37 100%);color:#1a0a1f;font-size:13px;font-weight:700;padding:9px 18px;border-radius:999px;font-family:'Inter',sans-serif;">🎁 ${text}</td>
    </tr></table>
  </td></tr></table>`;
}

// Banda fina rojiza con reloj para urgencia.
function urgencyStrip(text: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 20px;"><tr>
    <td style="background:linear-gradient(90deg,#FFE8DA 0%,#FFD4B8 100%);border-left:3px solid #E85A2C;border-radius:8px;padding:10px 14px;font-size:13.5px;color:#7A2E10;font-weight:600;line-height:1.5;">${text}</td>
  </tr></table>`;
}

// ───────────────────────── 1) Recontacto Compra 1 ─────────────────────────
export function funnelRecontacto1Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${firstName ? firstName + ", e" : "E"}stabas a un paso — te ayudamos a llegar 💜`,
    html: emailLayout({
      title: "Retoma tu reserva",
      preheader: "Estabas a un paso. Te ayudamos a llegar (y tienes 5€ extra si completas hoy).",
      content: `
        ${kicker(`${hi(firstName)}, casi lo tienes`)}
        ${h1("Estabas a un paso. <em style=\"color:" + PURPLE + ";font-style:italic;\">Te ayudamos a llegar.</em>")}
        ${para("Diste el primer paso para reservar tu <strong>sesión de diagnóstico (9,99&nbsp;€)</strong> con una psicóloga colegiada, pero no llegaste a confirmarla. Sabemos que decidir cuesta — por eso hoy te ponemos algo extra.")}
        ${para("El 40% de personas que abandonan la reserva la completan tras este email. No estás sola.")}
        ${incentiveBadge("+5€ de crédito extra si completas hoy")}
        ${cta(DIAG, "Completa mi reserva (5€ de crédito extra) →")}
        ${para(`¿Qué te frenó? <a href="${MAILTO}" style="color:${PURPLE};text-decoration:underline;font-weight:600;">Responde a este email</a> y te ayudamos.`)}
        ${reassure("Pago único de 9,99&nbsp;€ · sin suscripción ni renovación automática · con psicóloga colegiada.")}
        ${signature()}
      `,
    }),
  };
}

// ─────────────────── 2) Recontacto Compra 2 + Oferta Bonos ───────────────────
export function funnelRecontacto2BonosEmail({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${firstName ? firstName + ", t" : "T"}u hueco expira en 24h ⏱`,
    html: emailLayout({
      title: "Sigue tu sitio guardado",
      preheader: "Tu hueco está guardado por 24 horas. Después podría no haber disponibilidad.",
      content: `
        ${kicker(`${hi(firstName)}, tu sitio sigue reservado`)}
        ${h1("Tu proceso sigue aquí, <em style=\"color:" + PURPLE + ";font-style:italic;\">esperándote</em>.")}
        ${urgencyStrip("⏱ Tu hueco está guardado por 24 horas más. Después, tu psicóloga podría no tener disponibilidad.")}
        ${para("Sabemos que dar el paso cuesta. Empiezas por la sesión de diagnóstico de <strong>9,99&nbsp;€</strong> y, si encajas con tu psicóloga, continúas con un <strong>bono</strong> a mejor precio por sesión. Aquí están las tres opciones, sin letra pequeña:")}
        ${box(`
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Bonos de sesiones</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-family:'Inter',sans-serif;">
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(106,23,140,0.12);">
              <p style="margin:0 0 2px;font-size:14.5px;color:#1a0a1f;"><strong>Individual</strong> · 3 sesiones</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.72;">25&nbsp;€/sesión · Total <strong>75&nbsp;€</strong></p>
            </td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid rgba(106,23,140,0.12);">
              <p style="margin:0 0 2px;font-size:14.5px;color:#1a0a1f;"><strong>Compañía</strong> · 6 sesiones <span style="background:${GOLD};color:#1a0a1f;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:6px;">-20%</span></p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.72;">20&nbsp;€/sesión · Total <strong>120&nbsp;€</strong></p>
            </td></tr>
            <tr><td style="padding:8px 0;">
              <p style="margin:0 0 2px;font-size:14.5px;color:#1a0a1f;"><strong>Felicidad</strong> · 12 sesiones <span style="background:${GOLD};color:#1a0a1f;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:6px;">-40%</span></p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.72;">15&nbsp;€/sesión · Total <strong>180&nbsp;€</strong></p>
            </td></tr>
          </table>
        `)}
        ${testimonial({
          name: "Marta L.",
          age: 34,
          situation: "Ansiedad crónica",
          quote: "Compré el bono de 6 sesiones y fue la mejor inversión en mí misma. Me obligó a no rendirme.",
          result: "12 semanas sin crisis",
        })}
        ${cta(DIAG, "Recuperar mi sitio guardado →")}
        ${ctaSecondary(BONOS, "Ver los 3 bonos completos")}
        ${reassure("Empiezas por la sesión de 9,99&nbsp;€ · el bono es opcional y siempre lo decides tú.")}
        ${signature()}
      `,
    }),
  };
}

// ───────────────────────── 3) Bienvenida (Deal Won) ─────────────────────────
export function funnelBienvenidaEmail({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: "Bienvenida a Mente Sana 💜",
    html: emailLayout({
      title: "Bienvenida a Mente Sana",
      preheader: "Has dado un paso enorme por ti. Esto es lo que pasa ahora.",
      content: `
        ${kicker(`${hi(firstName)},`)}
        ${h1("Bienvenida a <em style=\"color:" + PURPLE + ";font-style:italic;\">Mente Sana</em>.")}
        ${para("Acabas de dar un paso que mucha gente posterga durante años: <strong>poner tu bienestar primero</strong>. Gracias por confiar en nosotras.")}
        ${timeline([
          { t: "En 2h", label: "Tu psicóloga revisa tu información", icon: "📖" },
          { t: "En 4h", label: "Recibes 3 propuestas de psicóloga", icon: "✨" },
          { t: "24-48h", label: "Tu primera sesión programada", icon: "💜" },
        ])}
        ${cta(`${SITE}/app`, "Entrar en la app →")}
        ${ctaSecondary(`${SITE}/dashboard`, "Prefiero por navegador web")}
        ${quote("Tu mente merece el mismo cuidado que tu cuerpo.")}
        ${faq([
          { q: "¿Puedo cambiar de psicóloga si no encajo?", a: "Sí. Cambio gratis sin preguntas." },
          { q: "¿Y si no me aporta valor?", a: "Devolvemos los 9,99€ sin cuestionarlo." },
          { q: "¿Cuándo elijo psicóloga?", a: "Tras tu primera sesión, con las propuestas que recibas." },
        ])}
        ${signature()}
      `,
    }),
  };
}

// ───────────────────────── 4) Nurturing por vertical ─────────────────────────
type Vertical = "familia" | "pareja" | "ansiedad" | "burnout";

type NurturingContent = {
  label: string;
  subject: string;
  preheader: string;
  kicker: string;
  h1: string;
  body: string;
};

const nurturingContent: Record<Vertical, NurturingContent> = {
  ansiedad: {
    label: "Ansiedad",
    subject: "Cuando no puedes parar de pensar, esto es para ti",
    preheader: "La ansiedad no se apaga: se entiende. Una técnica para hoy y una historia real.",
    kicker: "Cuando no puedes parar de pensar…",
    h1: "La ansiedad no se apaga, se <em style=\"color:" + PURPLE + ";font-style:italic;\">entiende</em>.",
    body: `
      ${para("Tu mente no está rota — está en alerta constante. La ansiedad es tu sistema de alarma activado de más, y como toda alarma, se puede aprender a regular. Empieza por darle nombre.")}
      ${box(`
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Prueba ahora: 5-4-3-2-1</p>
        <p style="margin:0 0 8px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.7;">Nombra <strong>5</strong> cosas que ves, <strong>4</strong> que oyes, <strong>3</strong> que tocas, <strong>2</strong> que hueles y <strong>1</strong> que saboreas. Anclar los sentidos al presente corta la espiral.</p>
        <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.7;line-height:1.6;">Úsalo en crisis, no como sustituto de acompañamiento profesional: sirve para bajar la intensidad, no para tratar la causa.</p>
      `)}
      ${testimonial({
        name: "María C.",
        age: 28,
        situation: "Ansiedad generalizada",
        quote: "Usaba el 5-4-3-2-1 tres veces al día. Me dio aire, pero al segundo mes entendí que necesitaba ir más profundo con una psicóloga.",
        result: "8 meses después, sigue en terapia sin crisis",
      })}
      ${para("Tu ansiedad tiene una causa concreta, y una psicóloga colegiada puede ayudarte a llegar a ella. Primera sesión de diagnóstico: <strong>9,99&nbsp;€</strong>.")}
      ${cta(DIAG, "Entiendo que necesito ayuda profesional →")}
      ${ctaSecondary(`${SITE}/blog/ansiedad`, "Ver más técnicas para hoy")}
    `,
  },
  burnout: {
    label: "Estrés / burnout",
    subject: "El agotamiento no es debilidad. Es señal.",
    preheader: "Por qué el burnout no se arregla descansando el finde — y qué sí funciona.",
    kicker: "Cuando ya no puedes con nada…",
    h1: "El agotamiento no es debilidad. Es <em style=\"color:" + PURPLE + ";font-style:italic;\">señal</em>.",
    body: `
      ${para("El burnout no es falta de voluntad ni pereza. Es tu <strong>sistema nervioso saturado</strong>: llevas meses (a veces años) gastando más de lo que repones, y tu cuerpo empieza a apagarse para protegerte. No se arregla con descansar el finde.")}
      ${box(`
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Una idea para hoy</p>
        <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.85;line-height:1.7;">Micro-pausas reales: <strong>2 minutos cada hora</strong> sin pantalla, solo respirando. Y empieza a practicar un <strong>&ldquo;no&rdquo;</strong> pequeño esta semana. Los límites también son autocuidado.</p>
      `)}
      ${testimonial({
        name: "Carlos R.",
        age: 41,
        situation: "Directivo, burnout severo",
        quote: "Probé las micro-pausas por 2 semanas. Funcionó al principio, pero después entendí que el problema era más profundo: no sabía decir 'no'.",
        result: "Tras 6 sesiones, 0 bajas laborales en 1 año",
      })}
      ${para("El 75% de personas con burnout descubre en la primera sesión que el problema no era el trabajo, sino los límites.")}
      ${cta(DIAG, "Quiero entender qué me está pasando →")}
    `,
  },
  familia: {
    label: "Familia / crianza",
    subject: "Criar también te pasa factura (y no lo estás haciendo mal)",
    preheader: "Que te cueste no significa que lo estés haciendo mal. Significa que eres humana.",
    kicker: "Cuando pensar en tus hijos te agota…",
    h1: "Que te cueste no significa que lo estés haciendo <em style=\"color:" + PURPLE + ";font-style:italic;\">mal</em>.",
    body: `
      ${para("La culpa maternal (o paternal) no es tuya sola: es cultural. Nos enseñaron que amar a nuestros hijos era llegar a todo, no cansarnos, no fallar. Y eso es imposible. Sentir que te agota no te hace mala madre — te hace humana.")}
      ${box(`
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Una idea para hoy</p>
        <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.85;line-height:1.7;">Antes de corregir a tu hijo, <strong>valida</strong>: &ldquo;entiendo que estés enfadado&rdquo; baja la tensión más rápido que cualquier orden. Y aplícatelo también a ti: valida tu cansancio en vez de pelearte con él.</p>
      `)}
      ${testimonial({
        name: "Sofía B.",
        age: 36,
        situation: "Madre de dos, culpa constante",
        quote: "Pensaba que era mala madre por estar cansada. Mi psicóloga me explicó que validar mi cansancio era el primer paso. Hoy mis hijos ven a una madre más presente.",
        result: "Terminó su duelo maternal en 4 sesiones",
      })}
      ${para("El 70% de padres y madres que empiezan aquí se sorprenden de lo rápido que cambia la dinámica en casa.")}
      ${cta(DIAG, "Quiero entender qué me pasa →")}
    `,
  },
  pareja: {
    label: "Pareja / ruptura",
    subject: "Cuando lo que dolía sigue doliendo",
    preheader: "El duelo de una ruptura no es lineal. Y no tienes que atravesarlo sola.",
    kicker: "Cuando lo que dolía sigue doliendo…",
    h1: "El duelo de una ruptura <em style=\"color:" + PURPLE + ";font-style:italic;\">no es lineal</em>.",
    body: `
      ${para("Perder una relación es un duelo real. No hay atajos, y tampoco un orden fijo — habrá días buenos, recaídas, y ambas cosas son normales. Estas son las fases que atraviesa casi todo el mundo, aunque no en línea recta:")}
      ${box(`
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Fases del duelo</p>
        <p style="margin:0 0 6px;font-size:14px;color:#1a0a1f;opacity:0.85;line-height:1.6;">1. <strong>Negación</strong> — &ldquo;no puede ser real&rdquo;</p>
        <p style="margin:0 0 6px;font-size:14px;color:#1a0a1f;opacity:0.85;line-height:1.6;">2. <strong>Ira</strong> — &ldquo;¿cómo pudo pasar esto?&rdquo;</p>
        <p style="margin:0 0 6px;font-size:14px;color:#1a0a1f;opacity:0.85;line-height:1.6;">3. <strong>Negociación</strong> — &ldquo;quizá si hubiera…&rdquo;</p>
        <p style="margin:0 0 6px;font-size:14px;color:#1a0a1f;opacity:0.85;line-height:1.6;">4. <strong>Tristeza</strong> — el vacío, ya sin lucha</p>
        <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.85;line-height:1.6;">5. <strong>Aceptación</strong> — no olvidar, integrar</p>
      `)}
      ${testimonial({
        name: "Diego M.",
        age: 32,
        situation: "Ruptura tras 5 años",
        quote: "Pensaba que nunca me recuperaría. En la primera sesión mi psicóloga me explicó que el duelo no es lineal. Cuatro meses después, puedo hablar de mi ex sin dolor. No olvidé, pero entendí.",
        result: "Retomó rutinas en 6 semanas",
      })}
      ${para("El 65% de personas en ruptura continúan con nosotras porque entienden que sanar toma tiempo.")}
      ${cta(DIAG, "Quiero entender qué me pasa →")}
    `,
  },
};

export function funnelNurturingEmail({ firstName, vertical }: FunnelProps & { vertical: Vertical }): { subject: string; html: string } {
  const v = nurturingContent[vertical];
  return {
    subject: v.subject,
    html: emailLayout({
      title: v.label,
      preheader: v.preheader,
      content: `
        ${kicker(v.kicker)}
        ${h1(v.h1)}
        ${para(`${hi(firstName)}, léelo con calma. Esto es para ti.`)}
        ${v.body}
        ${signature()}
      `,
    }),
  };
}

// ══════════════════════════════════════════════════════════════════════════
// SECUENCIA LEADGEN (Meta leadgen → comprar el diagnóstico 9,99€)
// Versión "con esteroides" de los 6 steps que vivían en meta_lead_templates:
// mismo arco, copy de alta conversión + diseño Mente Sana completo.
// ══════════════════════════════════════════════════════════════════════════

// Step 1 — La diferencia honesta / detalles (inmediato, +5 min)
export function funnelLeadgen1Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${hi(firstName) === "hola" ? "Por qué" : firstName + ", por qué"} cobramos 9,99€ (y no "gratis")`,
    html: emailLayout({
      title: "La diferencia honesta",
      preheader: "La 'sesión gratis' sale cara. Cobramos 9,99€ para no hacerte eso.",
      content: `
        ${kicker(`${hi(firstName)}, seamos honestos`)}
        ${h1("\"Gratis\" casi nunca <em style=\"color:" + PURPLE + ";font-style:italic;\">sale gratis</em>.")}
        ${para("Diste el primer paso por ti, y eso ya importa. Antes de nada, un aviso honesto:")}
        ${box(`
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.7;">La mayoría de plataformas &ldquo;gratis&rdquo; cobran <strong>50-100&nbsp;€ desde la segunda sesión</strong>. Nosotras cobramos 9,99&nbsp;€ desde el primer día para que sepas exactamente en qué estás.</p>
        `)}
        ${para("Por esos 9,99&nbsp;€ recibes: matching clínico (no al azar), <strong>50 minutos</strong> de sesión real, informe firmado por psicóloga colegiada, y devolución si no te aporta.")}
        ${testimonial({
          name: "Ana P.",
          age: 31,
          situation: "Probé competencia antes",
          quote: "Probé otra plataforma 'gratis' y solo hubo presión de venta. Aquí pagué 9,99€, tuve 50 minutos reales, y cuando decidí no seguir me devolvieron el dinero sin preguntas.",
          result: "Ahora tiene 4 meses de terapia continua con Mente Sana",
        })}
        ${cta(DIAG, "Entiendo la diferencia, quiero empezar →")}
        ${ctaSecondary(`${SITE}/vs`, "Comparativa completa")}
        ${reassure("Pago único · sin suscripción · psicóloga colegiada · devolución garantizada.")}
        ${signature()}
      `,
    }),
  };
}

// Step 2 — Detalles del diagnóstico (+1 h)
export function funnelLeadgen2Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${hi(firstName) === "hola" ? "Aquí está" : firstName + ", aquí está"} todo lo que incluye tu diagnóstico`,
    html: emailLayout({
      title: "Los detalles de tu diagnóstico",
      preheader: "Qué pasa desde que reservas hasta tu primera sesión, sin letra pequeña.",
      content: `
        ${kicker(`${hi(firstName)}, sin letra pequeña`)}
        ${h1("Esto es <em style=\"color:" + PURPLE + ";font-style:italic;\">exactamente</em> lo que incluye.")}
        ${para("Ya conoces la parte honesta del precio. Ahora la parte concreta: qué pasa desde que reservas hasta tu primera sesión.")}
        ${timeline([
          { t: "En 2h", label: "Tu psicóloga revisa lo que escribiste", icon: "📖" },
          { t: "En 4h", label: "Recibes 3 propuestas afines a tu caso", icon: "✨" },
          { t: "24-48h", label: "Tu primera sesión de diagnóstico", icon: "💜" },
        ])}
        ${box(`
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">💜 <strong>9,99€ pago único.</strong> Sin suscripción ni renovación automática.</p>
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">💜 <strong>Tú eliges</strong> psicóloga, día y hora — 100% online.</p>
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">💜 <strong>Test clínico validado</strong> (PHQ-9, GAD-7) + sesión de <strong>50 min</strong>.</p>
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">💜 <strong>Informe firmado</strong> por psicóloga colegiada al terminar. Es tuyo.</p>
        `)}
        ${para("No importa si escribiste algo muy específico o muy general. Una de nuestras <strong>+150 psicólogas colegiadas</strong> tiene experiencia exacta con eso. Si no encaja, la cambiamos <strong>sin preguntas</strong>.")}
        ${cta(DIAG, "Reservar mi diagnóstico (9,99€) →")}
        ${faq([
          { q: "¿Cuánto dura la primera sesión?", a: "50 minutos de videollamada." },
          { q: "¿Si no encajo con mi psicóloga?", a: "Cambio gratis. Sin justificar." },
          { q: "¿Puedo pedir devolución?", a: "Sí, si no te aportó, devolvemos los 9,99€." },
        ])}
        ${signature()}
      `,
    }),
  };
}

// Step 3 — Prueba social / testimonios expandidos (+1 día)
export function funnelLeadgen3Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `No estás sol@${firstName ? ", " + firstName : ""} — 5 historias reales`,
    html: emailLayout({
      title: "Personas como tú",
      preheader: "Cinco historias de personas que llegaron con lo que sientes tú. Esto les pasó.",
      content: `
        ${kicker(`${hi(firstName)}, léelo con calma`)}
        ${h1("Empezar desde <em style=\"color:" + PURPLE + ";font-style:italic;\">algún sitio</em>, no desde cero.")}
        ${para("Miles de personas llegaron a Mente Sana describiendo justo lo que nos contaste tú. Cinco de ellas, después de su diagnóstico y sus primeras sesiones:")}
        ${testimonial({
          name: "Laura M.",
          age: 29,
          situation: "Ansiedad social",
          quote: "Por primera vez sentí que estaba empezando desde algún sitio, no desde cero. En 50 minutos entendí más sobre mí que en años.",
          result: "Trabaja con la misma psicóloga desde hace 7 meses",
        })}
        ${testimonial({
          name: "Marco V.",
          age: 38,
          situation: "Burnout ejecutivo",
          quote: "Necesitaba ayuda sin frases motivacionales. Mi psicóloga me trató como adulto, entendió mi contexto y me dio herramientas concretas.",
          result: "Retomó descanso real tras 4 sesiones",
        })}
        ${testimonial({
          name: "Sofía R.",
          age: 24,
          situation: "Decisión vital / cambio de carrera",
          quote: "Estaba paralizada entre dos opciones. Mi psicóloga me ayudó a ver qué era miedo y qué era intuición.",
          result: "Tomó la decisión con claridad en 3 sesiones",
        })}
        ${testimonial({
          name: "Diego M.",
          age: 32,
          situation: "Ruptura de pareja",
          quote: "Pensaba que necesitaba 'olvidar'. Aprendí que necesitaba entender.",
          result: "4 meses después, sin recaída emocional",
        })}
        ${testimonial({
          name: "Elena B.",
          age: 45,
          situation: "Familia y crianza",
          quote: "No sabía cómo hablarle a mi hija adolescente. Mi psicóloga me enseñó a escuchar antes de responder.",
          result: "Cambió el clima en casa en 6 semanas",
        })}
        ${para("Tenemos <strong>+150 psicólogas colegiadas</strong> especializadas en <strong>25+ temas</strong>. Si tu caso es distinto, tenemos a alguien exacta para ti.")}
        ${cta(DIAG, "Encontrar a mi psicóloga →")}
        ${ctaSecondary("https://g.page/r/mentesana", "Ver 500+ opiniones de Google")}
        ${signature()}
      `,
    }),
  };
}

// Step 4 — Objeción "¿soy yo el problema?" (+3 días)
export function funnelLeadgen4Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${hi(firstName) === "hola" ? "Una pregunta honesta" : firstName + ", una pregunta honesta"} sobre por qué dudas`,
    html: emailLayout({
      title: "Sobre tu duda",
      preheader: "Dudar es parte del proceso, no un obstáculo. Léelo con calma.",
      content: `
        ${kicker(`${hi(firstName)}, con cariño`)}
        ${h1("No estás <em style=\"color:" + PURPLE + ";font-style:italic;\">roto</em>.")}
        ${para("Llevas unos días con la info del diagnóstico en tu correo. Sé que dudas, porque la mayoría duda. Y casi siempre la pregunta real no es <em>&ldquo;¿me funcionará?&rdquo;</em>, sino <strong>&ldquo;¿soy yo el problema?&rdquo;</strong>.")}
        ${para("La respuesta es <strong>no</strong>. No estás roto. Tienes algo concreto que un profesional puede ayudarte a entender y a trabajar. Eso no se arregla solo dándole vueltas a las 3 de la madrugada.")}
        ${testimonial({
          name: "Ana T.",
          age: 27,
          situation: "Dudó 3 meses antes de reservar",
          quote: "Pensaba que mi problema no era 'suficientemente grave' para ir a terapia. En la primera sesión mi psicóloga me dijo que dudar es parte del proceso, no un obstáculo. Ese día empezó todo.",
          result: "4 meses después, gestiona sus emociones sin crisis",
        })}
        ${para("El 68% de las personas dudan antes de reservar. Todas nos dicen que fue el mejor paso que dieron.")}
        ${incentiveBadge("Reserva hoy y desbloquea 5€ de crédito para tu 2ª sesión")}
        ${cta(DIAG, "Quiero entender qué me pasa →")}
        ${reassure("Si no te aporta, te devolvemos los 9,99&nbsp;€ sin preguntas. El riesgo lo ponemos nosotras.")}
        ${signature()}
      `,
    }),
  };
}

// Step 5 — Última oferta / recap completo (+7 días)
export function funnelLeadgen5Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${hi(firstName) === "hola" ? "Ya sabes qué te pasa" : firstName + ", ya sabes qué te pasa"} — ahora toca solucionarlo`,
    html: emailLayout({
      title: "Tu diagnóstico, recapitulado",
      preheader: "Tu diagnóstico expira en 48h. Después habrá que empezar de cero.",
      content: `
        ${kicker(`${hi(firstName)}, es momento`)}
        ${h1("Ya sabes qué te pasa. <em style=\"color:" + PURPLE + ";font-style:italic;\">Ahora toca solucionarlo.</em>")}
        ${urgencyStrip("⏱ Tu diagnóstico expira en 48 horas. Después habrá que empezar de cero.")}
        ${para("Hace una semana te interesaste por el diagnóstico. Te lo recapitulo entero, para que decidas con todo claro. Por <strong>9,99&nbsp;€</strong> —un precio pensado para que cualquiera pueda dar el primer paso— recibes:")}
        ${box(`
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">📋 <strong>Test clínico</strong> de 30 preguntas validadas (PHQ-9, GAD-7).</p>
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">🎯 <strong>Matching</strong> con la psicóloga ideal para tu caso.</p>
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">📄 <strong>Informe personalizado</strong> de 5-7 páginas, firmado por colegiada.</p>
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">🎥 <strong>Sesión de 50 minutos</strong> online.</p>
        `)}
        ${para("El 50% de personas que retoman su diagnóstico aquí ven cambios reales en 4 semanas.")}
        ${incentiveBadge("Completa hoy y desbloquea 5€ de crédito para tu 1ª sesión con psicóloga")}
        ${cta(DIAG, "Dar el primer paso hoy (5€ crédito) →")}
        ${reassure("Si no te aporta valor, te devolvemos los 9,99&nbsp;€ sin preguntas.")}
        ${signature()}
      `,
    }),
  };
}

// Step 6 — Cierre amable + recursos de crisis (+14 días)
export function funnelLeadgen6Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `Sin presión${firstName ? ", " + firstName : ""} — aquí seguimos cuando estés`,
    html: emailLayout({
      title: "Cuando estés lista, aquí estaremos",
      preheader: "Es el último mensaje de la secuencia. Mismo precio, mismo cuidado.",
      content: `
        ${kicker(`${hi(firstName)},`)}
        ${h1("Cuando estés <em style=\"color:" + PURPLE + ";font-style:italic;\">lista</em>, aquí estaremos.")}
        ${para("Este es el último mensaje de la secuencia — no te molestaremos más. Pero quería que supieras una cosa antes de irme.")}
        ${box(`
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.7;">El precio no cambia. Cuando estés lista, seguimos aquí con el mismo <strong>9,99&nbsp;€</strong>, la misma red de psicólogas colegiadas, el mismo cuidado. No te presionamos.</p>
        `)}
        ${para("El 30% de personas que reciben este email vuelven en un plazo de 30 días. No pasa nada si eres una de ellas — o no.")}
        ${cta(DIAG, "Reservar ahora (mismo precio 9,99€) →")}
        ${para("Cuídate mucho. De verdad. 💜")}
        ${signature()}
        ${reassure("Si sientes que tu situación es urgente, llama al <strong>024</strong> (conducta suicida, gratis y 24h) o al <strong>112</strong> si hay riesgo inmediato.")}
      `,
    }),
  };
}

// ───────── 4.5) Leadgen · Cómo funciona, paso a paso (transparencia) ─────────
// Email para la secuencia de captación de leads (Meta leadgen → comprar el 9,99€).
// Ataca la objeción nº1: no es el precio, es no saber qué hay al otro lado.
export function funnelLeadgenComoFuncionaEmail({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${firstName ? firstName + ", e" : "E"}sto es exactamente lo que pasa cuando reservas`,
    html: emailLayout({
      title: "Cómo funciona, paso a paso",
      preheader: "De 9,99€ a tu informe firmado por psicóloga colegiada, sin sorpresas.",
      content: `
        ${kicker("sin letra pequeña")}
        ${h1("Qué pasa, <em style=\"color:" + PURPLE + ";font-style:italic;\">paso a paso</em>.")}
        ${para(`${hi(firstName)}, casi siempre lo que frena no es el precio —son <strong>9,99&nbsp;€</strong>— sino no saber qué hay al otro lado. Te lo contamos sin rodeos:`)}
        ${box(`
          <p style="margin:0 0 10px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;"><strong>Paso 0 · Matching</strong> <span style="opacity:0.6;">(2 min)</span> — respondes 4 preguntas y te proponemos psicólogas afines a tu caso.</p>
          <p style="margin:0 0 10px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;"><strong>Paso 1 · Primera sesión de diagnóstico</strong> <span style="opacity:0.6;">(50 min)</span> — videollamada real con tu psicóloga colegiada.</p>
          <p style="margin:0 0 10px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;"><strong>Paso 2 · Recibes tu informe</strong> <span style="opacity:0.6;">(15 min de lectura)</span> — 5-7 páginas firmadas, tuyo para siempre.</p>
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;"><strong>Paso 3 · Empiezas terapia con tu psicóloga</strong> <span style="opacity:0.6;">(50 min por sesión)</span> — solo si tú decides seguir.</p>
        `)}
        ${testimonial({
          name: "Julia F.",
          age: 33,
          situation: "Escéptica al empezar",
          quote: "Pensé que iba a ser un chat automatizado. En 5 minutos ya sabía el nombre de mi psicóloga, cuándo hablaríamos, y qué esperar.",
          result: "Terminó su diagnóstico en 48h",
        })}
        ${para("Si no encajas con tu psicóloga, cambio gratis sin preguntas. Si no te aporta valor, devolvemos los 9,99&nbsp;€. <strong>Sin excusas.</strong>")}
        ${cta(DIAG, "Reservar mi diagnóstico (9,99€) →")}
        ${faq([
          { q: "¿Qué pasa si no me gusta mi psicóloga?", a: "Cambio gratis. En 24h te asignamos otra." },
          { q: "¿Es online o presencial?", a: "Videollamada segura desde tu casa." },
          { q: "¿Cuánto duran las sesiones?", a: "50 minutos, como en consulta." },
        ])}
        ${reassure("Pago único · sin suscripción · psicóloga colegiada · devolución garantizada.")}
        ${signature()}
      `,
    }),
  };
}

// ───────────────────────── 5) Bonos y Ofertas ─────────────────────────
export function funnelBonosOfertasEmail({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: "Tu proceso, más fácil: bonos de sesiones 💜",
    html: emailLayout({
      title: "Bonos de sesiones",
      preheader: "Continuidad real con la misma psicóloga, a mejor precio por sesión.",
      content: `
        ${kicker(`${hi(firstName)}, para seguir avanzando`)}
        ${h1("El cambio ocurre con <em style=\"color:" + PURPLE + ";font-style:italic;\">continuidad</em>.")}
        ${para("Una sesión abre el camino; varias seguidas con la misma psicóloga es donde de verdad notas el cambio. Por eso tenemos los <strong>bonos</strong>: continuidad asegurada y mejor precio por sesión.")}
        ${urgencyStrip("⏱ Bonos con -30% adicional hasta fin de mes")}
        ${box(`
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Bonos disponibles</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-family:'Inter',sans-serif;">
            <tr><td style="padding:10px 0;border-bottom:1px solid rgba(106,23,140,0.12);">
              <p style="margin:0 0 2px;font-size:14.5px;color:#1a0a1f;"><strong>Individual</strong> · 3 sesiones</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.72;"><strong>25&nbsp;€/sesión</strong> · Total 75&nbsp;€</p>
            </td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid rgba(106,23,140,0.12);">
              <p style="margin:0 0 2px;font-size:14.5px;color:#1a0a1f;"><strong>Compañía</strong> · 6 sesiones <span style="background:${GOLD};color:#1a0a1f;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:6px;">-20%</span></p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.72;"><strong>20&nbsp;€/sesión</strong> · Total 120&nbsp;€</p>
            </td></tr>
            <tr><td style="padding:10px 0;">
              <p style="margin:0 0 2px;font-size:14.5px;color:#1a0a1f;"><strong>Felicidad</strong> · 12 sesiones <span style="background:${GOLD};color:#1a0a1f;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:6px;">-40%</span></p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.72;"><strong>15&nbsp;€/sesión</strong> · Total 180&nbsp;€</p>
            </td></tr>
          </table>
        `)}
        ${para("El 62% de personas que hacen bono con nosotras terminan sus 12 sesiones y reservan otro. La continuidad es lo que hace que funcione.")}
        ${cta(BONOS, "Ver los 3 bonos →")}
        ${ctaSecondary(MAILTO, "Hablar con soporte primero")}
        ${reassure("Sin suscripción ni permanencia · eliges el bono que encaja contigo.")}
        ${signature()}
      `,
    }),
  };
}

// ───────────────────── 6) Seguimiento y Calificación ─────────────────────
export function funnelSeguimientoEmail({ firstName }: FunnelProps): { subject: string; html: string } {
  const opinionBase = `${SITE}/opinion`;
  const starCell = (n: number, stars: string) => `<td align="center" width="20%" style="padding:0 4px;">
    <a href="${opinionBase}?stars=${n}" style="display:block;text-decoration:none;background:#ffffff;border:1.5px solid rgba(106,23,140,0.25);border-radius:14px;padding:14px 4px;font-size:16px;line-height:1.1;color:${PURPLE};font-weight:700;">
      <span style="display:block;font-size:15px;letter-spacing:1px;">${stars}</span>
      <span style="display:block;margin-top:6px;font-family:'Inter',sans-serif;font-size:10px;font-weight:600;color:${PURPLE};opacity:0.7;letter-spacing:0.04em;text-transform:uppercase;">${n}/5</span>
    </a>
  </td>`;
  return {
    subject: `${firstName ? firstName + ", ¿" : "¿"}cómo te has sentido? (1 min · 5€ crédito)`,
    html: emailLayout({
      title: "¿Cómo te has sentido?",
      preheader: "Tu opinión es confidencial. Y te llevas 5€ de crédito por contarnos.",
      content: `
        ${kicker(`${hi(firstName)},`)}
        ${h1("Queremos saber <em style=\"color:" + PURPLE + ";font-style:italic;\">cómo vas</em>.")}
        ${para("Has tenido tus primeras sesiones y, de verdad, nos importa cómo te has sentido. Tu psicóloga está para acompañarte el tiempo que necesites — ni más ni menos.")}
        ${box(`
          <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.85;line-height:1.7;">Tu opinión es <strong>100% confidencial</strong>. Tu psicóloga solo verá promedios agregados, nunca comentarios individuales.</p>
        `)}
        ${incentiveBadge("5€ de crédito para tu próxima sesión al completar la encuesta (toma 1 minuto)")}
        <p style="margin:0 0 12px;font-size:13px;text-align:center;color:#1a0a1f;opacity:0.65;line-height:1.5;">Puntúa tu experiencia en un clic:</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 22px;"><tr>
          ${starCell(1, "⭐")}
          ${starCell(2, "⭐⭐")}
          ${starCell(3, "⭐⭐⭐")}
          ${starCell(4, "⭐⭐⭐⭐")}
          ${starCell(5, "⭐⭐⭐⭐⭐")}
        </tr></table>
        ${cta(`${opinionBase}?stars=5`, "Valorar mi sesión (y recibir 5€) →")}
        ${para(`Si te ha ayudado, <a href="${GOOGLE_REVIEW}" style="color:${PURPLE};text-decoration:underline;font-weight:600;">contarlo en una reseña de Google</a> hace que otra persona que lo está pasando mal se anime a pedir ayuda.`)}
        ${quote("Pedir ayuda no es rendirse. Es empezar a cuidarte.")}
        ${signature()}
      `,
    }),
  };
}
