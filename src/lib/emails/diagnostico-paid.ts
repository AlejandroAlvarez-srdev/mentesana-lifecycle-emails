import { emailLayout } from "./layout";
import { resolvePsiPhotoUrl } from "./psi-photos";

interface Props {
  name?: string;
  psychologistName?: string;
  email?: string;
}

const APP_STORE_URL_BASE = "https://apps.apple.com/co/app/mente-sana-app/id6769225141";
const PLAY_STORE_URL_BASE = "https://play.google.com/store/apps/details?id=com.mentesanapsicologia.com&hl=es_CO";
const APP_STORE_BADGE = "https://mentesanapsicologia.com/images/app/app-store-badge.png";
// Versión 3:1 generada (750×250, padding transparente horizontal) para que
// renderice al mismo tamaño exacto que el App Store badge sin deformarse.
const PLAY_STORE_BADGE = "https://mentesanapsicologia.com/images/app/google-play-badge-3x1.png";
const WA_PHONE_INTL = "+34 XXX XXX XXX";
const WA_URL = "https://wa.me/34XXXXXXXXX";

// UTM helpers — para saber desde qué placement del email entró cada usuario.
// iOS: usamos `ct` (campaign token de Apple). Android: `referrer` con UTMs
// estándar codificados (mecanismo oficial de Play Install Referrer).
function appStoreUrl(placement: string): string {
  const ct = `email_diagnostico_paid_${placement}`;
  return `${APP_STORE_URL_BASE}?pt=mentesana&ct=${encodeURIComponent(ct)}&mt=8`;
}
function playStoreUrl(placement: string): string {
  const referrer = encodeURIComponent(
    `utm_source=email&utm_medium=transactional&utm_campaign=diagnostico_paid&utm_content=${placement}`,
  );
  return `${PLAY_STORE_URL_BASE}&referrer=${referrer}`;
}

// Foto de psicóloga: resuelta vía resolvePsiPhotoUrl() — sólo devuelve URL
// si el slug existe en la whitelist de psi-photos.ts. Si no, retorna null
// y el email cae al avatar de iniciales.

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "MS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const PURPLE = "#6A178C";
const PURPLE_DEEP = "#3F0E54";
const PURPLE_SOFT = "#8B2FB5";
const GOLD = "#D4AF37";
const CREAM = "#FBF7EE";
const CREAM_DEEP = "#F5EDE0";

