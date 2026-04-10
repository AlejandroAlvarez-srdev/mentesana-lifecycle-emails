import { emailLayout } from "./layout";

interface Props {
  name?: string;
  amount?: string;
  psychologistName?: string;
}

export function paymentConfirmationEmail({ name = "", amount = "9,99 €", psychologistName = "" }: Props): { subject: string; html: string } {
  const greeting = name ? `${name},` : "Hola,";
  return {
    subject: "✅ Pago confirmado — Tu sesión con Mente Sana",
    html: emailLayout({
      title: "Pago confirmado",
      preheader: `Hemos recibido tu pago de ${amount}. Ahora agenda tu sesión.`,
      content: `
        <!-- Success badge -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td align="center">
              <div style="width:72px;height:72px;background:#dcfce7;border-radius:50%;display:inline-block;line-height:72px;text-align:center;font-size:36px;">✓</div>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;">¡Pago recibido!</p>
        <h1 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:32px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;">${greeting} bienvenida a Mente Sana</h1>

        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.7;text-align:center;">
          Hemos recibido tu pago de <strong style="color:#6A178C;">${amount}</strong> correctamente.
          ${psychologistName ? `Tu psicóloga asignada es <strong>${psychologistName}</strong>.` : ""}
        </p>

        <!-- Next step -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);border-radius:20px;margin:24px 0;">
          <tr>
            <td style="padding:28px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#ffffff;opacity:0.7;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Próximo paso</p>
              <p style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#ffffff;line-height:1.3;">Agenda tu sesión</p>
              <a href="https://mentesanapsicologia.com/test/confirmacion" style="background:#ffffff;color:#6A178C;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;display:inline-block;font-size:14px;">
                Elegir día y hora →
              </a>
            </td>
          </tr>
        </table>

        <!-- What's included -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8f5ff;border-radius:16px;margin:24px 0;">
          <tr>
            <td style="padding:24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:20px;">🎥</p>
              <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1a0a1f;">Sesión 1-a-1 de 50 minutos</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.5;">Videollamada privada con tu psicóloga</p>
            </td>
          </tr>
        </table>

        <p style="margin:32px 0 0;font-size:12px;color:#1a0a1f;opacity:0.4;text-align:center;line-height:1.6;">
          ¿Necesitas ayuda? Escríbenos por WhatsApp al <a href="https://wa.me/34XXXXXXXXX" style="color:#6A178C;text-decoration:none;">+34 XXX XXX XXX</a>
        </p>
      `,
    }),
  };
}
