import { emailLayout } from "./layout";

interface Props {
  name?: string;
  psychologistName?: string;
  date?: string;
  time?: string;
  videoLink?: string;
}

export function sessionReminderEmail({ name = "", psychologistName = "tu psicóloga", date = "mañana", time = "", videoLink = "" }: Props): { subject: string; html: string } {
  return {
    subject: `📅 Tu sesión con ${psychologistName} es ${date}`,
    html: emailLayout({
      title: "Recordatorio de sesión",
      preheader: `Tu próxima sesión con ${psychologistName} es ${date}${time ? ` a las ${time}` : ""}.`,
      content: `
        <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;">No olvides</p>
        <h1 style="margin:0 0 24px;font-family:'Playfair Display',Georgia,serif;font-size:32px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;">${name ? name + ", tu" : "Tu"} sesión es ${date}</h1>

        <!-- Session card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);border-radius:20px;margin:24px 0;">
          <tr>
            <td style="padding:32px;text-align:center;color:#ffffff;">
              <p style="margin:0 0 8px;font-size:12px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Tu sesión con</p>
              <p style="margin:0 0 20px;font-family:'Playfair Display',Georgia,serif;font-size:28px;line-height:1.2;">${psychologistName}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="padding:12px 20px;background:rgba(255,255,255,0.15);border-radius:12px;">
                    <p style="margin:0;font-size:13px;opacity:0.7;">📅 Fecha</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:700;">${date}</p>
                  </td>
                  ${time ? `
                  <td width="12"></td>
                  <td style="padding:12px 20px;background:rgba(255,255,255,0.15);border-radius:12px;">
                    <p style="margin:0;font-size:13px;opacity:0.7;">🕐 Hora</p>
                    <p style="margin:4px 0 0;font-size:16px;font-weight:700;">${time}</p>
                  </td>` : ""}
                </tr>
              </table>
              ${videoLink ? `
              <p style="margin:24px 0 0;">
                <a href="${videoLink}" style="background:#ffffff;color:#6A178C;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;display:inline-block;font-size:14px;">
                  Unirme a la videollamada
                </a>
              </p>` : ""}
            </td>
          </tr>
        </table>

        <!-- Tips -->
        <p style="margin:32px 0 16px;font-size:13px;font-weight:700;color:#6A178C;text-transform:uppercase;letter-spacing:1px;text-align:center;">Para sacarle el máximo</p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
              <strong style="font-size:14px;">🤫 Busca un lugar tranquilo</strong>
              <p style="margin:4px 0 0;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.5;">Donde puedas hablar con privacidad, sin interrupciones.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
              <strong style="font-size:14px;">📶 Comprueba tu conexión</strong>
              <p style="margin:4px 0 0;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.5;">Wifi estable o datos móviles con buena cobertura.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
              <strong style="font-size:14px;">📝 Anota tus dudas</strong>
              <p style="margin:4px 0 0;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.5;">Lo que quieras compartir, preguntar o explorar.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 0;">
              <strong style="font-size:14px;">💧 Ten agua a mano</strong>
              <p style="margin:4px 0 0;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.5;">Y dale a tu cuerpo lo que necesite para estar cómoda.</p>
            </td>
          </tr>
        </table>

        <p style="margin:32px 0 0;font-size:12px;color:#1a0a1f;opacity:0.4;text-align:center;line-height:1.6;">
          ¿Necesitas reagendar? Escríbenos por <a href="https://wa.me/34XXXXXXXXX" style="color:#6A178C;text-decoration:none;">WhatsApp</a> con al menos 24h de antelación.
        </p>
      `,
    }),
  };
}