export function diagnosticoPaidEmail({ name = "", psychologistName = "", email = "" }: Props): { subject: string; html: string } {
  const firstName = (name || "").trim().split(/\s+/)[0] || "";
  const greeting = firstName ? firstName : "Hola";
  const psiPhoto = resolvePsiPhotoUrl(psychologistName);
  const psiInitials = initialsOf(psychologistName);
  const psiFirstName = (psychologistName || "").trim().split(/\s+/)[0] || "";

  return {
    subject: "🎉 Pago confirmado · Descarga la app para hacer tu evaluación",
    html: emailLayout({
      title: "Pago confirmado",
      preheader: `${greeting}, gracias por confiar en nosotras. Tu evaluación se realiza dentro de la app de Mente Sana. Descárgala para empezar.`,
      content: `
        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- HERO HEADER — gradient morado profundo con sello dorado     -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,${PURPLE_DEEP} 0%,${PURPLE} 55%,${PURPLE_SOFT} 100%);border-radius:24px;margin:0 0 28px;">
          <tr>
            <td style="padding:36px 28px 28px;text-align:center;">

              <!-- Pequeño sello dorado con check -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 18px;">
                <tr>
                  <td style="background:${GOLD};border-radius:999px;padding:6px 16px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2.4px;color:${PURPLE_DEEP};text-transform:uppercase;">
                    ✓ Pago confirmado · 9,99€
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-family:'Caveat','Brush Script MT',cursive;font-size:30px;line-height:1;color:${GOLD};">
                ${greeting}, lo conseguiste
              </p>

              <h1 style="margin:0 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:34px;line-height:1.1;color:#ffffff;font-weight:400;letter-spacing:-0.02em;">
                Tu camino con Mente Sana<br>
                <em style="color:${GOLD};font-style:normal;">empieza ahora.</em>
              </h1>

              <p style="margin:0 auto;max-width:420px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.85);">
                ${psychologistName ? `Te hemos asignado a <strong style="color:${GOLD};">${psychologistName}</strong>. ` : ""}Ahora solo nos queda un paso — y se hace dentro de la app.
              </p>

            </td>
          </tr>
        </table>

        ${psychologistName ? `
        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- TARJETA PERSONAL — psicóloga asignada con foto real          -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid #f0e6f7;border-radius:20px;margin:0 0 28px;box-shadow:0 8px 28px rgba(106,23,140,0.06);">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <!-- Foto / Avatar -->
                  <td style="width:84px;vertical-align:middle;padding-right:16px;">
                    ${psiPhoto ? `
                      <img src="${psiPhoto}" alt="${psychologistName}" width="76" height="76" style="display:block;width:76px;height:76px;border-radius:50%;object-fit:cover;border:3px solid ${GOLD};box-shadow:0 6px 18px rgba(106,23,140,0.2);">
                    ` : `
                      <div style="width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,${PURPLE} 0%,${PURPLE_SOFT} 100%);text-align:center;line-height:76px;font-family:'Playfair Display',Georgia,serif;font-size:28px;color:${GOLD};font-weight:500;border:3px solid ${GOLD};box-shadow:0 6px 18px rgba(106,23,140,0.2);letter-spacing:-0.02em;">${psiInitials}</div>
                    `}
                  </td>
                  <!-- Texto -->
                  <td style="vertical-align:middle;">
                    <p style="margin:0 0 2px;font-family:'Caveat',cursive;font-size:18px;color:${PURPLE};line-height:1;">tu psicóloga asignada</p>
                    <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.15;color:#1a0a1f;font-weight:500;letter-spacing:-0.02em;">${psychologistName}</p>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#1a0a1f;opacity:0.6;line-height:1.45;">
                      Colegiada · te acompañará en tu primera sesión y en todas las siguientes${psiFirstName ? `. ${psiFirstName} está esperando tu evaluación.` : "."}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        ` : ""}

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- 🚨 NOVEDAD — la evaluación se hace en la app                 -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background:${GOLD}22;border:1px solid ${GOLD}55;border-radius:999px;">
                <tr>
                  <td style="padding:6px 14px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.6px;color:${PURPLE_DEEP};text-transform:uppercase;">
                    ✨ Novedad · ahora todo en la app
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <h2 style="margin:0 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:26px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;letter-spacing:-0.02em;">
          Tu evaluación se hace<br><em style="color:${PURPLE};font-style:normal;">dentro de la app de Mente Sana.</em>
        </h2>
        <p style="margin:0 auto 26px;max-width:440px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.65;color:#1a0a1f;opacity:0.7;text-align:center;">
          Para que tu psicóloga reciba todo en directo y prepare tu informe a tiempo, hemos llevado el test a la app. Más cómodo, más privado, sin perder el progreso.
        </p>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- ★★★ CTA PRINCIPAL — DESCARGA + BADGES ★★★                 -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${CREAM};border:1.5px solid ${PURPLE}1f;border-radius:24px;margin:0 0 28px;">
          <tr>
            <td style="padding:32px 24px 28px;text-align:center;">

              <p style="margin:0 0 6px;font-size:32px;line-height:1;">📱</p>
              <p style="margin:0 0 6px;font-family:'Caveat','Brush Script MT',cursive;font-size:24px;color:${PURPLE};line-height:1;">
                paso 1 · descarga la app
              </p>
              <h3 style="margin:0 0 6px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.25;color:#1a0a1f;font-weight:400;letter-spacing:-0.01em;">
                Mente Sana · Tu psicología
              </h3>
              <p style="margin:0 0 22px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;color:#1a0a1f;opacity:0.6;line-height:1.55;">
                Disponible para iPhone y Android · Gratis · Tu cuenta ya está creada
              </p>

              <!-- Badges — mismo tamaño visual (igualados en alto y ancho) -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 18px;">
                <tr>
                  <td style="padding:0 6px;vertical-align:middle;">
                    <a href="${appStoreUrl("hero")}" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img src="${APP_STORE_BADGE}" alt="Descargar en App Store" width="150" height="50" style="display:block;width:150px;height:50px;border:0;outline:none;text-decoration:none;">
                    </a>
                  </td>
                  <td style="padding:0 6px;vertical-align:middle;">
                    <a href="${playStoreUrl("hero")}" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img src="${PLAY_STORE_BADGE}" alt="Disponible en Google Play" width="150" height="50" style="display:block;width:150px;height:50px;border:0;outline:none;text-decoration:none;">
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Credenciales — destacadas para copiar fácil -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100% !important;margin:8px 0 0;">
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
                              <td style="padding:4px 0;font-family:'Menlo','Courier New',monospace;font-size:12.5px;color:#1a0a1f;font-weight:600;">${email || "(el email con el que pagaste)"}</td>
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

              <p style="margin:10px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a0a1f;opacity:0.55;line-height:1.5;text-align:center;">
                ⏱ Te lleva 30 segundos · Podrás cambiar la contraseña dentro de la app
              </p>

            </td>
          </tr>
        </table>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- POSTERS APP — 3 capturas en orden: psicóloga → bienestar →   -->
        <!-- herramientas. Muestra lo que va a encontrar dentro.          -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 12px;">
          <tr>
            <td style="text-align:center;">
              <p style="margin:0 0 4px;font-family:'Caveat',cursive;font-size:22px;color:${PURPLE};line-height:1;">
                esto es lo que te espera dentro
              </p>
              <h3 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.25;color:#1a0a1f;font-weight:400;letter-spacing:-0.01em;">
                Tres mundos. Una sola app.
              </h3>
            </td>
          </tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <!-- 1 · Bienestar -->
            <td style="width:33.33%;padding:0 4px;vertical-align:top;text-align:center;">
              <a href="${appStoreUrl("body_cta")}" target="_blank" style="text-decoration:none;">
                <img src="https://mentesanapsicologia.com/images/app/poster-bienestar.jpg" alt="Bienestar diario en la app" width="160" height="284" style="display:block;width:100%;max-width:170px;height:auto;border:0;outline:none;border-radius:14px;margin:0 auto 10px;box-shadow:0 12px 24px rgba(106,23,140,0.18);">
              </a>
              <p style="margin:0 0 2px;font-family:'Playfair Display',Georgia,serif;font-size:14px;color:#1a0a1f;line-height:1.2;font-weight:500;letter-spacing:-0.01em;">1 · Tu bienestar</p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11.5px;color:#1a0a1f;opacity:0.55;line-height:1.45;">Meditaciones, cursos y audiolibros</p>
            </td>
            <!-- 2 · Herramientas -->
            <td style="width:33.33%;padding:0 4px;vertical-align:top;text-align:center;">
              <a href="${appStoreUrl("body_cta")}" target="_blank" style="text-decoration:none;">
                <img src="https://mentesanapsicologia.com/images/app/poster-herramientas.jpg" alt="Herramientas de la app" width="160" height="284" style="display:block;width:100%;max-width:170px;height:auto;border:0;outline:none;border-radius:14px;margin:0 auto 10px;box-shadow:0 12px 24px rgba(106,23,140,0.18);">
              </a>
              <p style="margin:0 0 2px;font-family:'Playfair Display',Georgia,serif;font-size:14px;color:#1a0a1f;line-height:1.2;font-weight:500;letter-spacing:-0.01em;">2 · Tus herramientas</p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11.5px;color:#1a0a1f;opacity:0.55;line-height:1.45;">Diario, hábitos y diagnóstico</p>
            </td>
            <!-- 3 · Psicóloga -->
            <td style="width:33.33%;padding:0 4px;vertical-align:top;text-align:center;">
              <a href="${appStoreUrl("body_cta")}" target="_blank" style="text-decoration:none;">
                <img src="https://mentesanapsicologia.com/images/app/poster-psicologa.jpg" alt="Tu psicóloga asignada en la app" width="160" height="284" style="display:block;width:100%;max-width:170px;height:auto;border:0;outline:none;border-radius:14px;margin:0 auto 10px;box-shadow:0 12px 24px rgba(106,23,140,0.18);">
              </a>
              <p style="margin:0 0 2px;font-family:'Playfair Display',Georgia,serif;font-size:14px;color:#1a0a1f;line-height:1.2;font-weight:500;letter-spacing:-0.01em;">3 · Tu psicóloga</p>
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11.5px;color:#1a0a1f;opacity:0.55;line-height:1.45;">Chat directo, agenda y videollamada</p>
            </td>
          </tr>
        </table>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- DIVISOR — solo el handwriting + un asterisco dorado          -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <p style="margin:0 0 28px;text-align:center;font-family:'Caveat',cursive;font-size:22px;color:${PURPLE};opacity:0.7;line-height:1;">
          <span style="color:${GOLD};font-size:14px;vertical-align:1px;margin-right:8px;">✦</span>y después…<span style="color:${GOLD};font-size:14px;vertical-align:1px;margin-left:8px;">✦</span>
        </p>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- 3 PASOS — bonitos                                            -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 12px;">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:1.6px;text-transform:uppercase;">El camino completo</p>
              <h3 style="margin:0 0 20px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.2;color:#1a0a1f;font-weight:400;letter-spacing:-0.01em;">
                Tres pasos sencillos, sin volver al ordenador.
              </h3>
            </td>
          </tr>
        </table>

        <!-- Step 1 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid #f0e6f7;border-radius:16px;margin:0 0 12px;">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width:48px;vertical-align:top;">
                    <div style="width:40px;height:40px;background:linear-gradient(135deg,${PURPLE},${PURPLE_SOFT});border-radius:14px;text-align:center;line-height:40px;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:18px;color:#fff;">1</div>
                  </td>
                  <td style="padding-left:14px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:${GOLD};letter-spacing:1.2px;text-transform:uppercase;font-weight:700;">8-10 minutos</p>
                    <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:17px;color:#1a0a1f;line-height:1.25;font-weight:400;letter-spacing:-0.01em;">Completas tu evaluación en la app</p>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.55;">30 preguntas clínicas sobre cómo te sientes. La app te guía paso a paso y guarda tu progreso si tienes que parar.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Step 2 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid #f0e6f7;border-radius:16px;margin:0 0 12px;">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width:48px;vertical-align:top;">
                    <div style="width:40px;height:40px;background:linear-gradient(135deg,${PURPLE},${PURPLE_SOFT});border-radius:14px;text-align:center;line-height:40px;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:18px;color:#fff;">2</div>
                  </td>
                  <td style="padding-left:14px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:${GOLD};letter-spacing:1.2px;text-transform:uppercase;font-weight:700;">Mientras esperas</p>
                    <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:17px;color:#1a0a1f;line-height:1.25;font-weight:400;letter-spacing:-0.01em;">${psychologistName ? `${psychologistName} elabora tu informe` : "Tu psicóloga elabora tu informe"}</p>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.55;">Analiza tus respuestas, identifica patrones y prepara un plan personalizado para tu primera sesión.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Step 3 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid #f0e6f7;border-radius:16px;margin:0 0 28px;">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width:48px;vertical-align:top;">
                    <div style="width:40px;height:40px;background:linear-gradient(135deg,${PURPLE},${PURPLE_SOFT});border-radius:14px;text-align:center;line-height:40px;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:18px;color:#fff;">3</div>
                  </td>
                  <td style="padding-left:14px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:${GOLD};letter-spacing:1.2px;text-transform:uppercase;font-weight:700;">50 minutos · videollamada</p>
                    <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:17px;color:#1a0a1f;line-height:1.25;font-weight:400;letter-spacing:-0.01em;">Tu primera sesión</p>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.55;">Te entrega el informe, te explica cada hallazgo y construís juntas el plan de acción de tu proceso.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- GESTIONA TU CITA EN LA APP                                   -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${CREAM_DEEP};border-radius:14px;margin:0 0 28px;">
          <tr>
            <td style="padding:16px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0 0 2px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;font-weight:700;color:${PURPLE_DEEP};">📱 Tu cita, tu evaluación, todo en la app</p>
                    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12.5px;color:#1a0a1f;opacity:0.6;line-height:1.5;">Ver fecha, mover, cancelar o chatear con ${psiFirstName || "tu psicóloga"} — todo desde el móvil.</p>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <a href="${appStoreUrl("body_cta")}" style="background:${PURPLE};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:999px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;display:inline-block;font-size:12px;white-space:nowrap;">
                      Abrir la app →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- RECORDATORIO FINAL — descarga ya · bulletproof centrado     -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100% !important;margin:0 0 28px;border-collapse:separate;">
          <tr>
            <td align="center" style="background:${PURPLE_DEEP};background:linear-gradient(135deg,${PURPLE_DEEP} 0%,${PURPLE} 100%);border-radius:20px;padding:28px 24px;text-align:center;">
              <p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:22px;color:${GOLD};line-height:1;text-align:center;">
                un último empujón
              </p>
              <p style="margin:0 0 20px;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:400;color:#ffffff;line-height:1.3;letter-spacing:-0.01em;text-align:center;">
                Sin la app, tu psicóloga no recibe<br>tu evaluación a tiempo.
              </p>
              <!--[if mso]><center><![endif]-->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 5px;vertical-align:middle;font-size:0;line-height:0;">
                    <a href="${appStoreUrl("reminder")}" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img src="${APP_STORE_BADGE}" alt="App Store" width="135" height="45" style="display:block;width:135px;height:45px;border:0;outline:none;">
                    </a>
                  </td>
                  <td style="padding:0 5px;vertical-align:middle;font-size:0;line-height:0;">
                    <a href="${playStoreUrl("reminder")}" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img src="${PLAY_STORE_BADGE}" alt="Google Play" width="135" height="45" style="display:block;width:135px;height:45px;border:0;outline:none;">
                    </a>
                  </td>
                </tr>
              </table>
              <!--[if mso]></center><![endif]-->
            </td>
          </tr>
        </table>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- TRUST FOOTER                                                  -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 18px;">
          <tr>
            <td style="text-align:center;">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a0a1f;opacity:0.5;letter-spacing:0.4px;line-height:1.7;">
                <span style="color:${GOLD};">★★★★★ 4,9</span> &nbsp;·&nbsp; +1.200 reseñas verificadas &nbsp;·&nbsp; 150 psicólogas colegiadas &nbsp;·&nbsp; RGPD art.&nbsp;9
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100% !important;margin:0 0 18px;">
          <tr>
            <td align="center" style="text-align:center;padding:0;">
              <p style="margin:0 0 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12.5px;color:#1a0a1f;opacity:0.7;line-height:1.55;text-align:center;">
                ¿Te ha surgido alguna duda al instalar la app?
              </p>
              <!--[if mso]><center><![endif]-->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;border-collapse:separate;">
                <tr>
                  <td align="center" style="background:#ffffff;border:1.5px solid ${PURPLE};border-radius:999px;padding:0;text-align:center;">
                    <a href="${WA_URL}?text=Hola%2C%20he%20pagado%20el%20diagn%C3%B3stico%20y%20necesito%20ayuda%20con%20la%20app" target="_blank" style="display:inline-block;padding:11px 22px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:${PURPLE};text-decoration:none;line-height:1;white-space:nowrap;">
                      💬 Escríbenos por WhatsApp · ${WA_PHONE_INTL}
                    </a>
                  </td>
                </tr>
              </table>
              <!--[if mso]></center><![endif]-->
            </td>
          </tr>
        </table>

        <p style="margin:18px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a0a1f;opacity:0.4;text-align:center;line-height:1.7;">
          Este email se envía porque acabas de completar tu pago en Mente Sana Psicología.<br>
          Si no eres ${greeting === "Hola" ? "tú" : greeting} quien hizo el pago, contáctanos lo antes posible.
        </p>
      `,
    }),
  };
}
