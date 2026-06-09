// Newsletter de reactivación con contenido del blog que mejor rankea (tema pareja,
// según GSC). Lleva tráfico de la base al funnel 9,99€. Usa el layout estándar.
// ENVÍO: solo a segmento con consentimiento de marketing (RGPD art. 9 — salud).
import { emailLayout } from "./layout";

const PURPLE = "#6A178C";
const GOLD = "#D4AF37";
const BASE = "https://mentesanapsicologia.com";
const UTM = "utm_source=email&utm_medium=newsletter&utm_campaign=reactivacion-pareja-jun2026";

type EmailRender = { subject: string; preheader: string; html: string };

const ARTICULOS = [
  {
    slug: "pareja-evitativa-por-que-huye-cuando-la-relacion-se-pone-seria-1779480929662",
    title: "Pareja evitativa: por qué huye cuando la relación se pone seria",
    gancho: "Qué es el apego evitativo, sus señales y cómo manejarlo sin perderte tú.",
  },
  {
    slug: "tu-pareja-te-hace-ghosting-sin-romper-senales-del-abandono-emocional-1779734538782",
    title: "¿Tu pareja te hace ghosting sin romper?",
    gancho: "Identifica el ghosting silencioso y el abandono emocional dentro de la relación.",
  },
  {
    slug: "sindrome-del-abandono-que-es-realmente-y-como-superarlo-1778677941805",
    title: "Síndrome del abandono: qué es realmente y cómo superarlo",
    gancho: "El miedo a que te dejen condiciona cómo amas. Aprende a sanarlo.",
  },
  {
    slug: "ataques-de-panico-durante-las-peleas-de-pareja-guia-completa-1778589472249",
    title: "Ataques de pánico durante las peleas de pareja",
    gancho: "Por qué aparecen en plena discusión y cómo recuperar la calma.",
  },
];

export function blogReactivationEmail({ firstName }: { firstName?: string }): EmailRender {
  const name = (firstName || "").trim().split(" ")[0] || "Hola";
  const subject = "Lo que más os está resonando este mes 💜";
  const preheader = "4 lecturas sobre relaciones + tu diagnóstico por 9,99€.";

  const cards = ARTICULOS.map((a) => `
    <a href="${BASE}/blog/${a.slug}?${UTM}&utm_content=${a.slug}" target="_blank" style="text-decoration:none;display:block;margin:0 0 12px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #efeaf5;border-radius:12px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:${PURPLE};line-height:1.35;">${a.title}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#4a4a55;line-height:1.55;">${a.gancho}</p>
          <span style="font-size:13px;font-weight:700;color:${GOLD};">Leer el artículo →</span>
        </td></tr>
      </table>
    </a>`).join("");

  const content = `
    <p style="margin:0 0 16px;font-size:16px;color:#1a0a1f;line-height:1.6;">Hola ${name},</p>
    <p style="margin:0 0 18px;font-size:15px;color:#1a0a1f;line-height:1.65;">
      Este mes, lo que más estáis leyendo en nuestro blog tiene que ver con las <strong>relaciones</strong>: por qué nos cuesta el compromiso, el miedo al abandono, las discusiones que nos desbordan. Te dejamos 4 lecturas escritas por nuestras psicólogas.
    </p>

    ${cards}

    <div style="margin:26px 0 8px;padding:22px 20px;background:linear-gradient(135deg,${PURPLE},#8B2FB5);border-radius:14px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#E8D4F0;letter-spacing:.3px;">¿Te has reconocido en alguna lectura?</p>
      <p style="margin:0 0 14px;font-size:19px;font-weight:700;color:#ffffff;line-height:1.3;">Tu diagnóstico psicológico por 9,99€</p>
      <a href="${BASE}/diagnostico?${UTM}&utm_content=cta-final" target="_blank" style="display:inline-block;background:#ffffff;color:${PURPLE};font-weight:700;font-size:15px;text-decoration:none;padding:13px 30px;border-radius:999px;">Empezar mi diagnóstico →</a>
      <p style="margin:12px 0 0;font-size:11px;color:#E8D4F0;opacity:.85;">Informe + matching + sesión de 50 min · Sin permanencia</p>
    </div>

    <p style="margin:22px 0 0;font-size:11px;color:#9aa0aa;line-height:1.5;text-align:center;">
      Recibes este correo porque eres parte de Mente Sana.
      <a href="${BASE}/baja-newsletter?${UTM}" style="color:#9aa0aa;text-decoration:underline;">Darme de baja</a>.
    </p>`;

  return { subject, preheader, html: emailLayout({ title: subject, preheader, content }) };
}
