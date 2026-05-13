import { emailLayout } from "./layout";

const APP_LANDING = "https://mentesanapsicologia.com/app";
const PLAY_STORE = "https://play.google.com/apps/test/RQ8n4STdUPo/ahAO29uNSE9o0orDKNNhreru91RxZBP633w_YDN-L1KDWTbT3ybuUSlreTQWz3f4CjKs-ZIO2HoR-gKutjYXYDqKTC";

interface Props {
  firstName?: string;
  email: string;
}

export function appFeatureMariaEmail({ firstName, email }: Props): { subject: string; html: string } {
  const hi = firstName ? firstName : "hola";
  return {
    subject: firstName
      ? `${firstName}, te presento a María — tu asistente emocional 24/7`
      : "Te presento a María — tu asistente emocional 24/7",
    html: emailLayout({
      title: "Conoce a María",
      preheader: "Tu asistente emocional dentro de la app. Disponible 24/7, por chat o por voz.",
      content: `
        <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;">Una compañera que siempre está</p>
        <h1 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;">${hi}, te presento a <em style="color:#6A178C;">María</em></h1>

        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.75;">
          María es tu asistente emocional dentro de la app de Mente Sana. Está disponible las 24 horas, los 7 días de la semana, por chat o por voz, para cuando necesitas desahogarte, ordenar tus pensamientos o tener un primer apoyo.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
          <tr>
            <td style="background:linear-gradient(135deg,#FBF4E8 0%,#F0E3F7 100%);border:1px solid rgba(106,23,140,0.18);border-radius:18px;padding:22px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6A178C;letter-spacing:0.06em;text-transform:uppercase;">Importante</p>
              <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.8;line-height:1.65;">
                María nunca sustituye a tu psicóloga. Cuando detecta que lo que cuentas necesita atención clínica, te deriva directamente a una profesional humana del equipo.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 12px;font-size:14px;color:#1a0a1f;opacity:0.65;line-height:1.6;">
          Algunas cosas para empezar a hablar con ella:
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td style="padding:10px 0;">
              <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.8;line-height:1.55;">— "He tenido un día complicado, ¿puedo contártelo?"</p>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-top:1px solid rgba(0,0,0,0.06);">
              <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.8;line-height:1.55;">— "Me cuesta dormir, dame algo que me ayude."</p>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-top:1px solid rgba(0,0,0,0.06);">
              <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.8;line-height:1.55;">— "Estoy nerviosa antes de una reunión, ¿qué hago?"</p>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-top:1px solid rgba(0,0,0,0.06);">
              <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.8;line-height:1.55;">— "Quiero ordenar lo que siento antes de mi próxima sesión."</p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 16px;">
          <tr>
            <td align="center">
              <a href="${APP_LANDING}" class="btn-purple" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px;">
                Hablar con María ahora
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 18px;font-size:12px;color:#1a0a1f;opacity:0.5;text-align:center;line-height:1.55;">
          Entras en la app con <strong style="color:#6A178C;">${email}</strong> y tu contraseña del CRM. Si la cambias en la app, vale también para el CRM.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 16px;">
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

        <p style="margin:28px 0 6px;font-size:14px;color:#1a0a1f;opacity:0.75;line-height:1.7;">
          Un abrazo,<br>
          El equipo de Mente Sana
        </p>
      `,
    }),
  };
}
