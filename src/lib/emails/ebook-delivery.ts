import { emailLayout } from "./layout";

interface Props {
  name?: string;
  downloadUrl: string;
}

export function ebookDeliveryEmail({ name = "", downloadUrl }: Props): { subject: string; html: string } {
  const greeting = name ? `${name},` : "Hola,";
  return {
    subject: "📖 Tu cartilla Sanando Desde Adentro está lista",
    html: emailLayout({
      title: "Tu cartilla está lista",
      preheader: "Descarga tu manual práctico de transformación emocional",
      content: `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td align="center">
              <div style="width:72px;height:72px;background:#f3e8ff;border-radius:50%;display:inline-block;line-height:72px;text-align:center;font-size:36px;">📖</div>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;">Gracias por tu compra</p>
        <h1 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:32px;line-height:1.2;color:#1a0a1f;text-align:center;font-weight:400;">
          ${greeting} tu viaje empieza aquí
        </h1>

        <p style="margin:0 0 32px;font-size:16px;line-height:1.7;color:#1a0a1f;opacity:0.7;text-align:center;">
          Tu ejemplar de <strong style="color:#6A178C;">Sanando Desde Adentro — Tu Manual Práctico de Transformación Emocional</strong> está listo para descargar.
        </p>

        <!-- Download CTA -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);border-radius:20px;margin:24px 0;">
          <tr>
            <td style="padding:36px 28px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#ffffff;opacity:0.7;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Tu cartilla</p>
              <p style="margin:0 0 20px;font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#ffffff;line-height:1.3;">Sanando Desde Adentro</p>
              <a href="${downloadUrl}" style="background:#ffffff;color:#6A178C;text-decoration:none;padding:16px 40px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px;">
                📥 Descargar PDF
              </a>
              <p style="margin:18px 0 0;font-size:11px;color:#ffffff;opacity:0.5;">Enlace privado · Guárdalo en un lugar seguro</p>
            </td>
          </tr>
        </table>

        <!-- What's inside -->
        <p style="margin:32px 0 16px;font-size:13px;font-weight:700;color:#6A178C;text-transform:uppercase;letter-spacing:1px;text-align:center;">Qué encontrarás dentro</p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          ${[
            { icon: "💜", title: "Autoestima", desc: "Reconocer tu valor y tratarte con amabilidad" },
            { icon: "🌿", title: "Ansiedad", desc: "Herramientas para calmar tu mente" },
            { icon: "⚡", title: "Estrés", desc: "Aprender a soltar lo que no puedes controlar" },
            { icon: "🕊️", title: "Manejo del duelo", desc: "Atravesar la pérdida con compasión" },
            { icon: "💞", title: "Relaciones de pareja", desc: "Comunicación sana y vínculos seguros" },
            { icon: "🧠", title: "TDAH en adultos", desc: "Estrategias para el día a día" },
            { icon: "🌙", title: "Depresión", desc: "Recuperar el sentido poco a poco" },
            { icon: "💎", title: "TLP", desc: "Regulación emocional y estabilidad" },
          ]
            .map(
              (i) => `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="32" valign="top" style="font-size:20px;">${i.icon}</td>
                  <td><strong style="font-size:14px;color:#1a0a1f;">${i.title}</strong><br><span style="font-size:12px;color:#1a0a1f;opacity:0.5;">${i.desc}</span></td>
                </tr>
              </table>
            </td>
          </tr>`,
            )
            .join("")}
        </table>

        <!-- How to use -->
        <p style="margin:36px 0 12px;font-size:13px;font-weight:700;color:#6A178C;text-transform:uppercase;letter-spacing:1px;text-align:center;">Cómo usarla</p>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#1a0a1f;opacity:0.65;text-align:center;">
          Hazla tuya · Sin juicios · Realiza los ejercicios con tranquilidad · A tu ritmo · Tómate el tiempo necesario para reflexionar.
        </p>

        <p style="margin:32px 0 0;font-size:12px;color:#1a0a1f;opacity:0.4;text-align:center;line-height:1.6;">
          ¿Problemas con la descarga? Escríbenos por WhatsApp al <a href="https://wa.me/34XXXXXXXXX" style="color:#6A178C;text-decoration:none;">+34 XXX XXX XXX</a>
        </p>
      `,
    }),
  };
}
