import { emailLayout } from "./layout";

interface Props {
  name?: string;
  psychologistName?: string;
}

export function diagnosticoPaidEmail({ name = "", psychologistName = "" }: Props): { subject: string; html: string } {
  const greeting = name ? `${name},` : "Hola,";
  const testUrl = `https://mentesanapsicologia.com/test-mental-health?email=${encodeURIComponent(name ? "" : "")}&name=${encodeURIComponent(name)}`;
  const confirmUrl = "https://confrimacionregistro.vercel.app/";

  return {
    subject: "✅ Pago confirmado — Completa tu evaluación para recibir tu diagnóstico",
    html: emailLayout({
      title: "Pago confirmado",
      preheader: `${greeting} tu pago de 9,99€ se ha confirmado. Ahora completa tu evaluación clínica para que tu psicóloga elabore tu diagnóstico.`,
      content: `
        <!-- Success badge -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td align="center">
              <div style="width:72px;height:72px;background:#dcfce7;border-radius:50%;display:inline-block;line-height:72px;text-align:center;font-size:36px;">✓</div>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;">¡Pago confirmado!</p>
        <h1 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:28px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;">${greeting} tu diagnóstico está en marcha</h1>

        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.7;text-align:center;">
          Hemos recibido tu pago de <strong style="color:#6A178C;">9,99€</strong>.
          ${psychologistName ? `Tu psicóloga asignada es <strong>${psychologistName}</strong>.` : ""}
          Ahora necesitamos que completes tu <strong>evaluación clínica</strong> para que podamos elaborar tu informe.
        </p>

        <!-- ★★★ CTA PRINCIPAL — HACER EL TEST ★★★ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);border-radius:20px;margin:24px 0;">
          <tr>
            <td style="padding:32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:28px;">📄</p>
              <p style="margin:0 0 6px;font-size:13px;color:#ffffff;opacity:0.7;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Paso más importante</p>
              <p style="margin:0 0 6px;font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#ffffff;line-height:1.3;">Completa tu evaluación clínica</p>
              <p style="margin:0 0 20px;font-size:14px;color:#ffffff;opacity:0.7;">30 preguntas · 8-10 min · Tu psicóloga usará tus respuestas para elaborar tu diagnóstico</p>
              <a href="${testUrl}" style="background:#ffffff;color:#6A178C;text-decoration:none;padding:16px 36px;border-radius:999px;font-weight:700;display:inline-block;font-size:16px;">
                Completar mi evaluación →
              </a>
            </td>
          </tr>
        </table>

        <!-- Confirmación de cita -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8f5ff;border-radius:16px;margin:24px 0;border:1px solid #e9d5f5;">
          <tr>
            <td style="padding:20px;text-align:center;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#6A178C;">📅 ¿Necesitas confirmar o cambiar tu cita?</p>
              <p style="margin:0 0 12px;font-size:13px;color:#1a0a1f;opacity:0.6;">Si necesitas ver los detalles de tu cita o hacer cambios:</p>
              <a href="${confirmUrl}" style="background:#6A178C;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:999px;font-weight:700;display:inline-block;font-size:13px;">
                Ver mi confirmación de cita
              </a>
            </td>
          </tr>
        </table>

        <!-- Qué pasa después -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:32px 0;">
          <tr><td><p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#6A178C;text-transform:uppercase;letter-spacing:0.5px;">¿Qué pasa después?</p></td></tr>
        </table>

        <!-- Step 1 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
          <tr>
            <td style="width:40px;vertical-align:top;">
              <div style="width:32px;height:32px;background:linear-gradient(135deg,#6A178C,#8B2FB5);border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;color:#fff;">1</div>
            </td>
            <td style="padding-left:12px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#6A178C;">Completas la evaluación (8-10 min)</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.6;">30 preguntas clínicas sobre cómo te sientes. Es la base de tu diagnóstico.</p>
            </td>
          </tr>
        </table>

        <!-- Step 2 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
          <tr>
            <td style="width:40px;vertical-align:top;">
              <div style="width:32px;height:32px;background:#f3e8ff;border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;color:#6A178C;">2</div>
            </td>
            <td style="padding-left:12px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#1a0a1f;">Tu psicóloga elabora tu informe</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.6;">Analiza tus respuestas, completa tu perfil clínico y prepara tu plan de acción personalizado.</p>
            </td>
          </tr>
        </table>

        <!-- Step 3 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
          <tr>
            <td style="width:40px;vertical-align:top;">
              <div style="width:32px;height:32px;background:#f3e8ff;border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;color:#6A178C;">3</div>
            </td>
            <td style="padding-left:12px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#1a0a1f;">Sesión con tu psicóloga (50 min)</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.6;">En la videollamada, tu psicóloga te entrega el informe, te explica cada hallazgo y juntos construís un plan de acción.</p>
            </td>
          </tr>
        </table>

        <!-- Reminder CTA -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);border-radius:16px;margin:32px 0;">
          <tr>
            <td style="padding:24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#fff;">⚠️ Sin tu evaluación, no podemos elaborar tu diagnóstico</p>
              <p style="margin:0 0 16px;font-size:13px;color:#ffffff;opacity:0.7;">Cuanto antes la completes, antes tendrás tu informe listo para la sesión.</p>
              <a href="${testUrl}" style="background:#ffffff;color:#6A178C;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px;">
                Completar mi evaluación ahora →
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:32px 0 0;font-size:12px;color:#1a0a1f;opacity:0.4;text-align:center;line-height:1.6;">
          ¿Dudas? Escríbenos por WhatsApp al <a href="https://wa.me/34XXXXXXXXX" style="color:#6A178C;text-decoration:none;">+34 XXX XXX XXX</a><br>
          Este email se envía porque acabas de completar tu pago en Mente Sana Psicología.
        </p>
      `,
    }),
  };
}
