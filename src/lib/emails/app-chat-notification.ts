import { emailLayout } from "./layout";

// Link universal que intenta abrir la app (mentesana://chat/{id}) y si el esquema
// custom no dispara en 500ms, redirige a la ficha Play Store como fallback.
// La landing vive en /app-redirect.
function redirectUrl(conversationId: string) {
  const to = encodeURIComponent(`/chat/${conversationId}`);
  return `https://mentesanapsicologia.com/app-redirect?to=${to}`;
}

const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.mentesanapsicologia.com";
const APP_STORE = "https://apps.apple.com/co/app/mente-sana-app/id6769225141";

interface Props {
  firstName?: string | null;
  conversationId: string;
  messageCount: number;
  lastMessageBody?: string | null;
}

// Notificación al usuario: tu psicóloga/soporte te ha escrito en la app.
// Un solo email por conversación cada 15min (coalescing). Copy corto tipo push.
export function appChatNotificationEmail({ firstName, conversationId, messageCount, lastMessageBody }: Props): { subject: string; html: string } {
  const hi = firstName?.trim() || "hola";
  const n = Math.max(1, messageCount);
  const plural = n === 1 ? "mensaje nuevo" : "mensajes nuevos";
  const subject = n === 1
    ? `💬 Tienes un mensaje nuevo en la app de Mente Sana`
    : `💬 Tienes ${n} mensajes nuevos en la app de Mente Sana`;

  const openLink = redirectUrl(conversationId);
  const preview = (lastMessageBody ?? "").trim().slice(0, 160);

  return {
    subject,
    html: emailLayout({
      title: `Tienes ${n} ${plural}`,
      preheader: preview || "Abre la app para verlos y responder.",
      content: `
        <!-- Hero -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:-8px 0 22px;">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#F0E3F7 0%,#FBF4E8 100%);border:1px solid rgba(106,23,140,0.15);border-radius:24px;padding:34px 24px;">
              <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;line-height:1;">te acabamos de escribir</p>
              <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.2;color:#1a0a1f;font-weight:400;letter-spacing:-0.4px;">
                ${hi}, tienes <em style="color:#6A178C;font-style:italic;">${n} ${plural}</em><br>en tu chat de la app.
              </h1>
            </td>
          </tr>
        </table>

        ${preview ? `
        <!-- Preview del último mensaje -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 22px;">
          <tr>
            <td style="background:#ffffff;border:1px solid rgba(106,23,140,0.15);border-left:3px solid #6A178C;border-radius:12px;padding:16px 18px;">
              <p style="margin:0 0 6px;font-size:10px;color:#6A178C;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">Último mensaje</p>
              <p style="margin:0;font-size:14px;color:#1a0a1f;line-height:1.55;font-style:italic;">"${escapeHtml(preview)}${(lastMessageBody ?? "").length > 160 ? "…" : ""}"</p>
            </td>
          </tr>
        </table>
        ` : ""}

        <!-- CTA principal — abre app o Play Store -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 20px;">
          <tr>
            <td align="center">
              <a href="${openLink}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:16px 34px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px;letter-spacing:0.1px;box-shadow:0 6px 20px rgba(106,23,140,0.24);">
                Abrir chat en la app →
              </a>
            </td>
          </tr>
        </table>

        <!-- Micro copy -->
        <p style="margin:0 0 26px;font-size:12px;color:#1a0a1f;opacity:0.6;line-height:1.55;text-align:center;">
          Si aún no tienes la app instalada, el enlace te lleva directo a descargarla.
        </p>

        <!-- Badges store (fallback visual) -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 26px;">
          <tr>
            <td align="center" style="padding:0 8px;">
              <a href="${PLAY_STORE}" style="display:inline-block;margin:4px 6px;">
                <img src="https://mentesanapsicologia.com/images/app/google-play-badge.png" alt="Google Play" width="140" style="display:block;width:140px;height:auto;border:0;">
              </a>
              <a href="${APP_STORE}" style="display:inline-block;margin:4px 6px;">
                <img src="https://mentesanapsicologia.com/images/app/app-store-badge.png" alt="App Store" width="140" style="display:block;width:140px;height:auto;border:0;">
              </a>
            </td>
          </tr>
        </table>

        <!-- Firma -->
        <p style="margin:24px 0 0;font-family:'Caveat',cursive;font-size:24px;color:#6A178C;text-align:center;line-height:1;">te esperamos,</p>
        <p style="margin:6px 0 0;font-size:13px;color:#1a0a1f;opacity:0.55;text-align:center;">El equipo de Mente Sana</p>
      `,
    }),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
