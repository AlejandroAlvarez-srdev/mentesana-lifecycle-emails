import { emailLayout } from "./layout";

// Deep-links (principal) + fallback web (para clientes que bloquean esquemas custom)
const DEEPLINK_AGENDA = "mentesana://agenda";
const WEB_AGENDA = "https://mentesanapsicologia.com/dashboard/agenda";

const DEEPLINK_DIARIO = "mentesana://diario";
const WEB_DIARIO = "https://mentesanapsicologia.com/dashboard/diario";

const DEEPLINK_PROFILE = "mentesana://profile";
const WEB_PROFILE = "https://mentesanapsicologia.com/dashboard/profile";

const APP_DEMO = "https://mentesanapsicologia.com/app-demo";
const CRM_LOGIN = "https://crm.mentesanapsicologia.com/login";

// Assets (con fallback a poster-bienestar.jpg si no existen los específicos)
const HERO_ONBOARDING = "https://mentesanapsicologia.com/images/app/onboarding-hero.gif";
const SCREEN_AGENDA = "https://mentesanapsicologia.com/images/app/screenshot-agenda.jpg";
const SCREEN_DIARIO = "https://mentesanapsicologia.com/images/app/screenshot-diario.jpg";
const POSTER_FALLBACK = "https://mentesanapsicologia.com/images/app/poster-bienestar.jpg";

interface Props {
  firstName?: string;
  email: string;
}

