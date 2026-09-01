import { emailLayout } from "./layout";

/**
 * LADRILLOS de correo (post-sesión) para los flujos de upsell por tipo de bono.
 * Tono MELOSO, cálido y sin presión. Los usa `upsell-flows.ts`, que decide qué
 * correo sale en cada momento según el paquete (individual / Compañía / Felicidad
 * / Amor). Timing y reglas salen de "Las 12 líneas de upsell".
 */

const LINKS = {
  justificante: "https://buy.stripe.com/REDACTED", // 8,99
  resumen: "https://buy.stripe.com/REDACTED", // 13,99
  informe: "https://buy.stripe.com/REDACTED", // 39,99
  sesionAdicional: "https://buy.stripe.com/REDACTED", // 19,99
  test: "https://buy.stripe.com/REDACTED", // 49,99
  pareja: "https://buy.stripe.com/REDACTED", // 44,99
  segundaOpinion: "https://buy.stripe.com/REDACTED", // 28,97
  cartilla: "https://buy.stripe.com/REDACTED", // 39,99
  prorroga: "https://buy.stripe.com/REDACTED", // 20/mes
  bonos: "https://www.mentesanapsicologia.com/bonos", // renovación
};

export interface Props {
  name?: string;
  psychologistName?: string | null;
  personas?: 1 | 2; // 2 = Bono Amor (pareja): justificante/resumen/test por persona
}

type Email = { subject: string; html: string };

function firstName(name?: string): string {
  return name ? name.split(" ")[0] : "";
}

function boton(url: string, label: string): string {
  return `
    <div style="text-align:center;margin:14px 0 2px;">
      <a href="${url}" class="btn-purple" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:12px 30px;border-radius:999px;font-weight:700;display:inline-block;font-size:14px;">${label}</a>
    </div>`;
}

function productoCard(p: {
  emoji: string;
  nombre: string;
  desc: string;
  precio: string;
  nota?: string;
  url: string;
  cta: string;
}): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFFAF2;border:1px solid #e9d5f5;border-radius:18px;margin:0 0 16px;">
      <tr>
        <td style="padding:20px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="width:56px;vertical-align:top;">
                <div style="width:46px;height:46px;background:#f3e8ff;border-radius:13px;text-align:center;line-height:46px;font-size:22px;">${p.emoji}</div>
              </td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 3px;font-size:16px;font-weight:700;color:#1a0a1f;">${p.nombre}</p>
                <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.7;line-height:1.6;">${p.desc}</p>
              </td>
              <td style="vertical-align:top;text-align:right;white-space:nowrap;padding-left:8px;">
                <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:21px;color:#6A178C;">${p.precio}</p>
                ${p.nota ? `<p style="margin:3px 0 0;font-size:11px;color:#1a0a1f;opacity:0.5;">${p.nota}</p>` : ""}
              </td>
            </tr>
          </table>
          ${boton(p.url, p.cta)}
        </td>
      </tr>
    </table>`;
}

function cabecera(emoji: string, kicker: string, titular: string, intro: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 22px;">
      <tr><td align="center">
        <div style="width:70px;height:70px;background:linear-gradient(135deg,#6A178C,#8B2FB5);border-radius:50%;display:inline-block;line-height:70px;text-align:center;font-size:30px;">${emoji}</div>
      </td></tr>
    </table>
    <p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:25px;color:#6A178C;text-align:center;">${kicker}</p>
    <h1 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:26px;line-height:1.35;color:#1a0a1f;text-align:center;font-weight:400;">${titular}</h1>
    <p style="margin:0 0 26px;font-size:16px;line-height:1.75;color:#1a0a1f;opacity:0.78;text-align:center;">${intro}</p>`;
}

function despedida(psico: string): string {
  return `
    <p style="margin:30px 0 0;font-size:14px;line-height:1.7;color:#1a0a1f;opacity:0.7;text-align:center;">
      Y si hoy no te hace falta, no pasa absolutamente nada 💜<br>
      Cuídate mucho. Aquí seguimos, a tu ritmo.
    </p>
    <p style="margin:14px 0 0;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;">Con cariño, ${psico} y el equipo de Mente Sana</p>`;
}

