import { emailLayout } from "./layout";

const APP_LANDING = "https://mentesanapsicologia.com/app";
const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.mentesanapsicologia.com&hl=es_CO";
const MARIA_DEEPLINK = "mentesana://maria";
const MARIA_BLOG = "https://mentesanapsicologia.com/blog/asistente-maria";

interface Props {
  firstName?: string;
  email: string;
}

interface Bubble {
  who: "user" | "maria";
  text: string;
  time: string;
}

// Conversación ampliada — muestra RESOLUCIÓN, no solo apertura.
const CONVO: Bubble[] = [
  {
    who: "user",
    text: "No puedo dormir, llevo horas dando vueltas y son las 3am. Mañana tengo una reunión importante.",
    time: "03:02",
  },
  {
    who: "maria",
    text: "Entiendo, es agotador cuando la mente no para justo cuando más necesitas descansar. ¿Qué es lo que te está dando vueltas ahora mismo?",
    time: "03:02",
  },
  {
    who: "user",
    text: "La reunión de mañana. Tengo miedo de quedarme en blanco.",
    time: "03:03",
  },
  {
    who: "maria",
    text: "Ese miedo a quedarte en blanco es muy común y suele venir de anticipar el peor escenario. Vamos a hacer algo distinto ahora mismo: prueba el ejercicio 4-7-8. Inhala 4 seg, mantén 7 seg, exhala 8 seg. Hazlo 4 veces. ¿Te acompaño contando?",
    time: "03:03",
  },
  {
    who: "user",
    text: "Sí, por favor.",
    time: "03:04",
  },
  {
    who: "maria",
    text: "Perfecto. Inhala…1…2…3…4… mantén…1…2…3…4…5…6…7… suelta lento…1…2…3…4…5…6…7…8… ¿Cómo notas el cuerpo?",
    time: "03:04",
  },
  {
    who: "user",
    text: "Un poco más pesado.",
    time: "03:05",
  },
  {
    who: "maria",
    text: "Eso es tu sistema nervioso bajando revoluciones. Sigue tres más así, con los ojos cerrados. Y mañana, antes de la reunión, hazlo 2 minutos en el baño. Tu cuerpo va a recordar esta señal.",
    time: "03:05",
  },
];

interface UseCase {
  emoji: string;
  time: string;
  title: string;
  body: string;
}

const USE_CASES: UseCase[] = [
  {
    emoji: "🌙",
    time: "3am",
    title: "No puedes dormir",
    body: "María te guía en un ejercicio de relajación de 4 minutos para bajar revoluciones.",
  },
  {
    emoji: "🌆",
    time: "11pm",
    title: "Estrés del trabajo",
    body: "María te ayuda a desconectar antes de dormir, sin llevarte los pendientes a la cama.",
  },
  {
    emoji: "🌤",
    time: "2pm",
    title: "Ansiedad puntual",
    body: "María te ofrece una micro-pausa de 3 minutos donde estés, sin que nadie lo note.",
  },
];

