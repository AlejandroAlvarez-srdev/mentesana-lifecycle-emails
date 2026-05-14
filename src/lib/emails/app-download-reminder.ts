import { emailLayout } from "./layout";

const APP_LANDING = "https://mentesanapsicologia.com/app";
const PLAY_STORE = "https://mentesanapsicologia.com/api/descargar-apk?source=email-reminder";
const CRM_LOGIN = "https://crm.mentesanapsicologia.com/login";

interface Props {
  firstName?: string;
  email: string;
}

const STEPS = [
  { n: "01", title: "Habla con María", body: "Cuéntale cómo estás. Por chat o por voz, cuando quieras, sin esperas.", time: "~2 min" },
  { n: "02", title: "Apunta cómo te sientes hoy", body: "Una emoción de las siete del diario y, si te apetece, una nota breve.", time: "~30 seg" },
  { n: "03", title: "Pon una meditación", body: "Ansiedad, sueño o autoestima. Le das al play y nada más.", time: "~5 min" },
];

export function appDownloadReminderEmail({ firstName, email }: Props): { subject: string; html: string } {
  const hi = firstName || "hola";
  return {
    subject: firstName
      ? `${firstName}, tu primera conversación con María te espera`
      : "Tu primera conversación con María te espera",
    html: emailLayout({
      title: "¿Te ayudamos a empezar con la app?",
      preheader: "3 cosas que puedes hacer hoy en la app de Mente Sana. Entras con tus credenciales del CRM.",
      content: `
        <!-- ════════ HERO MINI ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:-8px 0 28px;">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#FBF4E8 0%,#F0E3F7 100%);border:1px solid rgba(106,23,140,0.15);border-radius:24px;padding:30px 24px;">
              <p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;line-height:1;">empieza por aquí</p>
              <h1 style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.15;color:#1a0a1f;font-weight:400;letter-spacing:-0.4px;">
                ${hi}, hoy puedes<br><em style="color:#6A178C;font-style:italic;">hacer una pequeña cosa.</em>
              </h1>
              <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.7;line-height:1.55;max-width:400px;">
                Tres opciones de menos de cinco minutos cada una. Elige una y la cierras.
              </p>
            </td>
          </tr>
        </table>

        <!-- ════════ POSTER PREVIEW ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 28px;">
          <tr>
            <td align="center">
              <img src="https://mentesanapsicologia.com/images/app/poster-herramientas.jpg" width="360" alt="Mente Sana app — herramientas que transforman tu día" style="display:block;width:100%;max-width:360px;height:auto;border:0;outline:none;text-decoration:none;border-radius:20px;">
            </td>
          </tr>
        </table>

        <!-- ════════ NUMBERED STEPS ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 28px;">
          ${STEPS.map((s) => `
          <tr>
            <td style="padding:8px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid rgba(106,23,140,0.10);border-radius:18px;">
                <tr>
                  <td valign="top" style="width:72px;padding:20px 0 20px 22px;">
                    <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:34px;line-height:1;color:#6A178C;font-weight:500;letter-spacing:-1px;">${s.n}</p>
                  </td>
                  <td valign="middle" style="padding:18px 20px 18px 6px;">
                    <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1a0a1f;line-height:1.3;">${s.title}</p>
                    <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.55;">${s.body}</p>
                  </td>
                  <td valign="top" align="right" style="width:64px;padding:18px 18px 18px 0;">
                    <span style="display:inline-block;font-size:10px;color:#6A178C;background:#FBF4E8;border:1px solid rgba(106,23,140,0.18);border-radius:999px;padding:5px 10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">${s.time}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `).join("")}
        </table>

        <!-- ════════ QUOTE ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 32px;">
          <tr>
            <td align="center">
              <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#6A178C;font-style:italic;line-height:1.45;letter-spacing:-0.2px;max-width:440px;">
                "Hoy es un buen día<br>para empezar."
              </p>
            </td>
          </tr>
        </table>

        <!-- ════════ CTA ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 12px;">
          <tr>
            <td align="center">
              <a href="${APP_LANDING}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:16px 36px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px;letter-spacing:0.1px;box-shadow:0 8px 28px rgba(106,23,140,0.28);">
                Descarga la app gratis →
              </a>
            </td>
          </tr>
        </table>

        <!-- Store badges -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle" style="padding:0 5px;">
                    <a href="${PLAY_STORE}" style="display:inline-block;text-decoration:none;">
                      <img src="https://mentesanapsicologia.com/images/app/google-play-badge.png" alt="Disponible en Google Play" width="124" height="48" style="display:block;width:124px;height:48px;border:0;outline:none;text-decoration:none;">
                    </a>
                  </td>
                  <td valign="middle" style="padding:0 5px;">
                    <a href="${APP_LANDING}" style="display:inline-block;text-decoration:none;">
                      <img src="https://mentesanapsicologia.com/images/app/app-store-badge.png" alt="Próximamente en App Store" width="124" height="41" style="display:block;width:124px;height:41px;border:0;outline:none;text-decoration:none;">
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ════════ CREDENTIALS MICRO ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:14px;padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.75;line-height:1.6;">
                <strong style="color:#6A178C;">Entras con tu cuenta de siempre.</strong> Email <strong>${email}</strong> y la misma contraseña del CRM. La que pongas o cambies en la app vale para los dos.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 6px;font-size:13px;color:#1a0a1f;opacity:0.55;line-height:1.6;text-align:center;">
          ¿Problemas para entrar? <a href="${CRM_LOGIN}" style="color:#6A178C;text-decoration:underline;">Restablece tu contraseña</a> · <a href="mailto:hola@mentesanapsicologia.com" style="color:#6A178C;text-decoration:underline;">hola@mentesanapsicologia.com</a>
        </p>

        <p style="margin:24px 0 0;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;line-height:1;">aquí estamos,</p>
        <p style="margin:6px 0 0;font-size:13px;color:#1a0a1f;opacity:0.55;text-align:center;">El equipo de Mente Sana</p>
      `,
    }),
  };
}
