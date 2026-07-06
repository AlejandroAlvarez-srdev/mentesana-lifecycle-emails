import { emailLayout } from "./layout";

interface Props {
  name?: string;
  psychologistName?: string;
}

const PURPLE = "#6A178C";
const PURPLE_DEEP = "#3F0E54";
const PURPLE_SOFT = "#8B2FB5";
const GOLD = "#D4AF37";
const CREAM = "#FBF7EE";
const WA_URL = "https://wa.me/34XXXXXXXXX?text=Hola%2C%20quiero%20reagendar%20mi%20diagn%C3%B3stico";

export function diagnosticoSlotTakenEmail(props: Props): { subject: string; html: string } {
  const first = (props.name || "").split(/\s+/)[0] || "";
  const greeting = first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "Hola";
  const psi = props.psychologistName || "tu psicóloga";

  const subject = "Tu diagnóstico está pagado — reagendamos tu sesión 🙏";

  const content = `
    <p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:28px;color:${GOLD};line-height:1;">¡Hola ${greeting}!</p>
    <h1 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:26px;line-height:1.2;color:#1a0a1f;font-weight:400;letter-spacing:-0.02em;">
      Tu pago llegó <em style="color:${PURPLE};font-style:normal;">perfectamente</em> — pero no quedó confirmado el horario de tu sesión.
    </h1>
    <p style="margin:0 0 14px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.65;color:#1a0a1f;opacity:0.85;">
      Sentimos el inconveniente. No pudimos confirmar tu hueco con ${psi} al terminar el pago. No te preocupes — <strong>tu sesión de diagnóstico sigue garantizada</strong> y la reagendamos contigo enseguida.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${CREAM};border:1.5px solid ${PURPLE}33;border-radius:18px;margin:0 0 24px;">
      <tr><td style="padding:24px;text-align:center;">
        <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:1.8px;text-transform:uppercase;">Para reagendar contigo</p>
        <p style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;line-height:1.2;color:${PURPLE_DEEP};font-weight:500;">
          Responde a este email con <em>"quiero reagendar"</em> o escríbenos por WhatsApp
        </p>
        <a href="${WA_URL}" target="_blank" style="background:linear-gradient(135deg,${PURPLE_DEEP} 0%,${PURPLE} 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;display:inline-block;font-size:14px;">💬 Escríbenos por WhatsApp</a>
        <p style="margin:14px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#1a0a1f;opacity:0.55;">Te respondemos en horario laboral y reservamos tu nuevo hueco.</p>
      </td></tr>
    </table>

    <p style="margin:0 0 14px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.65;color:#1a0a1f;opacity:0.75;">
      Gracias por la paciencia — vamos a estar súper atentos para que no pierdas tu diagnóstico.
    </p>
    <p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:22px;color:${PURPLE_SOFT};line-height:1;">Un abrazo,</p>
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13.5px;color:#1a0a1f;font-weight:600;">Equipo Mente Sana</p>
  `;

  return {
    subject,
    html: emailLayout({
      title: "Tu hueco se ocupó — ayúdanos a reagendar",
      preheader: `${greeting}, otra persona cogió el hueco. Responde y lo movemos contigo.`,
      content,
    }),
  };
}
