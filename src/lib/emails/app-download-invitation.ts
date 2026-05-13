import { emailLayout } from "./layout";

const APP_LANDING = "https://mentesanapsicologia.com/app";
const PLAY_STORE = "https://play.google.com/apps/test/RQ8n4STdUPo/ahAO29uNSE9o0orDKNNhreru91RxZBP633w_YDN-L1KDWTbT3ybuUSlreTQWz3f4CjKs-ZIO2HoR-gKutjYXYDqKTC";
const CRM_LOGIN = "https://crm.mentesanapsicologia.com/login";

interface Props {
  firstName?: string;
  email: string;
}

export function appDownloadInvitationEmail({ firstName, email }: Props): { subject: string; html: string } {
  const hi = firstName ? firstName : "hola";
  return {
    subject: firstName
      ? `${firstName}, tu Mente Sana ahora cabe en el bolsillo`
      : "Tu Mente Sana ahora cabe en el bolsillo",
    html: emailLayout({
      title: "Descarga la app de Mente Sana",
      preheader: "Sesiones, María, diario, audiolibros y meditaciones — con tus mismas credenciales del CRM.",
      content: `
        <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;text-align:center;">Una buena noticia</p>
        <h1 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;">${hi}, ya está aquí la app de Mente Sana</h1>

        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.75;">
          Todo lo que ya usas con nosotros —tus sesiones, tu psicóloga, tus bonos— más herramientas nuevas pensadas para acompañarte cada día, ahora en tu móvil.
        </p>

        <!-- Feature blocks -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0 8px;">
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:16px;padding:18px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6A178C;">Tus sesiones, siempre a mano</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.55;">Reserva, mueve o cancela tu cita con tu psicóloga colegiada en dos toques.</p>
            </td>
          </tr>
          <tr><td style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:16px;padding:18px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6A178C;">María, tu asistente emocional 24/7</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.55;">Habla con María por chat o por voz cuando lo necesites. Si detecta que necesitas atención clínica, te deriva a una profesional humana.</p>
            </td>
          </tr>
          <tr><td style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:16px;padding:18px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6A178C;">Diario emocional</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.55;">Registra cómo te sientes y revisa tu evolución en una gráfica semanal.</p>
            </td>
          </tr>
          <tr><td style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:16px;padding:18px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6A178C;">Audiolibros, meditaciones y cursos</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.55;">Audiolibros de psicología práctica, meditaciones guiadas por categoría y 12 cursos en video impartidos por nuestras psicólogas.</p>
            </td>
          </tr>
          <tr><td style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.10);border-radius:16px;padding:18px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6A178C;">Talleres en directo incluidos en tu Bono</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.65;line-height:1.55;">Reserva plaza en talleres grupales en vivo por videollamada con psicólogas expertas.</p>
            </td>
          </tr>
        </table>

        <!-- Credentials block -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0;">
          <tr>
            <td style="background:linear-gradient(135deg,#FBF4E8 0%,#F0E3F7 100%);border:1px solid rgba(106,23,140,0.18);border-radius:18px;padding:22px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6A178C;letter-spacing:0.06em;text-transform:uppercase;">Tus credenciales</p>
              <p style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#1a0a1f;line-height:1.3;">Usa el mismo email y contraseña del CRM</p>
              <p style="margin:0 0 8px;font-size:14px;color:#1a0a1f;opacity:0.75;line-height:1.6;">
                Entras en la app con <strong style="color:#6A178C;">${email}</strong> y la misma contraseña que ya tienes en tu CRM de Mente Sana.
              </p>
              <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.75;line-height:1.6;">
                Si la cambias desde <em>Perfil → Cambiar contraseña</em> en la app, la nueva contraseña funcionará también en el CRM. Una sola cuenta para todo.
              </p>
            </td>
          </tr>
        </table>

        <!-- Download buttons -->
        <p style="margin:8px 0 14px;font-size:12px;color:#6A178C;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;text-align:center;">Descárgala ahora</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 12px;">
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
        <p style="margin:0 0 24px;font-size:12px;color:#1a0a1f;opacity:0.5;text-align:center;line-height:1.5;">
          Android ya disponible. iOS llegará en los próximos días — apúntate al aviso desde el botón.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 24px;">
          <tr>
            <td align="center">
              <a href="${APP_LANDING}" class="btn-purple" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px;">
                Abrir página de la app
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 8px;font-size:13px;color:#1a0a1f;opacity:0.55;line-height:1.6;text-align:center;">
          ¿No recuerdas tu contraseña? <a href="${CRM_LOGIN}" style="color:#6A178C;text-decoration:underline;">Restablécela desde el CRM</a> y entra en la app con la nueva.
        </p>

        <p style="margin:28px 0 6px;font-size:14px;color:#1a0a1f;opacity:0.75;line-height:1.7;">
          Si tienes cualquier duda, escríbenos a <a href="mailto:hola@mentesanapsicologia.com" style="color:#6A178C;text-decoration:underline;">hola@mentesanapsicologia.com</a>. Estamos aquí para ti.
        </p>
        <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.75;line-height:1.7;">
          Un abrazo,<br>
          El equipo de Mente Sana
        </p>
      `,
    }),
  };
}
