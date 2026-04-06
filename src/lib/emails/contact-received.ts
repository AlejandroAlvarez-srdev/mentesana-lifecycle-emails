import { emailLayout } from "./layout";

interface Props {
  name?: string;
}

export function contactReceivedEmail({ name = "" }: Props = {}): { subject: string; html: string } {
  const greeting = name ? `${name},` : "Hola,";
  return {
    subject: "Hemos recibido tu mensaje 💜 — Mente Sana",
    html: emailLayout({
      title: "Mensaje recibido",
      preheader: "Te contactaremos en menos de 24 horas.",
      content: `
        <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;">Mensaje recibido</p>
        <h1 style="margin:0 0 24px;font-family:'Playfair Display',Georgia,serif;font-size:32px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;">${greeting} gracias por escribirnos</h1>

        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.7;">
          Hemos recibido tu mensaje correctamente. Una de nuestras psicólogas lo revisará y te responderá personalmente en <strong>menos de 24 horas</strong>.
        </p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.7;">
          Mientras tanto, te dejamos algunos recursos que pueden serte útiles:
        </p>

        <!-- Resources -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.1);border-radius:16px;padding:20px;">
              <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#6A178C;">📝 Test gratuito de salud mental</p>
              <p style="margin:0 0 12px;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.5;">3 minutos. Recibe un informe personalizado de tu estado emocional.</p>
              <a href="https://mentesanapsicologia.com/test/sobrio" style="color:#6A178C;text-decoration:none;font-size:13px;font-weight:600;">Hacer el test →</a>
            </td>
          </tr>
          <tr><td style="height:10px;"></td></tr>
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.1);border-radius:16px;padding:20px;">
              <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#6A178C;">📚 Blog con +500 artículos</p>
              <p style="margin:0 0 12px;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.5;">Recursos sobre ansiedad, autoestima, relaciones y más.</p>
              <a href="https://mentesanapsicologia.com/blog" style="color:#6A178C;text-decoration:none;font-size:13px;font-weight:600;">Leer el blog →</a>
            </td>
          </tr>
          <tr><td style="height:10px;"></td></tr>
          <tr>
            <td style="background:#FFFAF2;border:1px solid rgba(106,23,140,0.1);border-radius:16px;padding:20px;">
              <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#6A178C;">💬 Habla con nosotras por WhatsApp</p>
              <p style="margin:0 0 12px;font-size:13px;color:#1a0a1f;opacity:0.6;line-height:1.5;">Si es urgente, escríbenos directamente.</p>
              <a href="https://wa.me/34XXXXXXXXX" style="color:#6A178C;text-decoration:none;font-size:13px;font-weight:600;">Abrir WhatsApp →</a>
            </td>
          </tr>
        </table>

        <p style="margin:32px 0 0;font-size:12px;color:#1a0a1f;opacity:0.4;text-align:center;">Un abrazo grande,<br><strong style="color:#6A178C;">El equipo de Mente Sana</strong></p>
      `,
    }),
  };
}