// ── Tarjetas reutilizables (con variante ×2 para pareja) ─────────────────────
function cardJustificante(x2 = false): string {
  return productoCard({
    emoji: "📄",
    nombre: "Justificante de asistencia",
    desc: `Documento oficial sellado, con fecha y hora${x2 ? ", uno para cada uno" : ""}.`,
    precio: "8,99 €",
    nota: x2 ? "×2 · en 24 h" : "En menos de 24 h",
    url: LINKS.justificante,
    cta: "Añadir justificante",
  });
}
function cardResumen(psico: string, x2 = false): string {
  return productoCard({
    emoji: "📝",
    nombre: "Resumen de tu sesión",
    desc: `${psico} te escribe lo que habéis trabajado, lo que te llevas y tu tarea${x2 ? " · uno por persona" : ""}.`,
    precio: "13,99 €",
    nota: x2 ? "×2 · en tu email hoy" : "En tu email hoy",
    url: LINKS.resumen,
    cta: "Quiero mi resumen",
  });
}
function cardInforme(x2 = false): string {
  return productoCard({
    emoji: "📋",
    nombre: x2 ? "Informe clínico de pareja" : "Informe clínico sellado",
    desc: "Firmado por colegiada, recoge lo que habéis trabajado. Válido para baja, mutua, un trámite o la universidad. Teniéndolo hecho, lo tienes el día que haga falta.",
    precio: "39,99 €",
    nota: "Listo en 72 h",
    url: LINKS.informe,
    cta: "Quiero mi informe",
  });
}

// ── 1 · 2 h tras el Diagnóstico — SOLO justificante ──────────────────────────
export function emailPostDiagnostico({ name = "", psychologistName = "" }: Props): Email {
  const nombre = firstName(name);
  const psico = psychologistName || "tu psicóloga";
  return {
    subject: `${nombre ? `${nombre}, ` : ""}¿necesitas justificar tu sesión de hoy? 💜`,
    html: emailLayout({
      title: "Tu justificante de asistencia",
      preheader: "Documento oficial sellado, en tu email en menos de 24 h.",
      content: `
        ${cabecera("🌱", "Qué bonito haber empezado", `${nombre ? `${nombre}, ` : ""}ha sido un gusto conocerte hoy`, "Ojalá te hayas ido con un poquito más de calma. Enhorabuena por dar el paso, de verdad. Solo una cosita por si te viene bien 👇")}
        ${cardJustificante(false)}
        ${despedida(psico)}
      `,
    }),
  };
}

// ── 2 · 2 h tras la sesión 1 — justificante + resumen ────────────────────────
export function emailPostSesion1({ name = "", psychologistName = "", personas = 1 }: Props): Email {
  const nombre = firstName(name);
  const psico = psychologistName || "tu psicóloga";
  const x2 = personas === 2;
  return {
    subject: `${nombre ? `${nombre}, ` : ""}lo que hablasteis hoy, para que no se te escape 💜`,
    html: emailLayout({
      title: "Tu resumen de sesión",
      preheader: "Lo trabajado, lo que te llevas y tu tarea, por escrito.",
      content: `
        ${cabecera("💌", "Un gustazo acompañaros", `${nombre ? `${nombre}, ` : ""}en una sesión se mueven muchas cosas`, "Y es de lo más normal que algunas se pierdan por el camino. Por si queréis tenerlo todo cerquita para esta semana:")}
        ${cardResumen(psico, x2)}
        ${cardJustificante(x2)}
        ${despedida(psico)}
      `,
    }),
  };
}

// ── 3 · 2 h tras la sesión 2+ — justificante + resumen + informe ─────────────
export function emailPostSesionMedia({ name = "", psychologistName = "", personas = 1 }: Props): Email {
  const nombre = firstName(name);
  const psico = psychologistName || "tu psicóloga";
  const x2 = personas === 2;
  return {
    subject: `${nombre ? `${nombre}, ` : ""}ya tenéis recorrido: tu resumen (y algo más) 💜`,
    html: emailLayout({
      title: "Tu resumen y tu informe",
      preheader: "Con varias sesiones ya hay material para dejarlo por escrito.",
      content: `
        ${cabecera("🌷", "Vais avanzando bonito", `${nombre ? `${nombre}, ` : ""}ya lleváis unas cuantas sesiones`, "Y eso se nota. Te dejo lo de siempre para esta semana y, ahora que ya hay recorrido, una cosita más por si algún día la necesitas:")}
        ${cardResumen(psico, x2)}
        ${cardJustificante(x2)}
        ${cardInforme(x2)}
        ${despedida(psico)}
      `,
    }),
  };
}

