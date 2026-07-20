// Emails de reactivación de pacientes inactivos.
// 3 segmentos basados en última compra:
//   A: solo diagnóstico (9,99€), inactivos +30d → "informe pendiente"
//   B: solo diagnóstico (9,99€), 14-30d → "¿qué tal la sesión?"
//   C: con bono comprado hace 30-60d → "recompra, casi termina tu bono"
//
// Todos usan layout estándar (logo + footer Mente Sana) y el send() con tracking
// de open/click. Cada email tiene un CTA único con UTMs para medir conversión.

import { emailLayout } from "./layout";

const PURPLE = "#6A178C";
const GOLD = "#D4AF37";
const BASE = "https://mentesanapsicologia.com";

type EmailRender = { subject: string; preheader: string; html: string };

// ──────────────────────────────────────────────────────────────────
// SEGMENTO A — Inactivos +30 días, solo diagnóstico
// Tono: empático, sin presión, recordatorio cariñoso. Apela al informe.
// ──────────────────────────────────────────────────────────────────
export function reactivationEmailA({ name, daysAgo, psychologistName }: { name: string; daysAgo: number; psychologistName?: string | null }): EmailRender {
  const firstName = (name || "").split(" ")[0] || "Hola";
  const subject = `${firstName}, tu psicóloga me preguntó por ti 💜`;
  const preheader = "Tu informe sigue activo. ¿Damos el siguiente paso juntas?";
  const psicMention = psychologistName ? `<strong style="color:${PURPLE}">${psychologistName}</strong>` : "tu psicóloga";
  const content = `
    <p style="margin:0 0 16px;font-size:16px;color:#1a0a1f;line-height:1.6;">Hola ${firstName},</p>

    <p style="margin:0 0 16px;font-size:15px;color:#1a0a1f;line-height:1.65;">
      Soy Alejandra, del equipo de Mente Sana. Hace unos ${daysAgo} días hiciste tu diagnóstico psicológico con nosotros y luego no supimos más de ti.
    </p>

    <p style="margin:0 0 16px;font-size:15px;color:#1a0a1f;line-height:1.65;">
      Hoy estaba revisando tu expediente y vi que ${psicMention} dejó pendiente <em>justo lo importante</em>: el siguiente paso para que ese proceso siga adelante.
    </p>

    <div style="margin:24px 0;padding:18px 20px;background:linear-gradient(135deg,${PURPLE}11,${GOLD}11);border-left:3px solid ${PURPLE};border-radius:10px;">
      <p style="margin:0;font-size:14px;color:#1a0a1f;line-height:1.6;">
        <strong style="color:${PURPLE};">No estás obligada a nada.</strong> Solo quiero que sepas que tu informe sigue activo y que cuando quieras retomarlo, tu psicóloga te está esperando.
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#1a0a1f;line-height:1.65;">
      A veces no es el momento. A veces sí lo es y solo necesitamos un pequeño empujón.
    </p>

    <div style="text-align:center;margin:26px 0;">
      <a href="${BASE}/bonos?utm_source=reactivation&utm_medium=email&utm_campaign=reactiv_A_inactivos30d" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,${PURPLE} 0%,#8B2FB5 100%);color:#fff;text-decoration:none;border-radius:999px;font-weight:800;font-size:15px;box-shadow:0 8px 24px ${PURPLE}40;">
        Retomar mi proceso →
      </a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#666;line-height:1.6;">
      Si prefieres que te llamemos o tienes alguna duda, responde directamente a este correo y te leeré yo.
    </p>

    <p style="margin:18px 0 0;font-size:13px;color:#666;line-height:1.6;">
      Un abrazo,<br/>
      <strong style="color:${PURPLE};">Alejandra · Equipo Mente Sana</strong>
    </p>
  `;
  return { subject, preheader, html: emailLayout({ title: subject, preheader, content }) };
}