export function appFeatureMariaEmail({ firstName, email }: Props): { subject: string; html: string } {
  const hi = firstName || "hola";
  return {
    subject: firstName
      ? `${firstName}, María está despierta cuando tú no puedes. 💜`
      : "María está despierta cuando tú no puedes. 💜",
    html: emailLayout({
      title: "Conoce a María",
      preheader: "Tu asistente emocional dentro de la app. Disponible 24/7, por chat o por voz.",
      content: `
        <!-- ════════ HERO ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:-8px 0 12px;">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1a0a1f 0%,#2d0d3f 60%,#6A178C 100%);border-radius:24px;padding:34px 24px;">
              <!-- Avatar "M" -->
              <div style="width:72px;height:72px;background:linear-gradient(135deg,#D7B8E3 0%,#ffffff 100%);border-radius:50%;display:inline-block;line-height:72px;text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:34px;color:#6A178C;font-weight:600;box-shadow:0 12px 30px rgba(0,0,0,0.25);">M</div>
              <p style="margin:14px 0 4px;font-family:'Caveat',cursive;font-size:24px;color:#D7B8E3;line-height:1;">tu compañera de bolsillo</p>
              <h1 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:32px;line-height:1.1;color:#ffffff;font-weight:500;letter-spacing:-0.4px;">
                ${hi}, te presento<br>a <em style="color:#D7B8E3;font-style:italic;font-weight:400;">María.</em>
              </h1>
              <p style="margin:0;font-size:14px;color:#ffffff;opacity:0.78;line-height:1.55;max-width:380px;">
                Tu asistente emocional dentro de la app. Por chat o por voz, 24/7.
              </p>

              <!-- Mini badges 24/7 chat voz -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:16px auto 0;">
                <tr>
                  ${["24/7", "chat", "voz"].map((b) => `
                  <td style="padding:0 4px;">
                    <span style="display:inline-block;background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.22);color:#ffffff;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">${b}</span>
                  </td>`).join("")}
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ════════ TAGLINE ════════ -->
        <p style="margin:0 0 28px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;line-height:1.2;">
          Tu mente merece el mismo cuidado que tu cuerpo
        </p>

        <!-- ════════ CHAT MOCKUP ════════ -->
        <p style="margin:0 0 10px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;line-height:1;">así es hablar con ella</p>
        <h2 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.25;color:#1a0a1f;text-align:center;font-weight:400;letter-spacing:-0.2px;">
          Sin guion. <em style="color:#6A178C;font-style:italic;">Como una conversación de verdad.</em>
        </h2>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:20px;margin:0 0 20px;">
          <tr><td style="padding:20px 18px;">
            ${CONVO.map((b) => b.who === "user" ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 10px;">
                <tr>
                  <td width="18%"></td>
                  <td align="right" style="padding-left:14px;">
                    <div style="display:inline-block;background:#ffffff;color:#1a0a1f;border:1px solid rgba(106,23,140,0.30);border-radius:18px 18px 4px 18px;padding:10px 14px;font-size:13px;line-height:1.5;text-align:left;max-width:90%;">${b.text}</div>
                    <p style="margin:4px 4px 0 0;font-size:10px;color:#1a0a1f;opacity:0.4;">${b.time}</p>
                  </td>
                </tr>
              </table>
            ` : `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 10px;">
                <tr>
                  <td width="36" valign="top" style="padding-right:8px;">
                    <div style="width:32px;height:32px;background:#F3EBFA;border-radius:50%;line-height:32px;text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#6A178C;font-weight:600;border:1px solid rgba(106,23,140,0.22);">M</div>
                  </td>
                  <td valign="top">
                    <div style="display:inline-block;background:#F3EBFA;color:#1a0a1f;border:1px solid rgba(106,23,140,0.12);border-radius:18px 18px 18px 4px;padding:10px 14px;font-size:13px;line-height:1.5;max-width:90%;">${b.text}</div>
                    <p style="margin:4px 0 0 4px;font-size:10px;color:#1a0a1f;opacity:0.4;">María · ${b.time}</p>
                  </td>
                  <td width="18%"></td>
                </tr>
              </table>
            `).join("")}
          </td></tr>
        </table>

        <!-- ════════ SOCIAL PROOF ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td style="background:linear-gradient(135deg,#FBF4E8 0%,#F3EBFA 100%);border:1px solid rgba(106,23,140,0.18);border-radius:18px;padding:22px 22px;text-align:center;">
              <p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:20px;color:#6A178C;line-height:1;">no estás sola</p>
              <p style="margin:0;font-size:14px;color:#1a0a1f;line-height:1.6;">
                María ha acompañado a <strong style="color:#6A178C;font-size:16px;">más de 2.000 personas</strong> en momentos difíciles este año. Está disponible <strong style="color:#6A178C;">24/7</strong> dentro de la app.
              </p>
            </td>
          </tr>
        </table>

        <!-- ════════ SAFETY CALLOUT ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td style="background:#ffffff;border:1px solid rgba(106,23,140,0.22);border-left:4px solid #6A178C;border-radius:14px;padding:20px 22px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td valign="top" style="width:44px;padding-right:14px;">
                    <div style="width:36px;height:36px;background:#6A178C;color:#fff;border-radius:10px;font-size:18px;line-height:36px;text-align:center;">🛡</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6A178C;letter-spacing:0.12em;text-transform:uppercase;">María complementa a tu psicóloga</p>
                    <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.82;line-height:1.6;">
                      Si detecta que estás en crisis o necesitas atención clínica, te deriva directamente a tu psicóloga o al <strong style="color:#6A178C;">024</strong>. <strong>Nunca sustituye.</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ════════ USE CASES ════════ -->
        <p style="margin:0 0 10px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;line-height:1;">tres momentos reales</p>
        <h3 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:20px;line-height:1.3;color:#1a0a1f;text-align:center;font-weight:400;letter-spacing:-0.2px;">
          María está ahí <em style="color:#6A178C;font-style:italic;">cuando la vida no espera.</em>
        </h3>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 28px;">
          ${USE_CASES.map((c) => `
            <tr>
              <td style="padding:6px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid rgba(106,23,140,0.10);border-radius:14px;box-shadow:0 4px 14px rgba(106,23,140,0.05);">
                  <tr>
                    <td valign="middle" style="width:56px;padding:16px 0 16px 18px;text-align:center;">
                      <div style="font-size:24px;line-height:1;">${c.emoji}</div>
                    </td>
                    <td valign="middle" style="padding:16px 18px 16px 12px;">
                      <p style="margin:0 0 4px;font-size:14px;line-height:1.3;color:#1a0a1f;">
                        <strong style="color:#6A178C;font-weight:700;">${c.time}</strong>
                        <span style="color:#1a0a1f;opacity:0.55;"> — </span>
                        <strong style="color:#1a0a1f;font-weight:600;">${c.title}</strong>
                      </p>
                      <p style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;line-height:1.5;color:#1a0a1f;opacity:0.72;font-weight:400;">
                        ${c.body}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `).join("")}
        </table>

        <!-- ════════ CTA PRINCIPAL + SECUNDARIO ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 10px;">
          <tr>
            <td align="center">
              <a href="${MARIA_DEEPLINK}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:17px 38px;border-radius:999px;font-weight:700;display:inline-block;font-size:16px;letter-spacing:0.1px;box-shadow:0 8px 28px rgba(106,23,140,0.28);">
                Abrir María ahora en la app →
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 14px;font-size:11px;color:#1a0a1f;opacity:0.5;text-align:center;line-height:1.4;">
          ¿No se abre la app? <a href="${APP_LANDING}" style="color:#6A178C;text-decoration:underline;">Descárgala aquí</a>
        </p>

        <p style="margin:0 0 24px;font-size:13px;color:#1a0a1f;opacity:0.72;text-align:center;line-height:1.55;">
          <a href="${MARIA_BLOG}" style="color:#6A178C;text-decoration:underline;font-weight:600;">Ver más ejemplos de conversación →</a>
        </p>

        <p style="margin:0 0 24px;font-size:12px;color:#1a0a1f;opacity:0.55;text-align:center;line-height:1.55;">
          Entras con <strong style="color:#6A178C;">${email}</strong> y tu contraseña del CRM. Si la cambias en la app, vale también para el CRM.
        </p>

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

        <p style="margin:12px 0 0;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;line-height:1;">nos vemos dentro,</p>
        <p style="margin:6px 0 0;font-size:13px;color:#1a0a1f;opacity:0.55;text-align:center;">El equipo de Mente Sana</p>
      `,
    }),
  };
}
