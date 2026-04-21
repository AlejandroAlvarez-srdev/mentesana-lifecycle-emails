import { emailLayout } from "./layout";

interface Props {
  name?: string;
  psychologistName?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  perfilNombre?: string | null;
}

export function reportDeliveryEmail({
  name = "",
  psychologistName = "",
  perfilNombre = "",
}: Props): { subject: string; html: string } {
  const greeting = name ? name.split(" ")[0] : "";
  const psico = psychologistName || "tu psicóloga";

  return {
    subject: "📄 Tu informe clínico personalizado — revisado tras tu sesión",
    html: emailLayout({
      title: "Tu informe clínico",
      preheader: `${greeting ? `${greeting}, ` : ""}${psico} ha revisado tu informe tras la sesión y ya lo tienes contigo.`,
      content: `
        <!-- Icono -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td align="center">
              <div style="width:72px;height:72px;background:linear-gradient(135deg,#6A178C,#8B2FB5);border-radius:50%;display:inline-block;line-height:72px;text-align:center;font-size:32px;">📄</div>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:26px;color:#6A178C;text-align:center;">Gracias por tu sesión</p>
        <h1 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:28px;line-height:1.3;color:#1a0a1f;text-align:center;font-weight:400;">
          ${greeting ? `${greeting}, aquí tienes tu informe ` : "Aquí tienes tu informe "}clínico personalizado
        </h1>

        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.75;text-align:center;">
          ${psico} lo ha <strong style="color:#6A178C;">revisado personalmente</strong> tras vuestra sesión, con lo hablado y lo observado.
          ${perfilNombre ? `Refleja tu perfil <strong>${perfilNombre}</strong> con los hallazgos clínicos y el plan de acción que construisteis juntas.` : "Recoge los hallazgos clínicos y el plan de acción que construisteis juntas."}
        </p>

        <!-- Aviso psicóloga -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);border-radius:20px;margin:24px 0;">
          <tr>
            <td style="padding:28px;text-align:center;">
              <p style="margin:0 0 4px;font-size:24px;">✍️</p>
              <p style="margin:0 0 6px;font-size:12px;color:#ffffff;opacity:0.75;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Revisado por</p>
              <p style="margin:0 0 6px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#ffffff;line-height:1.3;">
                ${psico}
              </p>
              <p style="margin:0;font-size:14px;color:#ffffff;opacity:0.85;line-height:1.5;">
                Tu psicóloga colegiada en Mente Sana
              </p>
            </td>
          </tr>
        </table>

        <!-- Qué hacer ahora -->
        <p style="margin:32px 0 16px;font-size:13px;font-weight:700;color:#6A178C;text-transform:uppercase;letter-spacing:0.5px;">Qué hacer con este informe</p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 14px;">
          <tr>
            <td style="width:40px;vertical-align:top;">
              <div style="width:32px;height:32px;background:linear-gradient(135deg,#6A178C,#8B2FB5);border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;color:#fff;">1</div>
            </td>
            <td style="padding-left:12px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#6A178C;">Vuelve a leerlo con calma</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.6;">En sesión se dice mucho. Releerlo te ayuda a asentar lo importante.</p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 14px;">
          <tr>
            <td style="width:40px;vertical-align:top;">
              <div style="width:32px;height:32px;background:#f3e8ff;border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;color:#6A178C;">2</div>
            </td>
            <td style="padding-left:12px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#1a0a1f;">Empieza por un solo paso del plan</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.6;">No intentes aplicarlo todo a la vez. Elige el primer paso y céntrate en él esta semana.</p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 14px;">
          <tr>
            <td style="width:40px;vertical-align:top;">
              <div style="width:32px;height:32px;background:#f3e8ff;border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;color:#6A178C;">3</div>
            </td>
            <td style="padding-left:12px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#1a0a1f;">Guárdalo como referencia</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.6;">Te servirá para medir tu avance dentro de unas semanas y para continuar el proceso si decides seguir.</p>
            </td>
          </tr>
        </table>

        <!-- Nota personal -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFFAF2;border:1px solid #e9d5f5;border-radius:16px;margin:32px 0;">
          <tr>
            <td style="padding:22px;">
              <p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;">Una nota</p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#1a0a1f;opacity:0.8;">
                Este informe no te etiqueta. Es una foto clínica del momento que estás viviendo y el reflejo de lo que trabajasteis en la sesión. Si algo te resuena distinto al leerlo en frío, apúntalo: es material valioso para continuar el proceso.
              </p>
            </td>
          </tr>
        </table>

        <!-- ¿Seguir el proceso? -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
          <tr>
            <td align="center">
              <p style="margin:0 0 12px;font-size:13px;color:#1a0a1f;opacity:0.6;">¿Quieres seguir el proceso con ${psico}?</p>
              <a href="https://wa.me/34XXXXXXXXX" style="background:#25D366;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:700;display:inline-block;font-size:14px;">
                Escríbenos por WhatsApp
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:32px 0 0;font-size:12px;color:#1a0a1f;opacity:0.45;text-align:center;line-height:1.6;">
          Tu informe es <strong>confidencial</strong>. Solo tú y ${psico} tenéis acceso.<br>
          Guárdalo en un lugar seguro o elimínalo tras revisarlo si lo prefieres.
        </p>
      `,
    }),
  };
}
