import { emailLayout } from "./layout";

const APP_LANDING = "https://mentesanapsicologia.com/app";
const APP_DEMO = "https://mentesanapsicologia.com/app-demo";
const IOS_WAITLIST = "https://mentesanapsicologia.com/app/ios-waitlist";
const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.mentesanapsicologia.com&hl=es_CO";
const CRM_LOGIN = "https://crm.mentesanapsicologia.com/login";

const PLAY_STORE_BADGE = "https://mentesanapsicologia.com/images/app/google-play-badge.png";
const APP_STORE_BADGE = "https://mentesanapsicologia.com/images/app/app-store-badge.png";
const DEMO_POSTER = "https://mentesanapsicologia.com/images/app-demo-poster.jpg";

interface Props {
  firstName?: string;
  email: string;
}

interface Feature {
  emoji: string;
  title: string;
  body: string;
}

// Top 3 features con mayor conversión (pptx "Resumen Mailings MS", email #7)
const FEATURES: Feature[] = [
  {
    emoji: "📞",
    title: "Sesiones en videollamada con tu psicóloga",
    body: "Directo desde la app, sin bajar apps de terceros.",
  },
  {
    emoji: "🤖",
    title: "Asistente María 24/7",
    body: "IA que te acompaña en momentos difíciles a cualquier hora.",
  },
  {
    emoji: "📓",
    title: "Diario emocional + meditaciones guiadas",
    body: "Registra cómo te sientes cada día y accede a +200 audios.",
  },
];