// ── 4 · 2 h tras la última sesión — justificante + resumen (SIN informe) ──────
export function emailPostUltimaSesion({ name = "", psychologistName = "", personas = 1 }: Props): Email {
  const nombre = firstName(name);
  const psico = psychologistName || "tu psicóloga";
  const x2 = personas === 2;
  return {
    subject: `${nombre ? `${nombre}, ` : ""}tu resumen de la sesión de hoy 💜`,
    html: emailLayout({
      title: "Tu resumen de sesión",
      preheader: "Lo trabajado hoy, por escrito, para que te lo lleves contigo.",
      content: `
        ${cabecera("🤍", "Gracias por hoy", `${nombre ? `${nombre}, ` : ""}que no se te escape nada de lo de hoy`, "Por si quieres tenerlo por escrito y bien a mano:")}
        ${cardResumen(psico, x2)}
        ${cardJustificante(x2)}
        ${despedida(psico)}
      `,
    }),
  };
}

// ── 5 · 24 h tras la sesión 1 (si no compró) — sesión suelta 19,99€ ──────────
export function emailSesionAdicional({ name = "", psychologistName = "", personas = 1 }: Props): Email {
  const nombre = firstName(name);
  const psico = psychologistName || "tu psicóloga";
  const x2 = personas === 2;
  return {
    subject: `${nombre ? `${nombre}, ` : ""}una sesión extra a 19,99 € (solo hasta mañana) ⏳`,
    html: emailLayout({
      title: "Una sesión extra, solo para tu arranque",
      preheader: "19,99 € en vez de 50 €. Es única y caduca en 48 h.",
      content: `
        ${cabecera("🎁", "Una idea con cariño", `${nombre ? `${nombre}, ` : ""}${psico} nos dejó una notita sobre ${x2 ? "vosotros" : "ti"}`, `Nos comentó que en ${x2 ? "vuestro" : "tu"} arranque ${x2 ? "os" : "te"} vendría bien un ritmo algo más seguido, no cada quince días. Así que ${x2 ? "os" : "te"} hemos guardado una cosita:`)}
        ${productoCard({
          emoji: "🗓️",
          nombre: x2 ? "Sesión individual para uno" : "Sesión adicional",
          desc: `Una sesión completa a precio de arranque: 19,99 € en vez de 50 €.${x2 ? " Para uno de vosotros, a solas." : ""} Es solo para quien empieza y no se repite dentro del mismo proceso.`,
          precio: "19,99 €",
          nota: "50 € tachado",
          url: LINKS.sesionAdicional,
          cta: "Activar mi sesión extra",
        })}
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFF6E9;border:1px solid #f3d9a8;border-radius:14px;margin:2px 0 6px;">
          <tr><td style="padding:16px 20px;text-align:center;">
            <p style="margin:0;font-size:13.5px;color:#8a6d1f;line-height:1.6;">⏳ La tenemos reservada solo <strong>48 horas</strong>. No la reabrimos después — pero tú decides, sin ninguna prisa.</p>
          </td></tr>
        </table>
        ${despedida(psico)}
      `,
    }),
  };
}

// ── 6 · Test psicométrico clínico (49,99€) ───────────────────────────────────
export function emailTestPsicometrico({ name = "", psychologistName = "", personas = 1 }: Props): Email {
  const nombre = firstName(name);
  const psico = psychologistName || "tu psicóloga";
  const x2 = personas === 2;
  return {
    subject: `${nombre ? `${nombre}, ` : ""}¿medimos de dónde partes? 💜`,
    html: emailLayout({
      title: "Un test para medir tu punto de partida",
      preheader: "El mismo test de consulta, interpretado por tu psicóloga.",
      content: `
        ${cabecera("📊", "Una idea de tu psicóloga", `${nombre ? `${nombre}, ` : ""}${psico} cree que te vendría bien medir esto`, `Con un dato concreto, en números, en vez de a ojo. ${x2 ? "Uno para cada uno, para ver de dónde partís." : ""} Así se puede afinar mejor el trabajo:`)}
        ${productoCard({
          emoji: "🧠",
          nombre: `Test psicométrico clínico${x2 ? " (para cada uno)" : ""}`,
          desc: `El mismo test estandarizado que se pasa en consulta. Lo haces en 20 min desde casa y ${psico} te lo interpreta en tu próxima sesión.`,
          precio: "49,99 €",
          nota: x2 ? "×2 · 20 min c/u" : "20 min desde casa",
          url: LINKS.test,
          cta: "Quiero medirlo",
        })}
        ${despedida(psico)}
      `,
    }),
  };
}

