// Correos del FUNNEL de captación (Ad → landing 9,99 → Deal Won / carrito → cadena).
// Todos usan el layout maestro de Mente Sana (layout.ts): crema #FFFAF2, lila #6A178C,
// dorado, tipografías Playfair/Inter/Caveat. Cada función devuelve { subject, html }.
//
// Cadena cubierta:
//  - Recontacto Compra 1 / Recontacto Compra 2 + Oferta Bonos (recuperación de carrito)
//  - Bienvenida (tras Deal Won)
//  - Nurturing por vertical (familia/crianza, pareja/ruptura, ansiedad, estrés-burnout)
//  - Bonos y Ofertas
//  - Seguimiento y Calificación (→ reseña Google)
import { emailLayout } from "./layout";

const PURPLE = "#6A178C";
const SITE = "https://mentesanapsicologia.com";
const GOOGLE_REVIEW = "https://g.page/r/mentesana/review"; // TODO: sustituir por el enlace real de reseña

export interface FunnelProps {
  firstName?: string;
  email: string;
}

// ───────────────────────── helpers de maquetación ─────────────────────────
const hi = (n?: string) => n || "hola";

function kicker(t: string): string {
  return `<p style="margin:0 0 6px;font-family:'Caveat',cursive;font-size:24px;color:${PURPLE};line-height:1;">${t}</p>`;
}
function h1(t: string): string {
  return `<h1 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:30px;line-height:1.18;color:#1a0a1f;font-weight:500;letter-spacing:-0.4px;">${t}</h1>`;
}
function para(t: string): string {
  return `<p style="margin:0 0 18px;font-size:15.5px;line-height:1.75;color:#1a0a1f;opacity:0.85;">${t}</p>`;
}
function cta(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:6px 0 26px;"><tr><td align="center">
    <a href="${href}" style="background:linear-gradient(135deg,#6A178C 0%,#8B2FB5 100%);color:#ffffff !important;text-decoration:none;padding:16px 38px;border-radius:999px;font-weight:700;display:inline-block;font-size:16px;box-shadow:0 8px 30px rgba(106,23,140,0.28);">${label}</a>
  </td></tr></table>`;
}
function reassure(t: string): string {
  return `<p style="margin:0 0 26px;font-size:12.5px;line-height:1.6;color:#1a0a1f;opacity:0.55;text-align:center;">${t}</p>`;
}
function box(inner: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;"><tr>
    <td style="background:linear-gradient(135deg,#FBF4E8 0%,#F0E3F7 100%);border:1px solid rgba(106,23,140,0.22);border-radius:18px;padding:22px 24px;">${inner}</td>
  </tr></table>`;
}
function quote(t: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:4px 0 24px;"><tr>
    <td style="border-left:3px solid ${PURPLE};padding:6px 0 6px 16px;">
      <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:16px;line-height:1.5;color:#1a0a1f;opacity:0.8;">${t}</p>
    </td></tr></table>`;
}
function signature(): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:8px 0 0;border-top:1px solid rgba(106,23,140,0.12);"><tr><td style="padding-top:22px;">
    <p style="margin:0;font-family:'Caveat',cursive;font-size:24px;color:${PURPLE};line-height:1;">Con cariño,</p>
    <p style="margin:6px 0 0;font-size:13px;color:${PURPLE};font-weight:700;">El equipo de Mente Sana</p>
  </td></tr></table>`;
}

