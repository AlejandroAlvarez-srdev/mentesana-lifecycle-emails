import { emailLayout } from "./layout";

const APP_LANDING = "https://mentesanapsicologia.com/app";
const PLAY_STORE = "https://play.google.com/apps/test/RQ8n4STdUPo/ahAO29uNSE9o0orDKNNhreru91RxZBP633w_YDN-L1KDWTbT3ybuUSlreTQWz3f4CjKs-ZIO2HoR-gKutjYXYDqKTC";

interface Props {
  firstName?: string;
  email: string;
}

interface Bubble {
  who: "user" | "maria";
  text: string;
  time: string;
}

const CONVO: Bubble[] = [
  { who: "user", text: "Hoy he tenido un día complicado. ¿Puedo contártelo?", time: "23:14" },
  { who: "maria", text: "Claro. Cuéntame lo que necesites, voy a estar aquí.", time: "23:14" },
  { who: "user", text: "No consigo desconectar del curro. Llevo así toda la semana.", time: "23:15" },
  { who: "maria", text: "Eso suena agotador. ¿Quieres que lo ordenemos juntas o prefieres que te proponga un ejercicio para bajar el ritmo antes de dormir?", time: "23:15" },
];

const STARTERS = [
  "He tenido un día complicado, ¿puedo contártelo?",
  "Me cuesta dormir, dame algo que me ayude.",
  "Estoy nerviosa antes de una reunión, ¿qué hago?",
  "Quiero ordenar lo que siento antes de mi sesión.",
];

