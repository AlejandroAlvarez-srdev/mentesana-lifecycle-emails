import { emailLayout } from "./layout";

const APP_LANDING = "https://mentesanapsicologia.com/app";
const PLAY_STORE = "https://play.google.com/apps/test/RQ8n4STdUPo/ahAO29uNSE9o0orDKNNhreru91RxZBP633w_YDN-L1KDWTbT3ybuUSlreTQWz3f4CjKs-ZIO2HoR-gKutjYXYDqKTC";
const CRM_LOGIN = "https://crm.mentesanapsicologia.com/login";

interface Props {
  firstName?: string;
  email: string;
}

interface Feature {
  emoji: string;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  { emoji: "🎥", title: "Sesiones con tu psicóloga", body: "Reserva, mueve o cancela la videoconsulta en dos toques. Consulta tus bonos y citas." },
  { emoji: "💬", title: "Asistente María 24/7", body: "Chat o voz cuando necesites. Si requieres atención clínica, te deriva a una profesional humana." },
  { emoji: "📔", title: "Diario emocional", body: "7 emociones, notas, fotos y una gráfica semanal con tu evolución." },
  { emoji: "🎧", title: "Audiolibros de psicología", body: "Walter Riso, Robin Sharma, Carnegie y nuevos títulos cada mes. Velocidad ajustable." },
  { emoji: "🧘", title: "Meditaciones guiadas", body: "Categorías: ansiedad, sueño, autoestima, mindfulness. Estilo Spotify, progreso guardado." },
  { emoji: "🎓", title: "12 cursos en video", body: "123 lecciones de Antonella, Gabriela y Marlen. Dependencia emocional, ansiedad, autoestima y más." },
  { emoji: "👥", title: "Talleres en directo", body: "Sesiones grupales por videollamada incluidas en tu Bono. Plaza limitada." },
  { emoji: "🎁", title: "Comparte y Gana", body: "Tu código de referido te da créditos cada vez que un amigo contrata su primer Bono." },
];