// ───────────────────────── 1) Recontacto Compra 1 ─────────────────────────
export function funnelRecontacto1Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${firstName ? firstName + ", t" : "T"}u primera sesión te está esperando 💜`,
    html: emailLayout({
      title: "Retoma tu reserva",
      preheader: "Estabas a un paso de empezar tu proceso. Lo retomamos cuando quieras.",
      content: `
        ${kicker(`${hi(firstName)}, casi lo tienes`)}
        ${h1("Estabas a un paso de <em style=\"color:" + PURPLE + ";font-style:italic;\">empezar</em>.")}
        ${para("Vimos que diste el primer paso para reservar tu <strong>sesión de diagnóstico (9,99&nbsp;€)</strong> con una psicóloga colegiada, pero no llegaste a confirmarla. Pasa, no te preocupes.")}
        ${para("Esa primera sesión es donde tu psicóloga te conoce, entiende qué te trae y te dice cómo te puede acompañar. Sin compromisos, a tu ritmo.")}
        ${cta(`${SITE}/test-diagnostico`, "Retomar mi reserva →")}
        ${reassure("Pago único de 9,99&nbsp;€ · sin suscripción ni renovación automática · con psicóloga colegiada.")}
        ${signature()}
      `,
    }),
  };
}

// ─────────────────── 2) Recontacto Compra 2 + Oferta Bonos ───────────────────
export function funnelRecontacto2BonosEmail({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${firstName ? firstName + ", ¿" : "¿"}lo retomamos? (te guardamos tu sitio)`,
    html: emailLayout({
      title: "Sigue tu sitio guardado",
      preheader: "Tu psicóloga y un proceso pensado para ti — y una forma de hacerlo más fácil.",
      content: `
        ${kicker(`${hi(firstName)}, sin prisa pero…`)}
        ${h1("Tu proceso sigue aquí, <em style=\"color:" + PURPLE + ";font-style:italic;\">esperándote</em>.")}
        ${para("Sabemos que dar el paso cuesta. Por eso te lo ponemos fácil: empiezas con la sesión de diagnóstico de <strong>9,99&nbsp;€</strong> y, si encajas con tu psicóloga, puedes continuar con un <strong>bono de sesiones</strong> a mejor precio que sueltas.")}
        ${box(`
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Por qué un bono</p>
          <p style="margin:0 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#1a0a1f;font-weight:400;">Continuidad real, a mejor precio</p>
          <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.8;line-height:1.65;">El cambio de verdad ocurre con varias sesiones seguidas con la misma psicóloga. El bono te asegura esa continuidad y te sale más económico por sesión.</p>
        `)}
        ${cta(`${SITE}/test-diagnostico`, "Reservar mi sesión →")}
        ${reassure("Empiezas por la sesión de 9,99&nbsp;€ · el bono es opcional y siempre lo decides tú.")}
        ${signature()}
      `,
    }),
  };
}

// ───────────────────────── 3) Bienvenida (Deal Won) ─────────────────────────
export function funnelBienvenidaEmail({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: "Bienvenida a Mente Sana 💜",
    html: emailLayout({
      title: "Bienvenida a Mente Sana",
      preheader: "Has dado un paso enorme por ti. Esto es lo que pasa ahora.",
      content: `
        ${kicker(`${hi(firstName)},`)}
        ${h1("Bienvenida a <em style=\"color:" + PURPLE + ";font-style:italic;\">Mente Sana</em>.")}
        ${para("Acabas de dar un paso que mucha gente posterga durante años: <strong>poner tu bienestar primero</strong>. Gracias por confiar en nosotras.")}
        ${box(`
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Qué pasa ahora</p>
          <p style="margin:0 0 8px;font-size:14px;color:#1a0a1f;opacity:0.85;line-height:1.6;">1️⃣ Tu psicóloga recibe tu información y <strong>llega preparada</strong> a tu primera sesión.</p>
          <p style="margin:0 0 8px;font-size:14px;color:#1a0a1f;opacity:0.85;line-height:1.6;">2️⃣ Te conectas por videollamada, desde donde estés, sin desplazarte.</p>
          <p style="margin:0;font-size:14px;color:#1a0a1f;opacity:0.85;line-height:1.6;">3️⃣ Entre sesiones tienes la <strong>app</strong>: diario, meditaciones, audiolibros y tu asistente.</p>
        `)}
        ${cta(`${SITE}/app`, "Entrar en la app →")}
        ${quote("Tu mente merece el mismo cuidado que tu cuerpo.")}
        ${signature()}
      `,
    }),
  };
}

// ───────────────────────── 4) Nurturing por vertical ─────────────────────────
type Vertical = "familia" | "pareja" | "ansiedad" | "burnout";

