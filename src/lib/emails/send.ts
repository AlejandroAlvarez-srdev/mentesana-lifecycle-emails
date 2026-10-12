/**
 * Send transactional email via Brevo (Sendinblue) API.
 * Requires BREVO_API_KEY env var.
 */

interface Attachment {
  name: string;
  content?: string; // base64
  url?: string;     // alternativa: adjuntar por URL (Brevo lo descarga)
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  toName?: string;
  /** Override del nombre del remitente. Útil para emails "personales" de la
   *  psicóloga: el paciente ve "De: Maria Alejandra Quintero" en bandeja. */
  fromName?: string;
  replyTo?: string;
  attachments?: Attachment[];
  tags?: string[];
}

const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "hola@mentesanapsicologia.com";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "Mente Sana Psicología";

export async function sendEmail({ to, subject, html, toName, fromName, replyTo, attachments, tags }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[email] BREVO_API_KEY not set — skipping send");
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { email: SENDER_EMAIL, name: fromName?.trim() ? `${fromName.trim()} · Mente Sana` : SENDER_NAME },
        to: [{ email: to, name: toName || to }],
        subject,
        tags: tags?.length ? tags : undefined,
        htmlContent: html,
        replyTo: replyTo ? { email: replyTo } : undefined,
        attachment: attachments && attachments.length > 0 ? attachments : undefined,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[email] Brevo error:", res.status, errText);
      return { success: false, error: `Brevo ${res.status}: ${errText}` };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] Send failed:", message);
    return { success: false, error: message };
  }
}