// ── 7 · Sesión de pareja / familiar (44,99€) · variante "tercero" para Amor ──
export function emailSesionParejaFamiliar({
  name = "",
  psychologistName = "",
  variante = "pareja",
}: Props & { variante?: "pareja" | "tercero" }): Email {
  const nombre = firstName(name);
  const psico = psychologistName || "tu psicóloga";
  const esTercero = variante === "tercero";
  return {
    subject: esTercero
      ? `${nombre ? `${nombre}, ` : ""}¿sumamos a alguien más a vuestro proceso? 💜`
      : `${nombre ? `${nombre}, ` : ""}hay cosas que se mueven mejor en compañía 💜`,
    html: emailLayout({
      title: esTercero ? "Sumar a un tercero" : "Una sesión en compañía",
      preheader: "Con tu mismo psicólogo, que ya conoce tu caso.",
      content: `
        ${
          esTercero
            ? cabecera("👨‍👩‍👧", "Una idea de vuestra psicóloga", `${nombre ? `${nombre}, ` : ""}quizá le vendría bien estar delante`, `${psico} nos comentó que parte de lo que trabajáis tiene que ver con alguien más (un hijo, un familiar). Sumarlo a una sesión suele desatascar mucho:`)
            : cabecera("💞", "Una idea de tu psicóloga", `${nombre ? `${nombre}, ` : ""}hay temas que se trabajan mejor en compañía`, `${psico} nos comentó que buena parte de lo que trabajáis tiene que ver con tu pareja o tu familia. Hacerlo juntos suele ser el momento en que las cosas se mueven de verdad:`)
        }
        ${productoCard({
          emoji: "🛋️",
          nombre: esTercero ? "Sesión familiar" : "Sesión de pareja o familiar",
          desc: `Una sesión conjunta con ${psico}, que ya conoce vuestro caso. Pueden entrar más de dos personas. Lo tuyo sigue siendo tuyo.`,
          precio: "44,99 €",
          nota: "Elegís la fecha",
          url: LINKS.pareja,
          cta: "Reservar sesión conjunta",
        })}
        ${despedida(psico)}
      `,
    }),
  };
}

// ── 8 · Cartilla de terapia (39,99€) ─────────────────────────────────────────
export function emailCartillaTerapia({ name = "", psychologistName = "" }: Props): Email {
  const nombre = firstName(name);
  const psico = psychologistName || "tu psicóloga";
  return {
    subject: `${nombre ? `${nombre}, ` : ""}tu herramienta para entre sesiones 💜`,
    html: emailLayout({
      title: "Tu cartilla de terapia",
      preheader: "Para seguir tu avance también entre sesión y sesión.",
      content: `
        ${cabecera("📔", "Para cuidarte cada día", `${nombre ? `${nombre}, ` : ""}el proceso también pasa entre sesiones`, "La cartilla de terapia es tu herramienta para seguir tu avance, tus ejercicios y tu evolución en el día a día. Cuanto antes la tengas, más partido le sacas:")}
        ${productoCard({
          emoji: "🌿",
          nombre: "Cartilla de terapia",
          desc: `Tu cuaderno de trabajo entre sesiones, alineado con lo que trabajáis ${psico} y tú. Vamos por la mitad del proceso: aquí es donde más se nota.`,
          precio: "39,99 €",
          nota: "Tuya para siempre",
          url: LINKS.cartilla,
          cta: "Quiero mi cartilla",
        })}
        ${despedida(psico)}
      `,
    }),
  };
}