export function appFeatureMariaEmail({ firstName, email }: Props): { subject: string; html: string } {
  const hi = firstName || "hola";
  return {
    subject: firstName
      ? `${firstName}, te presento a María — tu asistente emocional 24/7`
      : "Te presento a María — tu asistente emocional 24/7",
    html: emailLayout({
      title: "Conoce a María",
      preheader: "Tu asistente emocional dentro de la app. Disponible 24/7, por chat o por voz.",
      content: `
        <!-- ════════ HERO ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:-8px 0 24px;">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1a0a1f 0%,#2d0d3f 60%,#6A178C 100%);border-radius:24px;padding:34px 24px;">
              <!-- "Avatar" -->
              <div style="width:72px;height:72px;background:linear-gradient(135deg,#D7B8E3 0%,#ffffff 100%);border-radius:50%;display:inline-block;line-height:72px;text-align:center;font-size:32px;box-shadow:0 12px 30px rgba(0,0,0,0.25);">💜</div>
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

        <!-- ════════ CHAT MOCKUP ════════ -->
        <p style="margin:0 0 10px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;line-height:1;">así es hablar con ella</p>
        <h2 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.25;color:#1a0a1f;text-align:center;font-weight:400;letter-spacing:-0.2px;">
          Sin guion. <em style="color:#6A178C;font-style:italic;">Como una conversación de verdad.</em>
        </h2>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:20px;margin:0 0 28px;">
          <tr><td style="padding:20px 18px;">
            ${CONVO.map((b) => b.who === "user" ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 8px;">
                <tr>
                  <td width="20%"></td>
                  <td align="right" style="padding-left:14px;">
                    <div style="display:inline-block;background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff;border-radius:18px 18px 4px 18px;padding:10px 14px;font-size:13px;line-height:1.45;text-align:left;max-width:90%;">${b.text}</div>
                    <p style="margin:4px 4px 0 0;font-size:10px;color:#1a0a1f;opacity:0.4;">${b.time}</p>
                  </td>
                </tr>
              </table>
            ` : `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 8px;">
                <tr>
                  <td width="36" valign="top" style="padding-right:8px;">
                    <div style="width:32px;height:32px;background:linear-gradient(135deg,#D7B8E3 0%,#ffffff 100%);border-radius:50%;line-height:32px;text-align:center;font-size:14px;border:1px solid rgba(106,23,140,0.18);">💜</div>
                  </td>
                  <td valign="top">
                    <div style="display:inline-block;background:#ffffff;color:#1a0a1f;border:1px solid rgba(0,0,0,0.06);border-radius:18px 18px 18px 4px;padding:10px 14px;font-size:13px;line-height:1.45;max-width:90%;">${b.text}</div>
                    <p style="margin:4px 0 0 4px;font-size:10px;color:#1a0a1f;opacity:0.4;">María · ${b.time}</p>
                  </td>
                  <td width="20%"></td>
                </tr>
              </table>
            `).join("")}
          </td></tr>
        </table>

        <!-- ════════ SAFETY CALLOUT ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 28px;">
          <tr>
            <td style="background:linear-gradient(135deg,#FBF4E8 0%,#F0E3F7 100%);border:1px solid rgba(106,23,140,0.22);border-radius:18px;padding:22px 22px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td valign="top" style="width:44px;padding-right:14px;">
                    <div style="width:36px;height:36px;background:#6A178C;color:#fff;border-radius:10px;font-size:18px;line-height:36px;text-align:center;">🛡</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6A178C;letter-spacing:0.12em;text-transform:uppercase;">María nunca sustituye a tu psicóloga</p>
                    <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.78;line-height:1.6;">
                      Cuando detecta que lo que cuentas necesita atención clínica, te deriva directamente a una profesional humana del equipo. Tus datos están cifrados y solo tu psicóloga asignada los ve.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ════════ POSTER PREVIEW ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 28px;">
          <tr>
            <td align="center">
              <img src="https://mentesanapsicologia.com/images/app/poster-psicologa.jpg" width="360" alt="Mente Sana app — tu psicóloga asignada, no estás sola" style="display:block;width:100%;max-width:360px;height:auto;border:0;outline:none;text-decoration:none;border-radius:20px;">
            </td>
          </tr>
        </table>

        <!-- ════════ STARTERS ════════ -->
        <p style="margin:0 0 14px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;line-height:1;">por dónde empezar</p>
        <h3 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:20px;line-height:1.3;color:#1a0a1f;text-align:center;font-weight:400;letter-spacing:-0.2px;">
          Copia y pega cualquiera<br><em style="color:#6A178C;font-style:italic;">de estas frases.</em>
        </h3>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 28px;">
          ${STARTERS.map((s, i) => `
            <tr>
              <td style="padding:6px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid rgba(106,23,140,0.10);border-radius:14px;">
                  <tr>
                    <td valign="middle" style="width:40px;padding:14px 0 14px 18px;">
                      <span style="display:inline-block;width:24px;height:24px;background:rgba(106,23,140,0.10);color:#6A178C;border-radius:50%;font-size:11px;font-weight:700;line-height:24px;text-align:center;">${i + 1}</span>
                    </td>
                    <td valign="middle" style="padding:14px 18px 14px 8px;">
                      <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:15px;line-height:1.4;color:#1a0a1f;font-style:italic;">"${s}"</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `).join("")}
        </table>

        <!-- ════════ CTA ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 14px;">
          <tr>
            <td align="center">
              <a href="${APP_LANDING}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:17px 38px;border-radius:999px;font-weight:700;display:inline-block;font-size:16px;letter-spacing:0.1px;box-shadow:0 8px 28px rgba(106,23,140,0.28);">
                Descarga la app gratis →
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 24px;font-size:12px;color:#1a0a1f;opacity:0.55;text-align:center;line-height:1.55;">
          Entras con <strong style="color:#6A178C;">${email}</strong> y tu contraseña del CRM. Si la cambias en la app, vale también para el CRM.
        </p>

        <!-- Store badges -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:0 4px;">
                    <a href="${PLAY_STORE}" style="background:#000;color:#fff !important;text-decoration:none;display:inline-block;padding:8px 14px;border-radius:10px;font-size:11px;font-weight:600;line-height:1.1;text-align:left;">
                      <span style="font-size:8px;font-weight:400;display:block;opacity:0.85;">Disponible en</span>
                      Google Play
                    </a>
                  </td>
                  <td style="padding:0 4px;">
                    <a href="${APP_LANDING}" style="background:#000;color:#fff !important;text-decoration:none;display:inline-block;padding:8px 14px;border-radius:10px;font-size:11px;font-weight:600;line-height:1.1;text-align:left;">
                      <span style="font-size:8px;font-weight:400;display:block;opacity:0.85;">Próximamente</span>
                      App Store
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
