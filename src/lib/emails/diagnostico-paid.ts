import { emailLayout } from "./layout";

interface Props {
  name?: string;
  psychologistName?: string;
}

export function diagnosticoPaidEmail({ name = "", psychologistName = "" }: Props): { subject: string; html: string } {
  const greeting = name ? `${name},` : "Hola,";
  return {
    subject: "📄 Tu diagnóstico está en marcha — Completa las 5 preguntas",
    html: emailLayout({
      title: "Diagnóstico en marcha",
      preheader: `${greeting} tu pago se ha confirmado. Solo faltan 5 preguntas para empezar tu diagnóstico.`,
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
        <h1 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:28px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;">${greeting} tu diagnóstico ya está en marcha</h1>

        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.7;text-align:center;">
          Ya hemos recibido tu pago. Ahora necesitamos que respondas <strong style="color:#6A178C;">5 preguntas</strong> para que tu psicóloga pueda elaborar tu diagnóstico clínico personalizado.
        </p>

        <!-- CTA Block -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);border-radius:20px;margin:24px 0;">
          <tr>
            <td style="padding:32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#ffffff;opacity:0.7;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Siguiente paso</p>
              <p style="margin:0 0 6px;font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#ffffff;line-height:1.3;">Responde 5 preguntas</p>
              <p style="margin:0 0 20px;font-size:14px;color:#ffffff;opacity:0.7;">2 minutos · Nos ayuda a asignarte la psicóloga ideal y preparar tu informe</p>
              <a href="https://mentesanapsicologia.com/test-mental-health" style="background:#ffffff;color:#6A178C;text-decoration:none;padding:16px 36px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px;">
                Completar mis 5 preguntas →
              </a>
            </td>
          </tr>
        </table>

        <!-- What happens next -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:32px 0;">
          <tr><td style="padding:0;">
            <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#6A178C;text-transform:uppercase;letter-spacing:0.5px;">¿Qué pasa después?</p>
          </td></tr>
        </table>

        <!-- Step 1 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
          <tr>
            <td style="width:40px;vertical-align:top;">
              <div style="width:32px;height:32px;background:#f3e8ff;border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;color:#6A178C;">1</div>
            </td>
            <td style="padding-left:12px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#1a0a1f;">Respondes 5 preguntas (2 min)</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.6;">Sobre cómo te sientes, desde cuándo, y qué buscas. Nada invasivo.</p>
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
              <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#1a0a1f;">Te asignamos tu psicóloga</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.6;">Elegimos la más idónea para estudiar tu caso. Verás quién es y por qué ella.${psychologistName ? ` Tu match: <strong>${psychologistName}</strong>.` : ""}</p>
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
              <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#1a0a1f;">Sesión de lectura (50 min)</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.6;">Tu psicóloga te entrega el informe, te explica cada hallazgo y juntos diseñáis un plan de acción.</p>
            </td>
          </tr>
        </table>

        <!-- Step 4 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
          <tr>
            <td style="width:40px;vertical-align:top;">
              <div style="width:32px;height:32px;background:#f3e8ff;border-radius:50%;text-align:center;line-height:32px;font-weight:700;font-size:14px;color:#6A178C;">4</div>
            </td>
            <td style="padding-left:12px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#1a0a1f;">Te llevas tu informe</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.6;">PDF firmado en tu email. Tuyo para siempre.</p>
            </td>
          </tr>
        </table>

        <!-- Reminder CTA -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#faf5ff;border-radius:16px;margin:32px 0;border:1px solid #e9d5f5;">
          <tr>
            <td style="padding:24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1a0a1f;">⏱ Solo te llevará 2 minutos</p>
              <p style="margin:0 0 16px;font-size:13px;color:#1a0a1f;opacity:0.6;">Cuanto antes respondas, antes tendrás tu sesión de lectura.</p>
              <a href="https://mentesanapsicologia.com/test-mental-health" style="background:#6A178C;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:700;display:inline-block;font-size:14px;">
                Empezar las 5 preguntas →
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