export function appDownloadInvitationEmail({ firstName, email }: Props): { subject: string; html: string } {
  const hi = firstName || "hola";
  const featureRows = pairs(FEATURES).map((row) => `
    <tr>
      ${row.map((f) => f ? `
        <td valign="top" width="50%" style="padding:6px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:14px;">
            <tr><td style="padding:16px;">
              <p style="margin:0 0 6px;font-size:20px;line-height:1;">${f.emoji}</p>
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1a0a1f;line-height:1.3;">${f.title}</p>
              <p style="margin:0;font-size:12px;color:#1a0a1f;opacity:0.62;line-height:1.5;">${f.body}</p>
            </td></tr>
          </table>
        </td>
      ` : `<td width="50%" style="padding:6px;"></td>`).join("")}
    </tr>
  `).join("");

  return {
    subject: firstName
      ? `${firstName}, tu Mente Sana ahora cabe en el bolsillo`
      : "Tu Mente Sana ahora cabe en el bolsillo",
    html: emailLayout({
      title: "Descarga la app de Mente Sana",
      preheader: "Sesiones, María, diario, audiolibros, meditaciones, cursos y talleres — con tu mismo email y contraseña del CRM.",
      content: `
        <!-- ════════ HERO ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:-8px 0 24px;">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#1a0a1f 0%,#2d0d3f 50%,#4A2368 100%);border-radius:24px;padding:36px 28px;">
              <p style="margin:0 0 4px;font-family:'Caveat',cursive;font-size:24px;color:#D7B8E3;line-height:1;">por fin está aquí</p>
              <h1 style="margin:0 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:32px;line-height:1.12;color:#ffffff;font-weight:500;letter-spacing:-0.5px;">
                Tu Mente Sana<br>ahora cabe en<br><em style="color:#D7B8E3;font-style:italic;font-weight:400;">el bolsillo.</em>
              </h1>
              <p style="margin:0 0 18px;font-size:14px;color:#ffffff;opacity:0.72;line-height:1.55;max-width:380px;">
                Tu psicóloga, María, tu diario, audiolibros, meditaciones, cursos y talleres — en una sola app.
              </p>

              <!-- Store badges -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 5px;">
                    <a href="${PLAY_STORE}" style="background:#000;color:#fff !important;text-decoration:none;display:inline-block;padding:10px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.18);font-size:12px;font-weight:600;line-height:1.1;text-align:left;">
                      <span style="font-size:9px;font-weight:400;display:block;opacity:0.8;">Disponible en</span>
                      Google Play
                    </a>
                  </td>
                  <td style="padding:0 5px;">
                    <a href="${APP_LANDING}" style="background:#000;color:#fff !important;text-decoration:none;display:inline-block;padding:10px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.18);font-size:12px;font-weight:600;line-height:1.1;text-align:left;">
                      <span style="font-size:9px;font-weight:400;display:block;opacity:0.8;">Próximamente</span>
                      App Store
                    </a>
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
              <img src="https://mentesanapsicologia.com/images/app/poster-bienestar.jpg" width="360" alt="Mente Sana app — tu bienestar en un solo lugar" style="display:block;width:100%;max-width:360px;height:auto;border:0;outline:none;text-decoration:none;border-radius:20px;">
            </td>
          </tr>
        </table>

        <!-- ════════ INTRO ════════ -->
        <p style="margin:0 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.3;color:#1a0a1f;font-weight:400;letter-spacing:-0.3px;">
          ${hi}, todo lo que ya tienes con nosotros — más herramientas nuevas para acompañarte cada día.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#1a0a1f;opacity:0.7;">
          Sin esperas. Donde estés. Cuando lo necesites.
        </p>

        <!-- ════════ STATS STRIP ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 32px;">
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:16px;padding:18px 12px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  ${stat("150+", "psicólogas")}
                  ${stat("8.000+", "pacientes")}
                  ${stat("4,6/5", "valoración")}
                  ${stat("24/7", "asistente")}
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ════════ FEATURES GRID 2x4 ════════ -->
        <p style="margin:0 0 14px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;line-height:1;">qué encuentras dentro</p>
        <h2 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:24px;line-height:1.25;color:#1a0a1f;text-align:center;font-weight:400;letter-spacing:-0.3px;">
          Ocho herramientas, <em style="color:#6A178C;font-style:italic;">una sola app.</em>
        </h2>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 -6px 28px;">
          ${featureRows}
        </table>

        <!-- ════════ CREDENTIALS CALLOUT ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 32px;">
          <tr>
            <td style="background:linear-gradient(135deg,#FBF4E8 0%,#F0E3F7 100%);border:1px solid rgba(106,23,140,0.22);border-radius:20px;padding:26px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td valign="top" style="width:48px;padding-right:14px;">
                    <div style="width:40px;height:40px;background:#6A178C;border-radius:12px;color:#fff;font-size:22px;line-height:40px;text-align:center;">🔑</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6A178C;letter-spacing:0.12em;text-transform:uppercase;">Una sola cuenta</p>
                    <p style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.3;color:#1a0a1f;font-weight:400;letter-spacing:-0.2px;">
                      Las mismas credenciales del CRM<br><em style="color:#6A178C;font-style:italic;">funcionan en la app.</em>
                    </p>
                    <p style="margin:0 0 8px;font-size:14px;color:#1a0a1f;opacity:0.78;line-height:1.6;">
                      Email: <strong style="color:#6A178C;background:#fff;padding:2px 8px;border-radius:6px;border:1px solid rgba(106,23,140,0.15);">${email}</strong>
                    </p>
                    <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.65;">
                      Misma contraseña. Si la cambias desde <em>Perfil → Cambiar contraseña</em> en la app, la nueva funcionará también en el CRM.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ════════ PRIMARY CTA ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 14px;">
          <tr>
            <td align="center">
              <a href="${APP_LANDING}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:17px 38px;border-radius:999px;font-weight:700;display:inline-block;font-size:16px;letter-spacing:0.1px;box-shadow:0 8px 30px rgba(106,23,140,0.28);">
                Descarga la app gratis →
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 30px;font-size:12px;color:#1a0a1f;opacity:0.5;text-align:center;line-height:1.5;">
          Android disponible ya. iOS aterriza esta semana — apúntate al aviso desde la página.
        </p>

        <!-- ════════ QUOTE / DIVIDER ════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 28px;">
          <tr>
            <td align="center" style="border-top:1px solid rgba(106,23,140,0.12);padding-top:24px;">
              <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#6A178C;font-style:italic;line-height:1.4;letter-spacing:-0.2px;">
                "Tu mente merece el mismo cuidado<br>que tu cuerpo."
              </p>
            </td>
          </tr>
        </table>

        <!-- ════════ FOOTER MICRO ════════ -->
        <p style="margin:0 0 6px;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.65;text-align:center;">
          ¿No recuerdas tu contraseña? <a href="${CRM_LOGIN}" style="color:#6A178C;text-decoration:underline;">Restablécela aquí</a> y entra en la app con la nueva.
        </p>
        <p style="margin:0 0 28px;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.65;text-align:center;">
          ¿Una duda? <a href="mailto:hola@mentesanapsicologia.com" style="color:#6A178C;text-decoration:underline;">hola@mentesanapsicologia.com</a>
        </p>

        <p style="margin:0;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;line-height:1;">un abrazo,</p>
        <p style="margin:6px 0 0;font-size:13px;color:#1a0a1f;opacity:0.55;text-align:center;">El equipo de Mente Sana</p>
      `,
    }),
  };
}

function pairs<T>(items: T[]): (T | null)[][] {
  const out: (T | null)[][] = [];
  for (let i = 0; i < items.length; i += 2) out.push([items[i], items[i + 1] ?? null]);
  return out;
}

function stat(value: string, label: string) {
  return `<td align="center" valign="middle" width="25%" style="padding:0 4px;">
    <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1;color:#6A178C;font-weight:500;letter-spacing:-0.3px;">${value}</p>
    <p style="margin:4px 0 0;font-size:10px;color:#1a0a1f;opacity:0.55;text-transform:uppercase;letter-spacing:0.08em;">${label}</p>
  </td>`;
}
