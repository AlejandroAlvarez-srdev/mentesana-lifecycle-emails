// Confirmación de nutrición: mismo esqueleto de logopedia, cita y plan; sin app ni credenciales.
import { emailLayout } from "./layout";
import { resolvePsiPhotoUrl } from "./psi-photos";

interface Props {
  name?: string;
  psychologistName?: string;
  email?: string;
  /** Día de la sesión "YYYY-MM-DD" (hora Madrid) y hora "HH:MM". */
  scheduledDate?: string;
  scheduledTime?: string;
  meetUrl?: string | null;
}

const PURPLE = "#6A178C";
const PURPLE_DEEP = "#3F0E54";
const PURPLE_SOFT = "#8B2FB5";
const GOLD = "#D4AF37";
const CREAM = "#FBF7EE";
const CREAM_DEEP = "#F5EDE0";

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "MS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function fechaLarga(date?: string, time?: string): string | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [y, m, d] = date.split("-").map(Number);
  const txt = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d, 12)));
  const cap = txt.charAt(0).toUpperCase() + txt.slice(1);
  return time ? `${cap} · ${time} h (hora de Madrid)` : cap;
}

export function nutricionPaidEmail({ name = "", psychologistName = "", scheduledDate, scheduledTime, meetUrl }: Props): { subject: string; html: string } {
  const firstName = (name || "").trim().split(/\s+/)[0] || "";
  const greeting = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "Hola";
  const psiPhoto = resolvePsiPhotoUrl(psychologistName);
  const psiInitials = initialsOf(psychologistName);
  const psiFirst = (psychologistName || "").trim().split(/\s+/)[0] || "";
  const cuando = fechaLarga(scheduledDate, scheduledTime);
  const pro = psychologistName ? esc(psychologistName) : "tu nutricionista";

  return {
    subject: "✅ Tu primera sesión de nutrición está reservada · Mente Sana",
    html: emailLayout({
      brandLine: "nutrición online · un plan para tu vida",
      communityLine: "+8.000 pacientes acompañados por Mente Sana",
      title: "Tu cita de nutrición está reservada",
      preheader: `${greeting}, tu consulta de nutrición con ${psychologistName || "tu nutricionista"} queda reservada.${cuando ? ` ${cuando}.` : ""}`,
      content: `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,${PURPLE_DEEP} 0%,${PURPLE} 55%,${PURPLE_SOFT} 100%);border-radius:24px;margin:0 0 28px;">
          <tr>
            <td style="padding:36px 28px 28px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 18px;">
                <tr>
                  <td style="background:${GOLD};border-radius:999px;padding:6px 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2.4px;color:${PURPLE_DEEP};text-transform:uppercase;">
                    ✓ Pago confirmado · 9,99€
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;font-family:'Caveat','Brush Script MT',cursive;font-size:30px;line-height:1;color:${GOLD};">
                ${esc(greeting)}, ya está reservada
              </p>
              <h1 style="margin:0 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:32px;line-height:1.1;color:#ffffff;font-weight:400;letter-spacing:-0.02em;">
                Tu primera consulta<br>
                <em style="color:${GOLD};font-style:normal;">de nutrición.</em>
              </h1>
              <p style="margin:0 auto;max-width:420px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.85);">
                ${psychologistName ? `Te atenderá <strong style="color:${GOLD};">${pro}</strong>, nutricionista profesional de Mente Sana.` : "Te atenderá una nutricionista profesional de Mente Sana."}
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${CREAM};border:1.5px solid ${PURPLE}1f;border-radius:24px;margin:0 0 28px;">
          <tr>
            <td style="padding:28px 24px;text-align:center;">
              <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:1.8px;text-transform:uppercase;">Tu cita</p>
              <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:24px;line-height:1.2;color:#1a0a1f;font-weight:500;letter-spacing:-0.02em;">
                ${cuando ? esc(cuando) : "Día y hora confirmados en tu agenda"}
              </p>
              <p style="margin:0 0 ${meetUrl ? "18px" : "0"};font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;color:#1a0a1f;opacity:0.65;line-height:1.5;">
                Videollamada · 45 minutos · con ${pro}
              </p>
              ${meetUrl ? `
              <a href="${esc(meetUrl)}" target="_blank" style="background:${PURPLE};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;display:inline-block;font-size:14px;">
                Entrar a la videollamada →
              </a>
              <p style="margin:12px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11.5px;color:#1a0a1f;opacity:0.55;line-height:1.5;">Guarda este email: el enlace es el mismo el día de la sesión.</p>
              ` : `
              <p style="margin:12px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11.5px;color:#1a0a1f;opacity:0.55;line-height:1.5;">El enlace a la videollamada te llega en el recordatorio antes de la sesión.</p>
              `}
            </td>
          </tr>
        </table>

        ${psychologistName ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid #f0e6f7;border-radius:20px;margin:0 0 28px;box-shadow:0 8px 28px rgba(106,23,140,0.06);">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width:84px;vertical-align:middle;padding-right:16px;">
                    ${psiPhoto ? `
                      <img src="${psiPhoto}" alt="${pro}" width="76" height="76" style="display:block;width:76px;height:76px;border-radius:50%;object-fit:cover;border:3px solid ${GOLD};box-shadow:0 6px 18px rgba(106,23,140,0.2);">
                    ` : `
                      <div style="width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,${PURPLE} 0%,${PURPLE_SOFT} 100%);text-align:center;line-height:76px;font-family:'Playfair Display',Georgia,serif;font-size:28px;color:${GOLD};font-weight:500;border:3px solid ${GOLD};box-shadow:0 6px 18px rgba(106,23,140,0.2);letter-spacing:-0.02em;">${psiInitials}</div>
                    `}
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0 0 2px;font-family:'Caveat',cursive;font-size:18px;color:${PURPLE};line-height:1;">tu nutricionista</p>
                    <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.15;color:#1a0a1f;font-weight:500;letter-spacing:-0.02em;">${pro}</p>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#1a0a1f;opacity:0.6;line-height:1.45;">
                      Nutricionista profesional · lee tus respuestas antes de la sesión${psiFirst ? ` · ${esc(psiFirst)} te espera` : ""}.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        ` : ""}

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 12px;">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:1.6px;text-transform:uppercase;">Para que la sesión aproveche</p>
              <h3 style="margin:0 0 20px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.2;color:#1a0a1f;font-weight:400;letter-spacing:-0.01em;">
                Tres cosas sencillas antes de la videollamada.
              </h3>
            </td>
          </tr>
        </table>

        ${[
          ["1", "Un sitio tranquilo", "Móvil u ordenador con cámara, buena luz y pocas distracciones. Conéctate unos minutos antes."],
          ["2", "Tu semana de comidas", "Piensa en tus horarios y en lo que ya compras. El plan parte de tu vida cotidiana."],
          ["3", "Las recomendaciones de tu médico", "Si tienes indicaciones médicas, tenlas a mano. Trabajamos en coordinación con lo que te haya dicho tu médico."],
        ].map(([n, t, d]) => `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid #f0e6f7;border-radius:16px;margin:0 0 12px;">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width:48px;vertical-align:top;">
                    <div style="width:40px;height:40px;background:linear-gradient(135deg,${PURPLE},${PURPLE_SOFT});border-radius:14px;text-align:center;line-height:40px;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:18px;color:#fff;">${n}</div>
                  </td>
                  <td style="padding-left:14px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:17px;color:#1a0a1f;line-height:1.25;font-weight:400;letter-spacing:-0.01em;">${t}</p>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.55;">${d}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`).join("")}

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${CREAM_DEEP};border-radius:14px;margin:16px 0 28px;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;font-weight:700;color:${PURPLE_DEEP};">Qué pasa después de la sesión</p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12.5px;color:#1a0a1f;opacity:0.65;line-height:1.55;">
                ${psiFirst ? esc(psiFirst) : "Tu nutricionista"} te envía tu plan de comidas personalizado por escrito en las 48 h tras la consulta: desayuno, comida, cena y picoteo, lista de la compra y los 3 cambios prioritarios. Incluye seguimiento de 15 días por chat para dudas y ajustes. Los resultados dependen de cada persona y de seguir el plan. Después decides si quieres un bono de seguimiento, sin suscripción ni compromiso.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;line-height:1.65;color:#1a0a1f;opacity:0.8;">
          ¿Necesitas cambiar el día o la hora? Responde a este email y lo movemos contigo.
        </p>
        <p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:22px;color:${PURPLE_SOFT};line-height:1;">Un abrazo,</p>
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;color:#1a0a1f;font-weight:600;">Equipo Mente Sana · Nutrición</p>
      `,
    }),
  };
}