// ──────────────────────────────────────────────────────────────────
// SEGMENTO B — 14-30 días desde diagnóstico, sin bono
// Tono: curiosidad + recomendación profesional, momentum aún caliente.
// ──────────────────────────────────────────────────────────────────
export function reactivationEmailB({ name, psychologistName }: { name: string; psychologistName?: string | null }): EmailRender {
  const firstName = (name || "").split(" ")[0] || "Hola";
  const subject = `${firstName}, ¿cómo te fue con tu psicóloga? 🤍`;
  const preheader = "Tu informe tenía una recomendación que quizás no leíste del todo.";
  const psicMention = psychologistName ? `<strong style="color:${PURPLE}">${psychologistName}</strong>` : "tu psicóloga";
  const content = `
    <p style="margin:0 0 16px;font-size:16px;color:#1a0a1f;line-height:1.6;">Hola ${firstName},</p>

    <p style="margin:0 0 16px;font-size:15px;color:#1a0a1f;line-height:1.65;">
      Han pasado unas semanas desde tu diagnóstico y queríamos preguntarte directamente: <strong>¿cómo te fue con ${psicMention}?</strong>
    </p>

    <p style="margin:0 0 16px;font-size:15px;color:#1a0a1f;line-height:1.65;">
      Esa primera sesión rara vez es suficiente. Es donde se identifica lo que necesitas trabajar. Lo de verdad transformador suele empezar a partir de la <strong>segunda o tercera sesión</strong>.
    </p>

    <div style="margin:22px 0;padding:18px 20px;background:#faf7fc;border:1px solid ${PURPLE}22;border-radius:12px;">
      <p style="margin:0 0 10px;font-size:13px;color:${PURPLE};font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">Tu psicóloga te recomendó un bono</p>
      <p style="margin:0;font-size:14px;color:#1a0a1f;line-height:1.6;">
        En tu informe quedó registrada una recomendación clínica concreta sobre el ritmo y la duración del proceso. Lo más común es empezar con el <strong style="color:${PURPLE};">Bono Compañía (4 sesiones, 149,99€)</strong> o el <strong style="color:${PURPLE};">Bono Felicidad (8 sesiones, 229,99€)</strong>.
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#1a0a1f;line-height:1.65;">
      Te dejo aquí la página donde puedes ver los bonos y empezar con el que más sentido tenga para ti. Sin permanencia, te quedan 12 meses para usarlo.
    </p>

    <div style="text-align:center;margin:26px 0;">
      <a href="${BASE}/bonos?utm_source=reactivation&utm_medium=email&utm_campaign=reactiv_B_14_30d" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,${GOLD} 0%,#f5c14e 100%);color:#3d0d52;text-decoration:none;border-radius:999px;font-weight:800;font-size:15px;box-shadow:0 8px 24px ${GOLD}66;">
        Ver mi bono recomendado →
      </a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#666;line-height:1.6;">
      Si la sesión no fue como esperabas, también dímelo. Tenemos psicólogas con distintos perfiles y puedo recomendarte otra.
    </p>

    <p style="margin:18px 0 0;font-size:13px;color:#666;line-height:1.6;">
      Un abrazo,<br/>
      <strong style="color:${PURPLE};">Alejandra · Equipo Mente Sana</strong>
    </p>
  `;
  return { subject, preheader, html: emailLayout({ title: subject, preheader, content }) };
}

