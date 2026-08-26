/**
 * Shared email layout — header with logo, footer with social links.
 * Uses inline styles for max email client compatibility.
 */

interface LayoutOptions {
  title: string;
  preheader?: string;
  content: string;
}

export function emailLayout({ title, preheader = "", content }: LayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600&family=Caveat:wght@500&display=swap');
  body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; background: #FFFAF2; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  .btn-purple { background: linear-gradient(135deg, #6A178C 0%, #8B2FB5 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; display: inline-block; }
  .btn-cream { background: #FFFAF2; color: #6A178C !important; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; display: inline-block; border: 2px solid #6A178C; }
  h1, h2, h3 { font-family: 'Playfair Display', Georgia, serif; font-weight: 400; }
  .handwriting { font-family: 'Caveat', cursive; }
</style>
</head>
<body style="margin:0;padding:0;background:#FFFAF2;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#1a0a1f;">
<!-- Preheader -->
<div style="display:none;font-size:1px;color:#FFFAF2;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFFAF2;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(106,23,140,0.06);border:1px solid rgba(0,0,0,0.04);">

        <!-- Header — logo oficial Mente Sana sobre fondo blanco, compacto -->
        <tr>
          <td style="background:#ffffff;padding:22px 32px 16px;text-align:center;border-bottom:1px solid rgba(106,23,140,0.08);">
            <a href="https://mentesanapsicologia.com" target="_blank" style="text-decoration:none;display:inline-block;">
              <img src="https://mentesanapsicologia.com/images/logo-email.png" alt="Mente Sana Psicología" width="160" height="37" style="display:block;width:160px;height:37px;border:0;outline:none;text-decoration:none;">
            </a>
            <p style="margin:8px 0 0;font-family:'Caveat',cursive;font-size:14px;color:#1a0a1f;opacity:0.55;line-height:1;">psicología online · con cariño</p>
            <!-- Línea dorada decorativa -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:10px auto 0;">
              <tr>
                <td style="width:40px;height:2px;background:#D4AF37;border-radius:1px;line-height:2px;font-size:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:40px 32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#FFFAF2;padding:32px;text-align:center;border-top:1px solid rgba(0,0,0,0.04);">
            <p style="margin:0 0 8px;font-family:'Caveat',cursive;font-size:22px;color:#6A178C;">Cuida tu mente, cuida tu vida</p>
            <p style="margin:0 0 16px;font-size:13px;color:#6A178C;font-weight:600;">Mente Sana Psicología</p>
            <p style="margin:0 0 16px;font-size:11px;color:#1a0a1f;opacity:0.5;line-height:1.6;">150+ psicólogas certificadas · +8.000 pacientes acompañadas<br>4.9/5 valoración media · España</p>
            <div style="margin:16px 0;">
              <a href="https://wa.me/34XXXXXXXXX" style="color:#6A178C;text-decoration:none;font-size:11px;margin:0 8px;">WhatsApp</a>
              <span style="color:#6A178C;opacity:0.3;">·</span>
              <a href="https://mentesanapsicologia.com" style="color:#6A178C;text-decoration:none;font-size:11px;margin:0 8px;">Web</a>
              <span style="color:#6A178C;opacity:0.3;">·</span>
              <a href="https://mentesanapsicologia.com/blog" style="color:#6A178C;text-decoration:none;font-size:11px;margin:0 8px;">Blog</a>
            </div>
            <p style="margin:16px 0 0;font-size:10px;color:#1a0a1f;opacity:0.3;">© ${new Date().getFullYear()} Mente Sana Psicología · Todos los derechos reservados</p>
            <p style="margin:8px 0 0;font-size:10px;color:#1a0a1f;opacity:0.3;">
              <a href="https://mentesanapsicologia.com/legal/privacidad" style="color:#1a0a1f;opacity:0.5;text-decoration:none;">Privacidad</a> ·
              <a href="https://mentesanapsicologia.com/legal/aviso-legal" style="color:#1a0a1f;opacity:0.5;text-decoration:none;">Aviso legal</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}
