import { emailLayout } from "./layout";

interface Props {
  name?: string;
  topCategory?: string;
  reportLink?: string;
}

export function testCompletedEmail({ name = "", topCategory = "", reportLink = "https://mentesanapsicologia.com/test/sobrio" }: Props): { subject: string; html: string } {
  return {
    subject: "📊 Tu informe de salud mental está listo",
    html: emailLayout({
      title: "Informe de salud mental",
      preheader: "Aquí tienes los resultados de tu test psicológico personalizado.",
      content: `
        <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;">Tu informe está listo</p>
        <h1 style="margin:0 0 24px;font-family:'Playfair Display',Georgia,serif;font-size:32px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;">${name ? name + ", aquí" : "Aquí"} tienes tus resultados</h1>

        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.7;">
          Gracias por completar el test psicológico. Hemos analizado tus respuestas y un psicólogo clínico ha preparado un informe personalizado para ti.
        </p>

        ${topCategory ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFFAF2;border:2px solid rgba(106,23,140,0.15);border-radius:20px;margin:24px 0;">
          <tr>
            <td style="padding:24px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#6A178C;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Área principal detectada</p>
              <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#1a0a1f;">${topCategory}</p>
            </td>
          </tr>
        </table>` : ""}

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
          <tr>
            <td align="center">
              <a href="${reportLink}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px;">
                Ver mi informe completo →
              </a>
            </td>
          </tr>
        </table>

        <!-- Recommended next step -->
        <p style="margin:32px 0 16px;font-size:13px;font-weight:700;color:#6A178C;text-transform:uppercase;letter-spacing:1px;text-align:center;">Tu siguiente paso recomendado</p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);border-radius:20px;">
          <tr>
            <td style="padding:28px;text-align:center;color:#ffffff;">
              <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:22px;opacity:0.85;">Da el primer paso</p>
              <p style="margin:0 0 6px;font-family:'Playfair Display',Georgia,serif;font-size:24px;line-height:1.3;">Primera sesión por solo 9,99 €</p>
              <p style="margin:0 0 20px;font-size:13px;opacity:0.7;line-height:1.5;">Conoce a tu psicóloga, cuéntale qué te pasa y decide si quieres continuar. Sin compromiso.</p>
              <a href="https://mentesanapsicologia.com/test/sobrio" style="background:#ffffff;color:#6A178C;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;display:inline-block;font-size:14px;">
                Reservar mi sesión 9,99 €
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:32px 0 0;font-size:12px;color:#1a0a1f;opacity:0.4;text-align:center;line-height:1.6;">
          Recuerda: el test es solo orientativo. Solo un profesional puede hacer un diagnóstico real.
        </p>
      `,
    }),
  };
}
