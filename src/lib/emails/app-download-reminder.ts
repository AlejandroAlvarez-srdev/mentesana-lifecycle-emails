import { emailLayout } from "./layout";

const APP_LANDING = "https://mentesanapsicologia.com/app";
const PLAY_STORE = "https://play.google.com/apps/test/RQ8n4STdUPo/ahAO29uNSE9o0orDKNNhreru91RxZBP633w_YDN-L1KDWTbT3ybuUSlreTQWz3f4CjKs-ZIO2HoR-gKutjYXYDqKTC";
const CRM_LOGIN = "https://crm.mentesanapsicologia.com/login";

interface Props {
  firstName?: string;
  email: string;
}

export function appDownloadReminderEmail({ firstName, email }: Props): { subject: string; html: string } {
  const hi = firstName ? firstName : "hola";
  return {
    subject: firstName
      ? `${firstName}, tu primera conversación con María te espera`
      : "Tu primera conversación con María te espera",
    html: emailLayout({
      title: "¿Te ayudamos a empezar con la app?",
      preheader: "3 cosas que puedes hacer hoy en la app de Mente Sana. Entras con tus credenciales del CRM.",
      content: `
        <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;">Un recordatorio amable</p>
        <h1 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;">${hi}, ¿te ayudamos a empezar?</h1>

        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.75;">
          Te dejamos tres cosas concretas que puedes hacer hoy mismo en la app — en menos de cinco minutos.
        </p>

        <!-- Numbered list -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:20px 0;">
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td valign="top" style="width:36px;padding-right:14px;">
                    <span style="display:inline-block;width:28px;height:28px;border-radius:999px;background:rgba(106,23,140,0.10);color:#6A178C;font-weight:700;font-size:13px;text-align:center;line-height:28px;">1</span>
                  </td>
                  <td>
                    <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1a0a1f;">Habla con María</p>
                    <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.55;">Cuéntale cómo estás. Por chat o por voz, cuando quieras, sin esperas.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td valign="top" style="width:36px;padding-right:14px;">
                    <span style="display:inline-block;width:28px;height:28px;border-radius:999px;background:rgba(106,23,140,0.10);color:#6A178C;font-weight:700;font-size:13px;text-align:center;line-height:28px;">2</span>
                  </td>
                  <td>
                    <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1a0a1f;">Apunta cómo te sientes hoy</p>
                    <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.55;">Una emoción de las siete del diario y, si te apetece, una nota breve. En 30 segundos.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td valign="top" style="width:36px;padding-right:14px;">
                    <span style="display:inline-block;width:28px;height:28px;border-radius:999px;background:rgba(106,23,140,0.10);color:#6A178C;font-weight:700;font-size:13px;text-align:center;line-height:28px;">3</span>
                  </td>
                  <td>
                    <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1a0a1f;">Pon una meditación de 5 minutos</p>
                    <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.55;">Elige categoría —ansiedad, sueño, autoestima— y dale al play.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Credentials reminder -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.12);border-radius:14px;padding:16px 18px;">
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.75;line-height:1.6;">
                Entras con <strong style="color:#6A178C;">${email}</strong> y tu contraseña del CRM. La que pongas o cambies en la app vale para ambos sitios.
              </p>
            </td>
          </tr>
        </table>

        <!-- Download buttons -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 20px;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:0 6px;">
                    <a href="${PLAY_STORE}" style="background:#000;color:#ffffff !important;text-decoration:none;display:inline-block;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:600;line-height:1.1;">
                      <span style="font-size:10px;font-weight:400;display:block;opacity:0.85;">Disponible en</span>
                      Google Play
                    </a>
                  </td>
                  <td style="padding:0 6px;">
                    <a href="${APP_LANDING}" style="background:#000;color:#ffffff !important;text-decoration:none;display:inline-block;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:600;line-height:1.1;">
                      <span style="font-size:10px;font-weight:400;display:block;opacity:0.85;">Próximamente en</span>
                      App Store
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 8px;">
          <tr>
            <td align="center">
              <a href="${APP_LANDING}" class="btn-purple" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px;">
                Empezar ahora
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:22px 0 0;font-size:13px;color:#1a0a1f;opacity:0.55;line-height:1.6;text-align:center;">
          ¿Problemas para entrar? <a href="${CRM_LOGIN}" style="color:#6A178C;text-decoration:underline;">Restablece tu contraseña</a> o escríbenos a <a href="mailto:hola@mentesanapsicologia.com" style="color:#6A178C;text-decoration:underline;">hola@mentesanapsicologia.com</a>.
        </p>

        <p style="margin:28px 0 6px;font-size:14px;color:#1a0a1f;opacity:0.75;line-height:1.7;">
          Un abrazo,<br>
          El equipo de Mente Sana
        </p>
      `,
    }),
  };
}