export function appDownloadReminderEmail({ firstName, email }: Props): { subject: string; html: string } {
  const hi = firstName || "hola";
  return {
    subject: "Tu app te espera. Tu psicóloga también. 💜 (+5€ por empezar hoy)",
    html: emailLayout({
      title: "Empieza hoy: agenda tu 1ª sesión o abre tu diario",
      preheader: "En 2 minutos tienes cita agendada + 5€ de crédito por completar tu perfil.",
      content: `
        <!-- ════════ HERO ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:-8px 0 22px;">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#FBF4E8 0%,#F0E3F7 100%);border:1px solid rgba(106,23,140,0.15);border-radius:24px;padding:30px 24px;">
              <p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;line-height:1;">tu app ya está lista</p>
              <h1 style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.15;color:#1a0a1f;font-weight:400;letter-spacing:-0.4px;">
                ${hi}, empieza con<br><em style="color:#6A178C;font-style:italic;">dos gestos hoy.</em>
              </h1>
              <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.7;line-height:1.55;max-width:400px;">
                Uno para tu psicóloga. Otro para ti. Menos de 3 minutos en total.
              </p>
            </td>
          </tr>
        </table>

        <!-- ════════ ONBOARDING HERO GIF ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 22px;">
          <tr>
            <td align="center">
              <img src="${HERO_ONBOARDING}" alt="Onboarding de la app Mente Sana" style="display:block;width:100%;max-width:520px;height:auto;border:0;outline:none;text-decoration:none;border-radius:20px;" onerror="this.src='${POSTER_FALLBACK}'">
            </td>
          </tr>
        </table>

        <!-- ════════ BANDA URGENCIA SUAVE ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 22px;">
          <tr>
            <td align="center" style="background:#FFF4E8;border:1px solid rgba(230,126,34,0.25);border-left:3px solid #E67E22;border-radius:10px;padding:12px 18px;">
              <p style="margin:0;font-size:13px;color:#8A4A0F;line-height:1.5;font-weight:500;">
                ⏱ Los primeros 7 días son los más importantes. Cuanto antes empiezas, antes sientes el cambio.
              </p>
            </td>
          </tr>
        </table>

        <!-- ════════ FEATURE 1 — AGENDAR ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 14px;">
          <tr>
            <td style="background:#ffffff;border:1.5px solid rgba(106,23,140,0.18);border-radius:20px;padding:26px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p style="margin:0;font-size:48px;line-height:1;">📅</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:6px;">
                    <h2 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#6A178C;font-weight:500;line-height:1.25;letter-spacing:-0.2px;">
                      Agendar tu 1ª sesión
                    </h2>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <p style="margin:0;font-family:'Inter',sans-serif;font-size:14px;color:#1a0a1f;opacity:0.75;line-height:1.55;max-width:380px;">
                      En 2 min tienes cita con tu psicóloga. Elige día y hora que te venga bien.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${DEEPLINK_AGENDA}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:14px 30px;border-radius:999px;font-weight:700;display:inline-block;font-size:14px;letter-spacing:0.1px;box-shadow:0 6px 20px rgba(106,23,140,0.22);">
                      Agendar mi 1ª sesión ahora →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;">
                    <a href="${WEB_AGENDA}" style="font-size:11px;color:#6A178C;opacity:0.65;text-decoration:underline;">Abrir en la web</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Demo visual feature 1 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 26px;">
          <tr>
            <td align="center">
              <img src="${SCREEN_AGENDA}" alt="Interfaz de agenda de Mente Sana" width="280" style="display:block;width:100%;max-width:280px;height:auto;border:0;outline:none;text-decoration:none;border-radius:14px;box-shadow:0 4px 18px rgba(106,23,140,0.10);" onerror="this.src='${POSTER_FALLBACK}'">
              <p style="margin:8px 0 0;font-family:'Caveat',cursive;font-size:16px;color:#6A178C;opacity:0.75;line-height:1;">Interfaz de agenda</p>
            </td>
          </tr>
        </table>

        <!-- ════════ FEATURE 2 — DIARIO ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 14px;">
          <tr>
            <td style="background:#ffffff;border:1.5px solid rgba(106,23,140,0.18);border-radius:20px;padding:26px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p style="margin:0;font-size:48px;line-height:1;">📓</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:6px;">
                    <h2 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#6A178C;font-weight:500;line-height:1.25;letter-spacing:-0.2px;">
                      Empezar tu diario emocional
                    </h2>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <p style="margin:0;font-family:'Inter',sans-serif;font-size:14px;color:#1a0a1f;opacity:0.75;line-height:1.55;max-width:380px;">
                      Registra hoy cómo te sientes. En 7 días tendrás tu primera lectura de patrones.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${DEEPLINK_DIARIO}" style="background:#FFFAF2;color:#6A178C !important;text-decoration:none;padding:14px 30px;border-radius:999px;font-weight:700;display:inline-block;font-size:14px;letter-spacing:0.1px;border:2px solid #6A178C;">
                      Prefiero empezar por el diario →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;">
                    <a href="${WEB_DIARIO}" style="font-size:11px;color:#6A178C;opacity:0.65;text-decoration:underline;">Abrir en la web</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Demo visual feature 2 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 30px;">
          <tr>
            <td align="center">
              <img src="${SCREEN_DIARIO}" alt="Tu diario emocional en la app" width="280" style="display:block;width:100%;max-width:280px;height:auto;border:0;outline:none;text-decoration:none;border-radius:14px;box-shadow:0 4px 18px rgba(106,23,140,0.10);" onerror="this.src='${POSTER_FALLBACK}'">
              <p style="margin:8px 0 0;font-family:'Caveat',cursive;font-size:16px;color:#6A178C;opacity:0.75;line-height:1;">Tu diario emocional</p>
            </td>
          </tr>
        </table>

        <!-- ════════ INCENTIVO 5€ CRÉDITO ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 28px;">
          <tr>
            <td style="background:linear-gradient(135deg,#FFF8E5 0%,#FFEFC7 100%);border:1.5px solid #D4AF37;border-radius:18px;padding:22px 22px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <span style="display:inline-block;background:#D4AF37;color:#ffffff;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:5px 12px;border-radius:999px;">🎁 Regalo de bienvenida</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:19px;color:#1a0a1f;line-height:1.4;max-width:420px;">
                      Completa tu perfil hoy <em style="color:#8A4A0F;">(2 minutos)</em> y recibe <strong style="color:#8A4A0F;">5€ de crédito</strong> para tu próxima sesión con tu psicóloga.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${DEEPLINK_PROFILE}" style="background:#8A4A0F;color:#ffffff !important;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:700;display:inline-block;font-size:14px;letter-spacing:0.1px;">
                      Completar mi perfil (2 min) →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;">
                    <a href="${WEB_PROFILE}" style="font-size:11px;color:#8A4A0F;opacity:0.75;text-decoration:underline;">Abrir en la web</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ════════ QUOTE ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 26px;">
          <tr>
            <td align="center">
              <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#6A178C;font-style:italic;line-height:1.45;letter-spacing:-0.2px;max-width:440px;">
                "Hoy es un buen día<br>para empezar."
              </p>
            </td>
          </tr>
        </table>

        <!-- ════════ CREDENCIALES MICRO ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 20px;">
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:14px;padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.75;line-height:1.6;">
                <strong style="color:#6A178C;">Entras con tu cuenta de siempre.</strong> Email <strong>${email}</strong> y la misma contraseña del CRM.
              </p>
            </td>
          </tr>
        </table>

        <!-- ════════ CTA TERCIARIO (footer) ════════ -->
        <p style="margin:0 0 6px;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.6;text-align:center;">
          <a href="${APP_DEMO}" style="color:#6A178C;text-decoration:underline;font-weight:600;">Ver cómo funciona la app en 30 seg →</a>
        </p>
        <p style="margin:0 0 6px;font-size:12px;color:#1a0a1f;opacity:0.5;line-height:1.6;text-align:center;">
          ¿Problemas para entrar? <a href="${CRM_LOGIN}" style="color:#6A178C;text-decoration:underline;">Restablece tu contraseña</a> · <a href="mailto:hola@mentesanapsicologia.com" style="color:#6A178C;text-decoration:underline;">hola@mentesanapsicologia.com</a>
        </p>

        <p style="margin:24px 0 0;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;line-height:1;">aquí estamos,</p>
        <p style="margin:6px 0 0;font-size:13px;color:#1a0a1f;opacity:0.55;text-align:center;">El equipo de Mente Sana</p>
      `,
    }),
  };
}
