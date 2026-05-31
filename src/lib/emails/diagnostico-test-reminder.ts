// Email "personal" de la psicóloga al paciente que pagó pero no completó
// el test. Se dispara 4h antes de la cita. Tono cercano, primera persona,
// sin parecer transaccional. Incluye CTA hacia la app (App Store + Google
// Play) porque el test se completa SOLO desde la app.
import { emailLayout } from "./layout";

interface Props {
  patientFirstName?: string;
  patientEmail?: string;
  psychologistName?: string;
  appointmentAt?: string | Date | null; // ISO o Date — sesión programada
}

const APP_STORE_URL_BASE = "https://apps.apple.com/co/app/mente-sana-app/id6769225141";
const PLAY_STORE_URL_BASE = "https://play.google.com/store/apps/details?id=com.mentesanapsicologia.com&hl=es_CO";
const APP_STORE_BADGE = "https://mentesanapsicologia.com/images/app/app-store-badge.png";
const PLAY_STORE_BADGE = "https://mentesanapsicologia.com/images/app/google-play-badge-3x1.png";
const WA_URL = "https://wa.me/34XXXXXXXXX";

const PURPLE = "#6A178C";
const PURPLE_DEEP = "#3F0E54";
const PURPLE_SOFT = "#8B2FB5";
const GOLD = "#D4AF37";
const CREAM = "#FBF7EE";

function appStoreUrl(placement: string): string {
  return `${APP_STORE_URL_BASE}?pt=mentesana&ct=${encodeURIComponent(`email_test_reminder_${placement}`)}&mt=8`;
}
function playStoreUrl(placement: string): string {
  const referrer = encodeURIComponent(
    `utm_source=email&utm_medium=transactional&utm_campaign=test_reminder&utm_content=${placement}`,
  );
  return `${PLAY_STORE_URL_BASE}&referrer=${referrer}`;
}

function firstWord(s: string | undefined | null): string {
  return (s || "").trim().split(/\s+/)[0] || "";
}

function formatAppointment(at: string | Date | null | undefined): string {
  if (!at) return "tu cita de hoy";
  const d = typeof at === "string" ? new Date(at) : at;
  if (Number.isNaN(d.getTime())) return "tu cita de hoy";
  // Hora en zona Europe/Madrid (la nuestra)
  const fmt = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `tu cita de las ${fmt.format(d)}`;
}