const NURTURING: Record<Vertical, { label: string; subject: string; kicker: string; h1: string; empathy: string; tipTitle: string; tip: string }> = {
  familia: {
    label: "Familia / crianza",
    subject: "Criar también te pasa factura (y está bien pedir ayuda)",
    kicker: "crianza y familia",
    h1: "No tienes que poder con <em style=\"color:" + PURPLE + ";font-style:italic;\">todo</em>.",
    empathy: "La crianza desgasta de formas que casi nadie nombra: la culpa, el cansancio, sentir que nunca es suficiente. Que te cueste no significa que lo estés haciendo mal — significa que eres humana.",
    tipTitle: "Una idea para hoy",
    tip: "Antes de corregir, <strong>valida</strong>: \"entiendo que estés enfadado\" baja la tensión más rápido que cualquier orden. Y aplícatelo también a ti: valida tu cansancio en vez de pelearte con él.",
  },
  pareja: {
    label: "Pareja / ruptura",
    subject: "Cuando la relación duele (o cuando termina)",
    kicker: "pareja y rupturas",
    h1: "Lo que sientes <em style=\"color:" + PURPLE + ";font-style:italic;\">tiene sentido</em>.",
    empathy: "Tanto si estás intentando reconstruir un vínculo como si estás atravesando una ruptura, el dolor es real y merece espacio. No hace falta \"superarlo rápido\" ni hacerlo sola.",
    tipTitle: "Una idea para hoy",
    tip: "El duelo de una relación <strong>no es lineal</strong>: habrá días buenos y recaídas, y ambas cosas son normales. Hoy, un solo paso pequeño que sea por ti, no por la otra persona.",
  },
  ansiedad: {
    label: "Ansiedad",
    subject: "Si tu cabeza no para, esto es para ti",
    kicker: "ansiedad",
    h1: "Tu mente acelerada <em style=\"color:" + PURPLE + ";font-style:italic;\">se puede calmar</em>.",
    empathy: "La ansiedad no es debilidad ni \"pensar demasiado\": es tu sistema de alarma activado de más. Y, como toda alarma, se puede aprender a regular.",
    tipTitle: "Prueba ahora: 5-4-3-2-1",
    tip: "Nombra <strong>5</strong> cosas que ves, <strong>4</strong> que oyes, <strong>3</strong> que tocas, <strong>2</strong> que hueles y <strong>1</strong> que saboreas. Anclar los sentidos al presente corta la espiral de pensamiento.",
  },
  burnout: {
    label: "Estrés / burnout",
    subject: "Estar al límite no es tu nueva normalidad",
    kicker: "estrés y burnout",
    h1: "El agotamiento <em style=\"color:" + PURPLE + ";font-style:italic;\">avisa</em>, no falla.",
    empathy: "Levantarte ya cansada, la irritabilidad, desconectar de lo que antes te gustaba… el burnout no se arregla con \"descansar el finde\". Es una señal de que algo necesita cambiar, y se puede trabajar.",
    tipTitle: "Una idea para hoy",
    tip: "Mete <strong>micro-pausas</strong> reales: 2 minutos cada hora sin pantalla, solo respirando. Y empieza a practicar un \"no\" pequeño esta semana — los límites también son autocuidado.",
  },
};

export function funnelNurturingEmail({ firstName, vertical }: FunnelProps & { vertical: Vertical }): { subject: string; html: string } {
  const v = NURTURING[vertical];
  return {
    subject: v.subject,
    html: emailLayout({
      title: v.label,
      preheader: v.empathy.replace(/<[^>]+>/g, "").slice(0, 110),
      content: `
        ${kicker(v.kicker)}
        ${h1(v.h1)}
        ${para(`${hi(firstName)}, ${v.empathy}`)}
        ${box(`
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">${v.tipTitle}</p>
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.85;line-height:1.7;">${v.tip}</p>
        `)}
        ${para("Y si quieres ir a la raíz, una psicóloga colegiada puede acompañarte. La primera sesión son <strong>9,99&nbsp;€</strong>.")}
        ${cta(`${SITE}/test-diagnostico`, "Hablar con una psicóloga →")}
        ${signature()}
      `,
    }),
  };
}

// ══════════════════════════════════════════════════════════════════════════
// SECUENCIA LEADGEN (Meta leadgen → comprar el diagnóstico 9,99€)
// Versión "con esteroides" de los 6 steps que vivían en meta_lead_templates:
// mismo arco, copy de alta conversión + diseño Mente Sana completo.
// {que_buscas} = lo que la persona puso en el formulario de Meta.
// ══════════════════════════════════════════════════════════════════════════
const DIAG = `${SITE}/diagnostico`;

