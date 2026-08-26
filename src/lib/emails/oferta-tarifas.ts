// Campaña "subida de tarifas — reserva tu bono al precio de hoy".
// CTA de cada bono va DIRECTO al link de pago de Stripe (los mismos de la home).
// Incluye enlace de baja obligatorio (LSSI/RGPD). El preview visual estático vive
// en /public/emails/oferta-tarifas.html — esta es la versión que se ENVÍA.

export const OFERTA_TARIFAS_CAMPAIGN = "oferta_tarifas_2026_07";
export const OFERTA_TARIFAS_SUBJECT = "Muy pronto subimos las tarifas — reserva tu bono al precio de hoy 💜";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// Nombre de pila limpio y capitalizado. "" si no es válido.
export function cleanFirstName(raw?: string | null): string {
  const n = String(raw ?? "").trim().split(/\s+/)[0] ?? "";
  if (n.length < 2 || n.length > 24 || /[0-9@]/.test(n)) return "";
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

interface Opts {
  firstName?: string | null;
  unsubscribeUrl: string;
}

export function renderOfertaTarifas({ firstName, unsubscribeUrl }: Opts): { subject: string; html: string } {
  const name = cleanFirstName(firstName);
  const greeting = name
    ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1a0a1f;font-weight:600;">Hola ${escapeHtml(name)},</p>`
    : "";
  const unsub = escapeHtml(unsubscribeUrl);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Tu proceso, al precio de hoy · Mente Sana</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&family=Caveat:wght@500;600&display=swap');
  body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; background: #FFFAF2; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  h1, h2, h3 { font-family: 'Playfair Display', Georgia, serif; }
  .handwriting { font-family: 'Caveat', cursive; }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  @media only screen and (max-width:600px) {
    .px { padding-left: 24px !important; padding-right: 24px !important; }
    .h1 { font-size: 32px !important; line-height: 1.15 !important; }
    .cta { display: block !important; width: 100% !important; box-sizing: border-box !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#FFFAF2;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#1a0a1f;">

<div style="display:none;font-size:1px;color:#FFFAF2;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Muy pronto subimos nuestras tarifas. Reserva tu bono al precio de hoy antes de que cambie 💜</div>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFFAF2;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(106,23,140,0.08);border:1px solid rgba(0,0,0,0.04);">

        <tr>
          <td style="background:#ffffff;padding:22px 32px 16px;text-align:center;border-bottom:1px solid rgba(106,23,140,0.08);">
            <a href="https://mentesanapsicologia.com" target="_blank" style="text-decoration:none;display:inline-block;">
              <img src="https://mentesanapsicologia.com/images/logo-email.png" alt="Mente Sana Psicología" width="160" height="37" style="display:block;width:160px;height:37px;border:0;outline:none;text-decoration:none;">
            </a>
            <p style="margin:8px 0 0;font-family:'Caveat',cursive;font-size:14px;color:#1a0a1f;opacity:0.55;line-height:1;">psicología online · con cariño</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:10px auto 0;">
              <tr><td style="width:40px;height:2px;background:#D4AF37;border-radius:1px;line-height:2px;font-size:0;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:40px 40px 8px;text-align:center;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 22px;">
              <tr>
                <td style="background:rgba(212,175,55,0.14);border:1px solid rgba(212,175,55,0.45);border-radius:999px;padding:7px 16px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#9a7d10;">
                  ⏳ Solo unos días
                </td>
              </tr>
            </table>
            <h1 class="h1" style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:40px;line-height:1.12;font-weight:700;color:#1a0a1f;">
              Muy pronto subimos<br>nuestras tarifas
            </h1>
            <p style="margin:0 0 8px;font-size:17px;line-height:1.6;color:#4a3a50;">
              Y queríamos avisarte con tiempo, porque tú fuiste de las primeras en confiar en nosotras.
            </p>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:16px 40px 8px;">
            ${greeting}
            <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#4a3a50;">
              Si estabas pensando en <strong style="color:#1a0a1f;">empezar o retomar tu proceso</strong>, este es el mejor momento. Todavía puedes acceder a tus <strong style="color:#6A178C;">bonos de sesiones al precio actual</strong> — el mismo de siempre, antes de la actualización.
            </p>
            <p style="margin:0;font-size:16px;line-height:1.7;color:#4a3a50;">
              Reservas hoy, avanzas a tu ritmo. Tu bienestar no debería esperar a un cambio de tarifa.
            </p>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:28px 40px 8px;">
            <p class="handwriting" style="margin:0 0 18px;text-align:center;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;line-height:1;">Elige tu bono y págalo al precio de hoy</p>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:2px solid #6A178C;border-radius:18px;margin:0 0 14px;box-shadow:0 8px 24px rgba(106,23,140,0.10);">
              <tr><td style="padding:20px 22px;">
                <span style="display:inline-block;background:#22c55e;color:#ffffff;font-size:10px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;padding:4px 10px;border-radius:6px;margin-bottom:10px;">⭐ El más elegido · Ahorras 170€</span>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>
                  <td style="vertical-align:top;">
                    <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#1a0a1f;">Bono Felicidad</p>
                    <p style="margin:3px 0 0;font-size:13px;color:#8a7a90;">8 sesiones de 50 min · 28,75€/sesión</p>
                  </td>
                  <td align="right" style="vertical-align:top;white-space:nowrap;padding-left:10px;">
                    <span style="font-family:'Playfair Display',Georgia,serif;font-size:27px;font-weight:700;color:#6A178C;">229,99€</span>
                  </td>
                </tr></table>
                <a href="https://buy.stripe.com/REDACTED" target="_blank" style="display:block;text-align:center;margin-top:14px;background:#6A178C;background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff;text-decoration:none;padding:15px;border-radius:999px;font-size:15px;font-weight:800;box-shadow:0 6px 18px rgba(106,23,140,0.28);">💜&nbsp;&nbsp;Comprar al precio de hoy →</a>
              </td></tr>
            </table>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid rgba(106,23,140,0.14);border-radius:18px;margin:0 0 14px;">
              <tr><td style="padding:20px 22px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>
                  <td style="vertical-align:top;">
                    <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#1a0a1f;">Bono Compañía</p>
                    <p style="margin:3px 0 0;font-size:13px;color:#8a7a90;">4 sesiones de 50 min · 37,50€/sesión</p>
                  </td>
                  <td align="right" style="vertical-align:top;white-space:nowrap;padding-left:10px;">
                    <span style="font-family:'Playfair Display',Georgia,serif;font-size:27px;font-weight:700;color:#6A178C;">149,99€</span>
                  </td>
                </tr></table>
                <a href="https://buy.stripe.com/REDACTED" target="_blank" style="display:block;text-align:center;margin-top:14px;background:#6A178C;color:#ffffff;text-decoration:none;padding:15px;border-radius:999px;font-size:15px;font-weight:800;">Comprar al precio de hoy →</a>
              </td></tr>
            </table>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;border:1px solid rgba(106,23,140,0.14);border-radius:18px;margin:0 0 4px;">
              <tr><td style="padding:20px 22px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>
                  <td style="vertical-align:top;">
                    <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#1a0a1f;">Bono Amor <span style="font-size:13px;">💞</span></p>
                    <p style="margin:3px 0 0;font-size:13px;color:#8a7a90;">4 sesiones de pareja de 60 min · para 2</p>
                  </td>
                  <td align="right" style="vertical-align:top;white-space:nowrap;padding-left:10px;">
                    <span style="font-family:'Playfair Display',Georgia,serif;font-size:27px;font-weight:700;color:#6A178C;">179€</span>
                  </td>
                </tr></table>
                <a href="https://buy.stripe.com/REDACTED" target="_blank" style="display:block;text-align:center;margin-top:14px;background:#6A178C;color:#ffffff;text-decoration:none;padding:15px;border-radius:999px;font-size:15px;font-weight:800;">Comprar al precio de hoy →</a>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:18px 40px 6px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#8a7a90;line-height:1.6;">🔒 Pago 100% seguro con Stripe · Sin permanencia · Garantía de satisfacción</p>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:24px 40px 4px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#1a0a1f;border-radius:16px;">
              <tr>
                <td style="padding:18px 24px;text-align:center;">
                  <p style="margin:0;font-size:15px;line-height:1.5;color:#FFFAF2;font-weight:600;">
                    🔔 Cuando cambien las tarifas, <span style="color:#F5D97B;">este precio ya no estará disponible.</span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:26px 40px 6px;text-align:center;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#4a3a50;">
              ¿No sabes cuál encaja mejor contigo? Escríbenos y te ayudamos a elegir antes de que cambien las tarifas, sin ningún compromiso. 💜
            </p>
            <a href="https://wa.me/34XXXXXXXXX?text=Hola%2C%20quiero%20comprar%20un%20bono%20al%20precio%20actual%20pero%20tengo%20una%20duda" target="_blank" style="color:#6A178C;text-decoration:none;font-size:15px;font-weight:700;border-bottom:2px solid rgba(106,23,140,0.25);padding-bottom:2px;">
              Resolver mis dudas por WhatsApp →
            </a>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:28px 40px 8px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top:1px solid rgba(0,0,0,0.06);">
              <tr>
                <td style="padding:20px 0 0;text-align:center;">
                  <p style="margin:0;font-size:13px;line-height:1.8;color:#8a7a90;">
                    🏛️ 150+ psicólogas colegiadas&nbsp;&nbsp;·&nbsp;&nbsp;👥 +8.000 pacientes<br>⭐ 4.9/5 valoración media&nbsp;&nbsp;·&nbsp;&nbsp;🛡️ Garantía de satisfacción
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#FFFAF2;padding:30px 32px;text-align:center;border-top:1px solid rgba(0,0,0,0.04);">
            <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;">Cuida tu mente, cuida tu vida</p>
            <p style="margin:0 0 16px;font-size:13px;color:#6A178C;font-weight:600;">Mente Sana Psicología</p>
            <div style="margin:14px 0;">
              <a href="https://wa.me/34XXXXXXXXX" style="color:#6A178C;text-decoration:none;font-size:11px;margin:0 8px;">WhatsApp</a>
              <span style="color:#6A178C;opacity:0.3;">·</span>
              <a href="https://mentesanapsicologia.com" style="color:#6A178C;text-decoration:none;font-size:11px;margin:0 8px;">Web</a>
              <span style="color:#6A178C;opacity:0.3;">·</span>
              <a href="https://mentesanapsicologia.com/blog" style="color:#6A178C;text-decoration:none;font-size:11px;margin:0 8px;">Blog</a>
            </div>
            <p style="margin:14px 0 0;font-size:10px;color:#1a0a1f;opacity:0.35;">© 2026 Mente Sana Psicología · Todos los derechos reservados</p>
            <p style="margin:8px 0 0;font-size:10px;color:#1a0a1f;opacity:0.35;">
              <a href="https://mentesanapsicologia.com/legal/privacidad" style="color:#1a0a1f;opacity:0.6;text-decoration:none;">Privacidad</a> ·
              <a href="https://mentesanapsicologia.com/legal/aviso-legal" style="color:#1a0a1f;opacity:0.6;text-decoration:none;">Aviso legal</a>
            </p>
            <p style="margin:12px 0 0;font-size:10px;color:#1a0a1f;opacity:0.4;line-height:1.6;">
              Recibes este correo porque eres cliente de Mente Sana Psicología.<br>
              Si no deseas recibir más comunicaciones comerciales, <a href="${unsub}" style="color:#6A178C;opacity:0.8;text-decoration:underline;">date de baja aquí</a>.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;

  return { subject: OFERTA_TARIFAS_SUBJECT, html };
}