export function appDownloadInvitationEmail({ firstName, email }: Props): { subject: string; html: string } {
  const hi = firstName || "hola";

  const featureBlocks = FEATURES.map((f) => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 14px;background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:14px;">
      <tr>
        <td valign="top" width="56" style="padding:16px 0 16px 16px;font-size:32px;line-height:1;">${f.emoji}</td>
        <td valign="top" style="padding:16px 16px 16px 10px;">
          <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:20px;line-height:1.25;color:#6A178C;font-weight:500;letter-spacing:-0.3px;">${f.title}</p>
          <p style="margin:0;font-family:'Inter',-apple-system,sans-serif;font-size:14px;line-height:1.55;color:#1a0a1f;opacity:0.7;">${f.body}</p>
        </td>
      </tr>
    </table>
  `).join("");

  return {
    subject: firstName
      ? `${firstName}, tu app te está esperando (5€ crédito por descargar hoy) 💜`
      : "Tu app te está esperando (5€ crédito por descargar hoy) 💜",
    html: emailLayout({
      title: "Descarga la app de Mente Sana",
      preheader: "Tu psicóloga, María 24/7 y tu diario emocional. Todo en la app.",
      content: `
        <!-- ════════ HERO ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:-8px 0 20px;">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1a0a1f 0%,#2d0d3f 50%,#4A2368 100%);border-radius:24px;padding:32px 24px;">
              <h1 style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.15;color:#ffffff;font-weight:500;letter-spacing:-0.5px;">
                ${hi}, tu Mente Sana<br><em style="color:#D7B8E3;font-style:italic;font-weight:400;">cabe en el bolsillo.</em>
              </h1>
              <p style="margin:0;font-family:'Caveat',cursive;font-size:24px;color:#D7B8E3;line-height:1.2;text-align:center;">
                Tu mente merece el mismo cuidado que tu cuerpo
              </p>
            </td>
          </tr>
        </table>

        <!-- ════════ INTRO ════════ -->
        <p style="margin:0 0 24px;font-family:'Inter',-apple-system,sans-serif;font-size:15px;line-height:1.65;color:#1a0a1f;opacity:0.78;text-align:center;">
          Sin esperas. Donde estés. Cuando lo necesites.
        </p>

        <!-- ════════ 3 FEATURES ════════ -->
        <p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;line-height:1;">qué encuentras dentro</p>
        <h2 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.3;color:#1a0a1f;text-align:center;font-weight:400;letter-spacing:-0.3px;">
          Tres herramientas, <em style="color:#6A178C;font-style:italic;">una sola app.</em>
        </h2>
        ${featureBlocks}

        <!-- ════════ VIDEO DEMO PLACEHOLDER (30 seg) ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:20px 0 8px;">
          <tr>
            <td align="center">
              <a href="${APP_DEMO}" style="display:block;text-decoration:none;position:relative;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:440px;border-radius:18px;overflow:hidden;">
                  <tr>
                    <td align="center" background="${DEMO_POSTER}" style="background:#2d0d3f url('${DEMO_POSTER}') center/cover no-repeat;border-radius:18px;padding:60px 20px;">
                      <!-- Play button overlay -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                        <tr>
                          <td align="center" valign="middle" width="72" height="72" style="width:72px;height:72px;background:#ffffff;border-radius:36px;box-shadow:0 8px 24px rgba(0,0,0,0.35);font-size:28px;line-height:72px;color:#6A178C;">
                            ▶
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 28px;font-family:'Inter',-apple-system,sans-serif;font-size:13px;line-height:1.5;color:#1a0a1f;opacity:0.6;text-align:center;">
          <a href="${APP_DEMO}" style="color:#6A178C;text-decoration:none;">Ver en 30 segundos cómo funciona →</a>
        </p>

        <!-- ════════ ANDROID / iOS 2 COLUMNAS ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <!-- Android -->
            <td valign="top" width="50%" style="padding:6px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:14px;height:100%;">
                <tr>
                  <td align="center" style="padding:18px 14px;">
                    <p style="margin:0 0 10px;font-family:'Inter',-apple-system,sans-serif;font-size:11px;font-weight:700;color:#6A178C;letter-spacing:0.12em;text-transform:uppercase;">Android · disponible ya</p>
                    <a href="${PLAY_STORE}" style="display:inline-block;text-decoration:none;">
                      <img src="${PLAY_STORE_BADGE}" alt="Descargar en Google Play" width="140" height="54" style="display:block;width:140px;height:54px;border:0;outline:none;text-decoration:none;">
                    </a>
                    <p style="margin:10px 0 0;font-family:'Inter',-apple-system,sans-serif;font-size:13px;line-height:1.45;color:#1a0a1f;opacity:0.75;">
                      <a href="${PLAY_STORE}" style="color:#6A178C;text-decoration:none;font-weight:600;">Descargar en Google Play →</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
            <!-- iOS -->
            <td valign="top" width="50%" style="padding:6px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#FBF4E8 0%,#F0E3F7 100%);border:1px solid rgba(106,23,140,0.22);border-radius:14px;height:100%;">
                <tr>
                  <td align="center" style="padding:18px 14px;">
                    <p style="margin:0 0 10px;font-family:'Inter',-apple-system,sans-serif;font-size:11px;font-weight:700;color:#6A178C;letter-spacing:0.12em;text-transform:uppercase;">iOS · en 5 días</p>
                    <a href="${IOS_WAITLIST}" style="display:inline-block;text-decoration:none;">
                      <img src="${APP_STORE_BADGE}" alt="Próximamente en App Store" width="140" height="47" style="display:block;width:140px;height:47px;border:0;outline:none;text-decoration:none;">
                    </a>
                    <p style="margin:10px 0 0;font-family:'Inter',-apple-system,sans-serif;font-size:13px;line-height:1.45;color:#1a0a1f;opacity:0.85;">
                      Apúntate para acceso prioritario y desbloquea <strong style="color:#6A178C;">5€ de crédito</strong> para tu próxima sesión.
                    </p>
                    <p style="margin:8px 0 0;font-family:'Inter',-apple-system,sans-serif;font-size:12px;line-height:1.45;">
                      <a href="${IOS_WAITLIST}" style="color:#6A178C;text-decoration:underline;font-weight:600;">Apúntate a la waitlist →</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 24px;font-family:'Inter',-apple-system,sans-serif;font-size:12px;line-height:1.55;color:#1a0a1f;opacity:0.6;text-align:center;">
          Los primeros 100 en apuntarse reciben acceso prioritario + 5€ de crédito.
        </p>

        <!-- ════════ URGENCIA — BANDA NARANJA ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#FF8A3D 0%,#FF6B1A 100%);border-radius:10px;padding:12px 16px;">
              <p style="margin:0;font-family:'Inter',-apple-system,sans-serif;font-size:13px;font-weight:600;color:#ffffff;line-height:1.4;letter-spacing:0.1px;">
                ⏱ Descarga esta semana y desbloquea 5€ de crédito para tu 2ª sesión.
              </p>
            </td>
          </tr>
        </table>

        <!-- ════════ PRIMARY CTA ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 10px;">
          <tr>
            <td align="center">
              <a href="${PLAY_STORE}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:16px 34px;border-radius:999px;font-weight:700;display:inline-block;font-size:16px;letter-spacing:0.1px;box-shadow:0 8px 30px rgba(106,23,140,0.28);">
                Descargar la app ahora →
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 28px;font-family:'Inter',-apple-system,sans-serif;font-size:13px;color:#1a0a1f;opacity:0.6;text-align:center;line-height:1.55;">
          <a href="${APP_DEMO}" style="color:#6A178C;text-decoration:underline;">Ver el vídeo antes →</a>
        </p>

        <!-- ════════ CREDENCIALES (compacto) ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:14px;padding:16px 18px;">
              <p style="margin:0 0 4px;font-family:'Inter',-apple-system,sans-serif;font-size:11px;font-weight:700;color:#6A178C;letter-spacing:0.12em;text-transform:uppercase;">🔑 Una sola cuenta</p>
              <p style="margin:0;font-family:'Inter',-apple-system,sans-serif;font-size:14px;line-height:1.55;color:#1a0a1f;opacity:0.78;">
                Entra con tu email <strong style="color:#6A178C;">${email}</strong> y la misma contraseña del CRM. ¿No la recuerdas? <a href="${CRM_LOGIN}" style="color:#6A178C;text-decoration:underline;">Restablécela aquí</a>.
              </p>
            </td>
          </tr>
        </table>

        <!-- ════════ FIRMA ════════ -->
        <p style="margin:0;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;line-height:1;">un abrazo,</p>
        <p style="margin:6px 0 0;font-family:'Inter',-apple-system,sans-serif;font-size:13px;color:#1a0a1f;opacity:0.55;text-align:center;">El equipo de Mente Sana</p>
      `,
    }),
  };
}