// ──────────────────────────────────────────────────────────────────
// SEGMENTO C — Recompra bono (30-60d desde compra de bono)
// Tono: testigo del proceso, momentum, no pierdas lo que llevas.
// ──────────────────────────────────────────────────────────────────
export function reactivationEmailC({ name, psychologistName, daysSincePurchase }: { name: string; psychologistName?: string | null; daysSincePurchase: number }): EmailRender {
  const firstName = (name || "").split(" ")[0] || "Hola";
  const subject = `${firstName}, llevas ${daysSincePurchase} días en tu proceso ✨`;
  const preheader = "Lo que está pasando contigo ahora es la parte importante.";
  const psicMention = psychologistName ? `<strong style="color:${PURPLE}">${psychologistName}</strong>` : "tu psicóloga";
  const content = `
    <p style="margin:0 0 16px;font-size:16px;color:#1a0a1f;line-height:1.6;">Hola ${firstName},</p>

    <p style="margin:0 0 16px;font-size:15px;color:#1a0a1f;line-height:1.65;">
      Llevas <strong>${daysSincePurchase} días</strong> desde que empezaste con ${psicMention}. Quería pararme un segundo a recordártelo porque <em>esto es la parte importante</em>.
    </p>

    <p style="margin:0 0 16px;font-size:15px;color:#1a0a1f;line-height:1.65;">
      La mayoría de personas notan los primeros cambios entre la sesión 4 y la 8. Es justo donde estás tú ahora. <strong>No es magia ni casualidad</strong> — es lo que pasa cuando el trabajo profundo empieza a asentarse.
    </p>

    <div style="margin:24px 0;padding:20px;background:linear-gradient(135deg,${PURPLE}08,${GOLD}11);border:1px solid ${PURPLE}22;border-radius:14px;">
      <p style="margin:0 0 12px;font-size:13px;color:${PURPLE};font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">Tu bono está cerca de terminar</p>
      <p style="margin:0 0 12px;font-size:14px;color:#1a0a1f;line-height:1.6;">
        Si recargas <strong>antes de que se acaben las sesiones</strong>, mantenemos exactamente el mismo precio y la continuidad con ${psicMention}. Sin pausa, sin volver a empezar.
      </p>
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
        <div style="flex:1;min-width:140px;background:#fff;padding:12px;border-radius:10px;border:1px solid #ede4f4;text-align:center;">
          <div style="font-size:10px;color:${GOLD};font-weight:800;text-transform:uppercase;letter-spacing:0.8px;">Bono Compañía</div>
          <div style="font-size:22px;color:${PURPLE};font-weight:900;margin:4px 0;">149,99€</div>
          <div style="font-size:11px;color:#666;">4 sesiones</div>
        </div>
        <div style="flex:1;min-width:140px;background:#fff;padding:12px;border-radius:10px;border:2px solid ${PURPLE};text-align:center;position:relative;">
          <div style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:${PURPLE};color:#fff;padding:2px 8px;border-radius:999px;font-size:9px;font-weight:800;letter-spacing:0.5px;">MÁS ELEGIDO</div>
          <div style="font-size:10px;color:${GOLD};font-weight:800;text-transform:uppercase;letter-spacing:0.8px;">Bono Felicidad</div>
          <div style="font-size:22px;color:${PURPLE};font-weight:900;margin:4px 0;">229,99€</div>
          <div style="font-size:11px;color:#666;">8 sesiones</div>
        </div>
      </div>
    </div>

    <div style="text-align:center;margin:26px 0;">
      <a href="${BASE}/bonos?utm_source=reactivation&utm_medium=email&utm_campaign=reactiv_C_recompra_bono" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,${PURPLE} 0%,#8B2FB5 100%);color:#fff;text-decoration:none;border-radius:999px;font-weight:800;font-size:15px;box-shadow:0 8px 24px ${PURPLE}40;">
        Renovar mi bono →
      </a>
    </div>

    <p style="margin:0 0 0;font-size:13px;color:#666;line-height:1.6;">
      ¿Quieres seguir con ${psicMention} o probar a otra? Responde a este email y te ayudo.
    </p>

    <p style="margin:18px 0 0;font-size:13px;color:#666;line-height:1.6;">
      Un abrazo,<br/>
      <strong style="color:${PURPLE};">Alejandra · Equipo Mente Sana</strong>
    </p>
  `;
  return { subject, preheader, html: emailLayout({ title: subject, preheader, content }) };
}

export type ReactivationSegment = "A" | "B" | "C";

export function renderReactivation(seg: ReactivationSegment, p: { name: string; psychologistName?: string | null; daysAgo?: number; daysSincePurchase?: number }): EmailRender {
  if (seg === "A") return reactivationEmailA({ name: p.name, daysAgo: p.daysAgo ?? 30, psychologistName: p.psychologistName });
  if (seg === "B") return reactivationEmailB({ name: p.name, psychologistName: p.psychologistName });
  return reactivationEmailC({ name: p.name, psychologistName: p.psychologistName, daysSincePurchase: p.daysSincePurchase ?? 45 });
}