export function diagnosticoTestReminderEmail({
  patientFirstName = "",
  patientEmail = "",
  psychologistName = "",
  appointmentAt = null,
}: Props): { subject: string; html: string; fromName: string } {
  const patient = firstWord(patientFirstName) || "Hola";
  const psiFull = (psychologistName || "").trim() || "tu psicóloga";
  const psiFirst = firstWord(psiFull);
  const apptStr = formatAppointment(appointmentAt);

  return {
    fromName: psiFull,
    subject: `${patient}, necesito tu test antes de nuestra sesión 🙏`,
    html: emailLayout({
      title: "Recordatorio del test",
      preheader: `Soy ${psiFull}. Sin tu evaluación no podré preparar bien tu informe para hoy. Te lleva 10 min en la app.`,
      content: `
        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- HERO — mensaje personal de la psi, no transaccional         -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100% !important;background:${CREAM};border:1px solid ${PURPLE}1f;border-radius:20px;margin:0 0 24px;">
          <tr>
            <td align="center" style="padding:30px 24px 24px;text-align:center;">

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 14px;">
                <tr>
                  <td align="center" style="background:${GOLD};color:${PURPLE_DEEP};border-radius:999px;padding:5px 14px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;text-align:center;">
                    mensaje de tu psicóloga
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-family:'Caveat','Brush Script MT',cursive;font-size:30px;color:${PURPLE};line-height:1;text-align:center;">
                ${patient},
              </p>

              <h1 style="margin:0 0 14px;font-family:'Playfair Display',Georgia,serif;font-size:28px;line-height:1.18;color:#1a0a1f;font-weight:400;letter-spacing:-0.02em;text-align:center;">
                no he recibido tu test todavía<br>
                <em style="color:${PURPLE};font-style:normal;">y necesito tus respuestas.</em>
              </h1>

              <p style="margin:0 auto;max-width:440px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#1a0a1f;opacity:0.78;text-align:center;">
                Soy <strong>${psiFull}</strong>, la psicóloga que te acompañará en ${apptStr}. Para poder preparar bien tu informe y aprovechar al máximo nuestra sesión, necesito que completes el test de evaluación. Sin esas respuestas no tendré información suficiente para realizar tu diagnóstico.
              </p>

            </td>
          </tr>
        </table>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- AVISO DURO (centrado, suave en tono)                         -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100% !important;background:#FFF8E6;border:1px solid ${GOLD}55;border-radius:14px;margin:0 0 24px;">
          <tr>
            <td style="padding:14px 18px;text-align:center;">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;line-height:1.55;color:${PURPLE_DEEP};text-align:center;">
                ⏰ <strong>Te quedan unas 4 horas hasta nuestra sesión.</strong> El test te lleva unos 10 minutos.
              </p>
            </td>
          </tr>
        </table>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- CTA — descarga app                                           -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100% !important;background:#ffffff;border:1.5px solid ${PURPLE}1f;border-radius:20px;margin:0 0 26px;">
          <tr>
            <td align="center" style="padding:26px 22px 22px;text-align:center;">

              <p style="margin:0 0 6px;font-size:30px;line-height:1;">📱</p>
              <p style="margin:0 0 4px;font-family:'Caveat','Brush Script MT',cursive;font-size:22px;color:${PURPLE};line-height:1;text-align:center;">
                ayúdame, hazlo desde la app
              </p>
              <h3 style="margin:0 0 6px;font-family:'Playfair Display',Georgia,serif;font-size:20px;line-height:1.2;color:#1a0a1f;font-weight:400;letter-spacing:-0.01em;text-align:center;">
                Completar el test &middot; Mente Sana
              </h3>
              <p style="margin:0 0 20px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12.5px;color:#1a0a1f;opacity:0.6;line-height:1.55;text-align:center;">
                Si todavía no la tienes, descárgala. Tu cuenta ya está creada con el email con el que pagaste.
              </p>

              <!-- Badges (alturas y anchos iguales) -->
              <!--[if mso]><center><![endif]-->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 6px;vertical-align:middle;font-size:0;line-height:0;">
                    <a href="${appStoreUrl("hero")}" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img src="${APP_STORE_BADGE}" alt="Descargar en App Store" width="150" height="50" style="display:block;width:150px;height:50px;border:0;outline:none;text-decoration:none;">
                    </a>
                  </td>
                  <td style="padding:0 6px;vertical-align:middle;font-size:0;line-height:0;">
                    <a href="${playStoreUrl("hero")}" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img src="${PLAY_STORE_BADGE}" alt="Disponible en Google Play" width="150" height="50" style="display:block;width:150px;height:50px;border:0;outline:none;text-decoration:none;">
                    </a>
                  </td>
                </tr>
              </table>
              <!--[if mso]></center><![endif]-->

              <!-- Credenciales — mismo bloque que el email de pago -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100% !important;margin:14px 0 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;border-collapse:separate;background:#ffffff;border:1.5px dashed ${PURPLE}55;border-radius:14px;">
                      <tr>
                        <td style="padding:14px 18px;text-align:left;">
                          <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;color:${PURPLE};font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">
                            🔑 Tus credenciales de acceso
                          </p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0;">
                            <tr>
                              <td style="padding:4px 12px 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a0a1f;opacity:0.55;font-weight:600;white-space:nowrap;">Email</td>
                              <td style="padding:4px 0;font-family:'Menlo','Courier New',monospace;font-size:12.5px;color:#1a0a1f;font-weight:600;">${patientEmail || "el email con el que pagaste"}</td>
                            </tr>
                            <tr>
                              <td style="padding:4px 12px 4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a0a1f;opacity:0.55;font-weight:600;white-space:nowrap;">Contraseña</td>
                              <td style="padding:4px 0;font-family:'Menlo','Courier New',monospace;font-size:12.5px;color:#1a0a1f;font-weight:600;">REDACTED_PASSWORD</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- MICRO-MENSAJE FINAL — humano                                 -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100% !important;margin:0 0 24px;">
          <tr>
            <td align="center" style="padding:0 8px;text-align:center;">
              <p style="margin:0 auto;max-width:440px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;line-height:1.7;color:#1a0a1f;opacity:0.78;text-align:center;">
                Sé que con el ritmo de hoy en día estas cosas se pasan, no te preocupes — solo necesito que dediques 10 minutos a responderlo antes de las ${apptStr.replace("tu cita de las ", "")}. Si tienes cualquier problema con la app, escríbeme por WhatsApp y te ayudo personalmente.
              </p>
            </td>
          </tr>
        </table>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- PILL WHATSAPP — soporte directo                              -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100% !important;margin:0 0 22px;">
          <tr>
            <td align="center" style="text-align:center;">
              <!--[if mso]><center><![endif]-->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;border-collapse:separate;">
                <tr>
                  <td align="center" style="background:#ffffff;border:1.5px solid ${PURPLE};border-radius:999px;padding:0;text-align:center;">
                    <a href="${WA_URL}?text=${encodeURIComponent(`Hola ${psiFirst}, necesito ayuda con el test de la app antes de nuestra sesión`)}" target="_blank" style="display:inline-block;padding:11px 22px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:${PURPLE};text-decoration:none;line-height:1;white-space:nowrap;">
                      💬 Escribir a soporte por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
              <!--[if mso]></center><![endif]-->
            </td>
          </tr>
        </table>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- FIRMA — handwriting de la psicóloga                          -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100% !important;margin:8px 0 0;">
          <tr>
            <td align="center" style="text-align:center;padding:14px 0 0;border-top:1px solid ${PURPLE}1a;">
              <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#1a0a1f;opacity:0.55;line-height:1;">
                Con cariño,
              </p>
              <p style="margin:0 0 4px;font-family:'Caveat','Brush Script MT',cursive;font-size:30px;color:${PURPLE};line-height:1;display:inline-block;transform:rotate(-2deg);">
                ${psiFull}
              </p>
              <p style="margin:6px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5px;color:#1a0a1f;opacity:0.4;letter-spacing:1.2px;text-transform:uppercase;line-height:1.5;">
                Psicóloga colegiada · Mente Sana
              </p>
            </td>
          </tr>
        </table>
      `,
    }),
  };
}
