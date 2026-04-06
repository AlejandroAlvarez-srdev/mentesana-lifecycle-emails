import { emailLayout } from "./layout";

export function welcomeNewsletterEmail(): { subject: string; html: string } {
  return {
    subject: "Bienvenida a Mente Sana 🌿 — Tu primera dosis de calma",
    html: emailLayout({
      title: "Bienvenida a Mente Sana",
      preheader: "Cada semana, recursos gratuitos de bienestar emocional para cuidar tu mente.",
      content: `
        <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;">Bienvenida</p>
        <h1 style="margin:0 0 24px;font-family:'Playfair Display',Georgia,serif;font-size:34px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;">Gracias por unirte 💜</h1>

        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.7;">
          Acabas de dar un pequeño pero poderoso paso para cuidar tu mente.
        </p>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.7;">
          Cada semana te enviaremos contenido <strong>seleccionado por psicólogas profesionales</strong>: técnicas de gestión emocional, ejercicios prácticos, reflexiones para el día a día y recursos descargables. Sin spam, sin relleno. Solo lo que de verdad ayuda.
        </p>

        <!-- Value blocks -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:32px 0;">
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.1);border-radius:16px;padding:20px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6A178C;">📚 Cada semana</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.6;">Un artículo nuevo de psicología práctica</p>
            </td>
          </tr>
          <tr><td style="height:8px;"></td></tr>
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.1);border-radius:16px;padding:20px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6A178C;">🧘 Recursos gratuitos</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.6;">Meditaciones, ejercicios y guías descargables</p>
            </td>
          </tr>
          <tr><td style="height:8px;"></td></tr>
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.1);border-radius:16px;padding:20px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6A178C;">💝 Contenido exclusivo</p>
              <p style="margin:0;font-size:13px;color:#1a0a1f;opacity:0.6;">Acceso a entrevistas con nuestras psicólogas</p>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:32px 0 16px;">
          <tr>
            <td align="center">
              <a href="https://mentesanapsicologia.com/test/sobrio" class="btn-purple" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px;">
                Hacer test gratuito de salud mental
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0;font-size:12px;color:#1a0a1f;opacity:0.4;text-align:center;">
          Mientras tanto, ¿quieres saber cómo está tu salud mental? Nuestro test gratuito de 3 minutos te da un informe personalizado.
        </p>
      `,
    }),
  };
}