// Step 1 — Detalles / bienvenida del lead (inmediato, +5 min)
export function funnelLeadgen1Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${hi(firstName) === "hola" ? "Aquí está" : firstName + ", aquí está"} todo tu diagnóstico (y por qué 9,99€)`,
    html: emailLayout({
      title: "Los detalles de tu diagnóstico",
      preheader: "Una psicóloga colegiada, un informe que es tuyo, por 9,99€. Sin suscripción.",
      content: `
        ${kicker(`${hi(firstName)}, gracias por dar el paso`)}
        ${h1("Esto es <em style=\"color:" + PURPLE + ";font-style:italic;\">exactamente</em> lo que incluye.")}
        ${para("Diste el primer paso por ti, y eso ya importa. Aquí tienes todo, claro y sin letra pequeña:")}
        ${box(`
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">💜 <strong>9,99€ pago único.</strong> Sin suscripción ni renovación automática.</p>
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">💜 <strong>Tú eliges</strong> psicóloga, día y hora — 100% online.</p>
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">💜 <strong>Test clínico validado</strong> (PHQ-9, GAD-7) + sesión de <strong>50 min</strong>.</p>
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">💜 <strong>Informe firmado</strong> por psicóloga colegiada al terminar. Es tuyo.</p>
        `)}
        ${para("Si lo que escribiste fue algo sobre tu día a día, no te preocupes: una de nuestras psicólogas ya tiene experiencia <strong>exacta</strong> con eso.")}
        ${cta(DIAG, "Reservar mi diagnóstico (9,99€) →")}
        ${reassure("Pago único · sin suscripción · psicóloga colegiada · devolución garantizada.")}
        ${signature()}
      `,
    }),
  };
}

// Step 2 — Diferenciación vs "sesión gratis" (+1 h)
export function funnelLeadgen2Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${hi(firstName) === "hola" ? "Por qué" : firstName + ", por qué"} cobramos 9,99€ (y no "gratis")`,
    html: emailLayout({
      title: "La diferencia honesta",
      preheader: "La 'sesión gratis' sale cara. Te contamos por qué cobramos 9,99€.",
      content: `
        ${kicker(`${hi(firstName)}, seamos honestos`)}
        ${h1("\"Gratis\" casi nunca <em style=\"color:" + PURPLE + ";font-style:italic;\">sale gratis</em>.")}
        ${para("La mayoría de plataformas te ofrecen una \"sesión gratis\". Suena bien… hasta que entras: <strong>20 minutos de comercial</strong>, te asignan un psicólogo al azar, y al final solo te empujan un bono caro.")}
        ${para("Cobramos 9,99€ <strong>precisamente para no hacer eso</strong>. Por ese precio simbólico recibes:")}
        ${box(`
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">✅ <strong>Matching clínico</strong>, no al azar — la psicóloga adecuada para tu caso.</p>
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">✅ <strong>50 minutos</strong> de sesión real, no 20 de venta.</p>
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">✅ Un <strong>informe escrito</strong> que te llevas tú.</p>
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">✅ Si no continúas, <strong>te devolvemos el dinero</strong> sin preguntas.</p>
        `)}
        ${cta(`${SITE}/por-que-diagnostico`, "Empezar mi diagnóstico →")}
        ${signature()}
      `,
    }),
  };
}

// Step 3 — Prueba social / testimonios (+1 día)
export function funnelLeadgen3Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `No estás sol@${firstName ? ", " + firstName : ""} — esto cuentan otras personas`,
    html: emailLayout({
      title: "Personas como tú",
      preheader: "Miles llegaron describiendo justo lo que sientes tú. Esto les pasó.",
      content: `
        ${kicker(`${hi(firstName)}, léelo con calma`)}
        ${h1("Empezar desde <em style=\"color:" + PURPLE + ";font-style:italic;\">algún sitio</em>, no desde cero.")}
        ${para("Miles de personas llegaron a Mente Sana describiendo justo lo que nos contaste tú. Tres de ellas, después de su diagnóstico:")}
        ${quote("\"Por primera vez sentí que estaba empezando desde algún sitio, no desde cero otra vez.\" — Laura M., 29")}
        ${quote("\"Llevaba dos años pensando que era solo una mala racha. Entendí más sobre mí en 50 minutos que en todo ese tiempo dándole vueltas.\" — Marta G., 34")}
        ${quote("\"Lo de los 9,99€ me hizo probar sin pensarlo. Hoy, ocho meses después, es lo mejor que he hecho por mí en años.\" — Diego L., 41")}
        ${cta(DIAG, "Quiero entender qué me pasa →")}
        ${signature()}
      `,
    }),
  };
}

