import { emailLayout } from "./layout";

export function reviewRequestEmail({ customer_first, provider_first, token, session_date }: { customer_first: string; provider_first: string; token: string; session_date: string }) {
  const url = `https://mentesanapsicologia.com/review/${token}`;
  const dateStr = new Date(session_date).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "long" });
  const content = `
    <h1 style="font-family: Georgia, serif; font-size: 28px; color: #1a1a2e; margin: 0 0 12px;">Hola ${customer_first || "💜"}</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 16px;">¿Cómo te fue la sesión con ${provider_first} del ${dateStr}?</p>
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px;">Tu feedback nos ayuda a cuidarte mejor. Son <strong>2 minutos</strong> y es totalmente confidencial — tu psicóloga no ve quién dejó cada review individual.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="display: inline-block; padding: 16px 36px; background: #6A178C; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px;">Dejar mi feedback →</a>
    </div>
    <p style="font-size: 13px; color: #888; line-height: 1.5; margin: 20px 0 0;">Este enlace caduca en 14 días. Si tienes alguna preocupación urgente, escríbenos a <a href="mailto:cto@example.com" style="color: #6A178C;">cto@example.com</a>.</p>
  `;
  return {
    subject: `¿Cómo te fue con ${provider_first}? 💜`,
    html: emailLayout({ title: `Tu feedback sobre ${provider_first}`, preheader: `2 minutos. Confidencial.`, content }),
  };
}
