/**
 * Send transactional email via Brevo (Sendinblue) API.
 * Requires BREVO_API_KEY env var.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  toName?: string;
  replyTo?: string;
}

const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "hola@mentesanapsicologia.com";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "Mente Sana Psicología";

export async function sendEmail({ to, subject, html, toName, replyTo }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
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
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent: html,
        replyTo: replyTo ? { email: replyTo } : undefined,
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