// Step 4 — Objeción "¿soy yo el problema?" (+3 días)
export function funnelLeadgen4Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${hi(firstName) === "hola" ? "Una pregunta honesta" : firstName + ", una pregunta honesta"} sobre por qué dudas`,
    html: emailLayout({
      title: "Sobre tu duda",
      preheader: "La pregunta no es '¿me funcionará?'. Es otra.",
      content: `
        ${kicker(`${hi(firstName)}, con cariño`)}
        ${h1("No estás <em style=\"color:" + PURPLE + ";font-style:italic;\">roto</em>.")}
        ${para("Llevas unos días con la info del diagnóstico en tu correo. Sé que dudas, porque la mayoría duda. Y casi siempre la pregunta real no es <em>\"¿me funcionará?\"</em>, sino <strong>\"¿soy yo el problema?\"</strong>.")}
        ${para("La respuesta es <strong>no</strong>. No estás roto. Tienes algo concreto que un profesional puede ayudarte a entender y a trabajar. Eso no se arregla solo dándole vueltas a las 3 de la madrugada.")}
        ${box(`
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.85;line-height:1.7;">Y si después de tu sesión sientes que no te aportó, <strong>te devolvemos los 9,99€</strong>. Sin preguntas, sin formularios. El riesgo lo ponemos nosotras.</p>
        `)}
        ${cta(DIAG, "OK, lo voy a probar (9,99€) →")}
        ${signature()}
      `,
    }),
  };
}

// Step 5 — Última oferta / recap completo (+7 días)
export function funnelLeadgen5Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${hi(firstName) === "hola" ? "Tu" : firstName + ", tu"} diagnóstico + plan personalizado a 9,99€`,
    html: emailLayout({
      title: "Tu diagnóstico, recapitulado",
      preheader: "El precio simbólico para entender, por fin, qué te pasa.",
      content: `
        ${kicker(`${hi(firstName)}, un recordatorio`)}
        ${h1("9,99€ para <em style=\"color:" + PURPLE + ";font-style:italic;\">entender qué te pasa</em>.")}
        ${para("Hace una semana te interesaste por el diagnóstico. Te lo recapitulo entero, para que decidas con todo claro. Por <strong>9,99€</strong> —un precio pensado para que cualquiera pueda dar el primer paso— recibes:")}
        ${box(`
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">📋 <strong>Test clínico</strong> de 30 preguntas validadas (PHQ-9, GAD-7).</p>
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">🎯 <strong>Matching</strong> con la psicóloga ideal para tu caso.</p>
          <p style="margin:0 0 9px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">📄 <strong>Informe personalizado</strong> de 5-7 páginas, firmado por colegiada.</p>
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">🎥 <strong>Sesión de 50 minutos</strong> online.</p>
        `)}
        ${para("Si no te aporta valor, te devolvemos los 9,99€ sin preguntas.")}
        ${cta(DIAG, "Empezar mi diagnóstico (9,99€) →")}
        ${signature()}
      `,
    }),
  };
}

// Step 6 — Cierre amable + recursos de crisis (+14 días)
export function funnelLeadgen6Email({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `Sin presión${firstName ? ", " + firstName : ""} — aquí seguimos cuando estés`,
    html: emailLayout({
      title: "Cuando estés lista, aquí estaremos",
      preheader: "Es el último mensaje de la secuencia. La ayuda sigue aquí.",
      content: `
        ${kicker(`${hi(firstName)},`)}
        ${h1("Cuando estés <em style=\"color:" + PURPLE + ";font-style:italic;\">lista</em>, aquí estaremos.")}
        ${para("Este es el último mensaje de la secuencia — no te molestaremos más. Pero quería que supieras una cosa: si en algún momento sientes que quieres dar el paso, nuestras psicólogas siguen aquí. El precio del diagnóstico no cambia: <strong>9,99€</strong>. La ayuda, tampoco.")}
        ${box(`
          <p style="margin:0;font-size:13.5px;color:#1a0a1f;opacity:0.8;line-height:1.7;">Si sientes que tu situación es <strong>urgente</strong>, no esperes: llama al <strong>024</strong> (atención a la conducta suicida, gratis y 24h) o al <strong>112</strong> si hay riesgo inmediato.</p>
        `)}
        ${cta(DIAG, "Reservar cuando esté lista →")}
        ${para("Cuídate mucho. De verdad. 💜")}
        ${signature()}
      `,
    }),
  };
}

