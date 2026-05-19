// Construye el HTML del contenido para un email sugerido por el agente.
// Lo envuelve la plantilla bonita (layout.ts) con header lila + footer.
import { emailLayout } from "./layout";

export interface SuggestedEmail {
  subject: string;
  preheader?: string;
  greeting?: string;
  paragraphs: string[];
  cta_label?: string;
  cta_url?: string;
  sign_off?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderSuggestedEmail(s: SuggestedEmail): string {
  const greeting = s.greeting ? `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#1a0a1f;font-weight:500;">${escapeHtml(s.greeting)}</p>` : "";
  const paragraphs = s.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a0a1f;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const cta = s.cta_label && s.cta_url
    ? `<div style="margin:28px 0;text-align:center;"><a href="${escapeHtml(s.cta_url)}" class="btn-purple" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;display:inline-block;font-size:15px;">${escapeHtml(s.cta_label)}</a></div>`
    : "";
  const signOff = s.sign_off
    ? `<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#1a0a1f;font-family:'Caveat',cursive;font-size:20px;color:#6A178C;">${escapeHtml(s.sign_off).replace(/\n/g, "<br>")}</p>`
    : "";

  const content = `${greeting}${paragraphs}${cta}${signOff}`;
  return emailLayout({ title: s.subject, preheader: s.preheader ?? "", content });
}