// ── 9 · Renovación del bono (por bono) ───────────────────────────────────────
export function emailRenovacion({
  name = "",
  psychologistName = "",
  nombreBono = "tu bono",
  precioBono = "",
}: Props & { nombreBono?: string; precioBono?: string }): Email {
  const nombre = firstName(name);
  const psico = psychologistName || "tu psicóloga";
  return {
    subject: `${nombre ? `${nombre}, ` : ""}¿seguimos el ritmo? 💜`,
    html: emailLayout({
      title: "Sigue tu proceso",
      preheader: "Renueva y no pierdas lo que has avanzado.",
      content: `
        ${cabecera("🌸", "Habéis hecho un camino precioso", `${nombre ? `${nombre}, ` : ""}sería una pena frenar ahora`, `Has avanzado un montón con ${psico}. Renovar ${nombreBono} es la forma de mantener el ritmo y no perder lo trabajado — sin prisas, cuando tú lo sientas.`)}
        ${productoCard({
          emoji: "💜",
          nombre: `Renovar ${nombreBono}`,
          desc: `Sigues con ${psico}, mantienes tu proceso y las sesiones que te queden se suman a tu bono nuevo. No pierdes nada.`,
          precio: precioBono || "Ver precio",
          nota: "Sin permanencia",
          url: LINKS.bonos,
          cta: "Renovar y seguir",
        })}
        ${despedida(psico)}
      `,
    }),
  };
}

// ── 10 · Prórroga del bono (20€/mes) — tras un "no" a renovar ─────────────────
export function emailProrroga({ name = "", psychologistName = "" }: Props): Email {
  const nombre = firstName(name);
  const psico = psychologistName || "tu psicóloga";
  return {
    subject: `${nombre ? `${nombre}, ` : ""}no pierdas tus sesiones sin usar 💜`,
    html: emailLayout({
      title: "Amplía la vigencia de tu bono",
      preheader: "Un mes más para no perder las sesiones que te quedan.",
      content: `
        ${cabecera("⏳", "Sin prisa, pero sin perderlas", `${nombre ? `${nombre}, ` : ""}te quedan sesiones por disfrutar`, "Y tu bono está a punto de caducar. Si aún no lo ves claro para renovar, no pasa nada: puedes ampliar la vigencia un mes para no perder lo que te queda.")}
        ${productoCard({
          emoji: "🗓️",
          nombre: "Prórroga de tu bono",
          desc: "Amplía la caducidad un mes más y usa tus sesiones cuando estés lista. Sin compromiso de renovar.",
          precio: "20 €",
          nota: "/mes",
          url: LINKS.prorroga,
          cta: "Ampliar un mes",
        })}
        ${despedida(psico)}
      `,
    }),
  };
}

// ── 11 · Rescate ~día 30 dormido — segunda opinión (28,97€) ──────────────────
export function emailRescateSegundaOpinion({
  name = "",
  psychologistName = "",
  personas = 1,
}: Props): Email {
  const nombre = firstName(name);
  const x2 = personas === 2;
  return {
    subject: `${nombre ? `${nombre}, ` : ""}una mirada nueva sobre ${x2 ? "vuestro" : "tu"} proceso 💜`,
    html: emailLayout({
      title: "Una segunda opinión, sin compromiso",
      preheader: "Otro psicólogo lee tu historial y te da su lectura por escrito. Sin sesión.",
      content: `
        ${cabecera("🫶", "Os tenemos presentes", `${nombre ? `${nombre}, ` : ""}hace un tiempo que no nos vemos`, `Y no queremos daros la brasa, de verdad. Solo pasamos a dejar${x2 ? "os" : "te"} una idea por si apetece retomar, a ${x2 ? "vuestra" : "tu"} manera:`)}
        ${productoCard({
          emoji: "🔎",
          nombre: "Segunda opinión clínica",
          desc: "Otro psicólogo del equipo lee tu historial completo y te da su lectura por escrito, de forma independiente. Sin sesión y sin compromiso: una mirada nueva sobre lo que ya trabajaste.",
          precio: "28,97 €",
          nota: "Por escrito en 72 h",
          url: LINKS.segundaOpinion,
          cta: "Pedir mi segunda opinión",
        })}
        <p style="margin:26px 0 0;font-size:14px;line-height:1.7;color:#1a0a1f;opacity:0.7;text-align:center;">
          Y si prefer${x2 ? "ís" : "es"} solo saludar, aquí estamos 💜<br>Cuidaos mucho.
        </p>
        <p style="margin:14px 0 0;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;">Con cariño, el equipo de Mente Sana</p>
      `,
    }),
  };
}