// ───────── 4.5) Leadgen · Cómo funciona, paso a paso (transparencia) ─────────
// Email para la secuencia de captación de leads (Meta leadgen → comprar el 9,99€).
// Ataca la objeción nº1: no es el precio, es no saber qué hay al otro lado.
export function funnelLeadgenComoFuncionaEmail({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${firstName ? firstName + ", e" : "E"}sto es exactamente lo que pasa cuando reservas`,
    html: emailLayout({
      title: "Cómo funciona, paso a paso",
      preheader: "De 9,99€ a tu informe firmado por psicóloga colegiada, sin sorpresas.",
      content: `
        ${kicker("sin letra pequeña")}
        ${h1("Qué pasa, <em style=\"color:" + PURPLE + ";font-style:italic;\">paso a paso</em>.")}
        ${para(`${hi(firstName)}, casi siempre lo que frena no es el precio —son <strong>9,99&nbsp;€</strong>— sino no saber qué hay al otro lado. Te lo contamos sin rodeos:`)}
        ${box(`
          <p style="margin:0 0 10px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">1️⃣ <strong>Eliges psicóloga</strong> + día y hora, 100% online.</p>
          <p style="margin:0 0 10px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">2️⃣ Haces un <strong>test clínico validado</strong> (PHQ-9, GAD-7).</p>
          <p style="margin:0 0 10px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">3️⃣ <strong>Sesión real de 50 minutos</strong> por videollamada, no 20 de comercial.</p>
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">4️⃣ Te llevas un <strong>informe firmado</strong> por psicóloga colegiada. Es tuyo.</p>
        `)}
        ${para("Y si al terminar sientes que no te aportó, <strong>te devolvemos los 9,99&nbsp;€ sin preguntas</strong>. El único riesgo real es seguir como estás.")}
        ${cta(`${SITE}/diagnostico`, "Reservar mi diagnóstico (9,99€) →")}
        ${reassure("Pago único · sin suscripción · psicóloga colegiada · devolución garantizada.")}
        ${signature()}
      `,
    }),
  };
}

// ───────────────────────── 5) Bonos y Ofertas ─────────────────────────
export function funnelBonosOfertasEmail({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: "Tu proceso, más fácil: bonos de sesiones 💜",
    html: emailLayout({
      title: "Bonos de sesiones",
      preheader: "Más continuidad y mejor precio por sesión con la misma psicóloga.",
      content: `
        ${kicker(`${hi(firstName)}, para seguir avanzando`)}
        ${h1("El cambio ocurre con <em style=\"color:" + PURPLE + ";font-style:italic;\">continuidad</em>.")}
        ${para("Una sesión abre el camino; varias seguidas con la misma psicóloga es donde de verdad notas el cambio. Por eso tenemos los <strong>bonos</strong>: continuidad asegurada y mejor precio por sesión.")}
        ${box(`
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${PURPLE};letter-spacing:0.12em;text-transform:uppercase;">Bonos disponibles</p>
          <p style="margin:0 0 8px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">💜 <strong>Individual</strong> — para empezar sin compromiso.</p>
          <p style="margin:0 0 8px;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">💜 <strong>Compañía</strong> — varias sesiones para coger ritmo.</p>
          <p style="margin:0;font-size:14.5px;color:#1a0a1f;opacity:0.88;line-height:1.6;">💜 <strong>Felicidad</strong> — el proceso completo, al mejor precio por sesión.</p>
        `)}
        ${cta(`${SITE}/bonos`, "Ver los bonos →")}
        ${reassure("Sin suscripción ni permanencia · eliges el bono que encaja contigo.")}
        ${signature()}
      `,
    }),
  };
}

// ───────────────────── 6) Seguimiento y Calificación ─────────────────────
export function funnelSeguimientoEmail({ firstName }: FunnelProps): { subject: string; html: string } {
  return {
    subject: `${firstName ? firstName + ", ¿" : "¿"}cómo te has sentido?`,
    html: emailLayout({
      title: "¿Cómo te has sentido?",
      preheader: "Nos importa de verdad cómo va tu proceso — y tu opinión ayuda a otras personas.",
      content: `
        ${kicker(`${hi(firstName)},`)}
        ${h1("Queremos saber <em style=\"color:" + PURPLE + ";font-style:italic;\">cómo vas</em>.")}
        ${para("Has tenido tus primeras sesiones y, de verdad, nos importa cómo te has sentido. Tu psicóloga está para acompañarte el tiempo que necesites — ni más ni menos.")}
        ${para("Si te ha ayudado, <strong>contarlo en una reseña</strong> hace que otra persona que lo está pasando mal se anime a pedir ayuda. Te lleva 30 segundos y significa muchísimo.")}
        ${cta(GOOGLE_REVIEW, "Dejar mi reseña ⭐")}
        ${quote("Pedir ayuda no es rendirse. Es empezar a cuidarte.")}
        ${signature()}
      `,
    }),
  };
}
