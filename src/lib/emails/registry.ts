// Registro central de TODAS las plantillas de email/WhatsApp del sistema.
// Alimenta el panel /flujos (catálogo + preview). Cada entrada renderiza con
// datos de muestra. Server-only (importa plantillas que usan render Node).
import {
  emailBienvenidaConfirma2min, emailBienvenidaRecordatorio2h, emailBienvenidaManana,
  emailBienvenidaDescargaApp, emailBienvenidaAccesoApp, emailBienvenidaAtencionAgresivo,
} from "@/emails/bienvenida-templates";
import { waBienvenidaConfirma15min, waBienvenidaManana, waBienvenidaEn2h } from "@/emails/bienvenida-wa-templates";
import { emailEncuadreConfirmada } from "@/emails/encuadre-templates";
import { llamadaInmediataEmail } from "@/emails/llamada-inmediata-templates";
import { llamadaInmediataPsiEmail } from "@/emails/llamada-inmediata-psi-template";
import { linkPagoEmail } from "@/emails/link-pago-template";
import {
  funnelRecontacto1Email, funnelRecontacto2BonosEmail, funnelBienvenidaEmail, funnelNurturingEmail,
  funnelLeadgen1Email, funnelLeadgen2Email, funnelLeadgen3Email, funnelLeadgen4Email, funnelLeadgen5Email,
  funnelLeadgen6Email, funnelLeadgenComoFuncionaEmail, funnelBonosOfertasEmail, funnelSeguimientoEmail,
} from "@/lib/emails/funnel";
import { appDownloadInvitationEmail } from "@/lib/emails/app-download-invitation";
import { appDownloadReminderEmail } from "@/lib/emails/app-download-reminder";
import { appDownloadActualizaEmail } from "@/lib/emails/app-download-actualiza";
import { appDownloadDescargaEmail } from "@/lib/emails/app-download-descarga";
import { appActualizaODescargaEmail } from "@/lib/emails/app-actualiza-o-descarga";
import { appFeatureMariaEmail } from "@/lib/emails/app-feature-maria";
import { appNoNecesitasTerapiaEmail } from "@/lib/emails/app-no-necesitas-terapia";
import { appChatNotificationEmail } from "@/lib/emails/app-chat-notification";
import { diagnosticoPaidEmail } from "@/lib/emails/diagnostico-paid";
import { diagnosticoSlotTakenEmail } from "@/lib/emails/diagnostico-slot-taken";
import { diagnosticoTestReminderEmail } from "@/lib/emails/diagnostico-test-reminder";
import { paymentConfirmationEmail } from "@/lib/emails/payment-confirmation";
import { reportDeliveryEmail } from "@/lib/emails/report-delivery";
import { testCompletedEmail } from "@/lib/emails/test-completed";
import { sessionReminderEmail } from "@/lib/emails/session-reminder";
import { contactReceivedEmail } from "@/lib/emails/contact-received";
import { ebookDeliveryEmail } from "@/lib/emails/ebook-delivery";
import { reviewRequestEmail } from "@/lib/emails/review-request";
import { welcomeNewsletterEmail } from "@/lib/emails/welcome-newsletter";
import { blogReactivationEmail } from "@/lib/emails/blog-reactivation";
import { ceoDescuentoEmail } from "@/lib/emails/ceo-descuento";
import { renderOfertaTarifas } from "@/lib/emails/oferta-tarifas";
import { reactivationEmailA, reactivationEmailB, reactivationEmailC } from "@/lib/emails/reactivation";
import { regaloCeoDiagnosticoGratisEmail } from "@/lib/emails/regalo-ceo-diagnostico-gratis";
import { regaloCortesiaBonoDiagnosticoGratisEmail } from "@/lib/emails/regalo-cortesia-bono-diagnostico-gratis";
import { renderSuggestedEmail } from "@/lib/emails/agent-suggested";
import { urgenciaCtoAbandonedEmail } from "@/lib/emails/urgencia-cto-abandoned";
import { urgenciaCtoPagaronEmail } from "@/lib/emails/urgencia-cto-pagaron";

// Objeto de muestra amplio (cubre todos los campos que destructuran las plantillas).
// Cast a any: cada plantilla toma su subconjunto.
/* eslint-disable @typescript-eslint/no-explicit-any */
const S: any = {
  name: "María", firstName: "María", nombre: "María", email: "maria@ejemplo.com",
  to: "maria@ejemplo.com", toName: "María", fromName: "Lucía", replyTo: "hola@mentesanapsicologia.com",
  psychologistName: "Lucía Fernández", provider_first: "Lucía", customer_first: "María",
  psiName: "Lucía Fernández", angulo: "ansiedad", vertical: "ansiedad", topCategory: "ansiedad",
  slotLocal: "vie 29 ago · 17:00", session_date: "vie 29 ago", date: "29 ago", time: "17:00",
  confirmUrl: "https://mentesanapsicologia.com/app/bienvenida/confirmar?a=0",
  downloadUrl: "https://mentesanapsicologia.com/app", reportLink: "https://mentesanapsicologia.com/informe/demo",
  reportUrl: "https://mentesanapsicologia.com/informe/demo", videoLink: "https://meet.google.com/abc-defg-hij",
  unsubscribeUrl: "https://mentesanapsicologia.com/baja?e=demo", amount: "149,99 €",
  daysAgo: 3, daysSincePurchase: 14, token: "demo-token", messageCount: 2,
  lastMessageBody: "Hola, ¿podrías confirmarme la hora?", conversationId: "conv_demo",
  title: "Tu sesión de mañana", preheader: "Un recordatorio rápido 💜",
};

type Channel = "email" | "whatsapp";
export interface RegistryEntry {
  id: string;
  label: string;
  category: string;
  trigger: string;        // cuándo/por qué se envía
  channel: Channel;
  editable: "timing" | "copy_db" | "code" | "code_wa"; // dónde se edita hoy
  render: () => { subject?: string; html?: string; preview_text?: string; template_name?: string } | null;
}

// Categorías en orden de aparición en el panel.
export const CATEGORIES = [
  "Cita de bienvenida", "Diagnóstico 9,99€", "App", "Funnel / Leadgen",
  "Reactivación / Ofertas", "Encuadre / Llamada", "Operacionales",
] as const;

function safe(fn: () => any): () => any {
  return () => { try { return fn(); } catch { return null; } };
}

export const EMAIL_REGISTRY: RegistryEntry[] = [
  // ── Cita de bienvenida ──
  { id: "step_email_2min", label: "Confirma tu cita (2 min)", category: "Cita de bienvenida", trigger: "T+2min tras reservar", channel: "email", editable: "timing", render: safe(() => emailBienvenidaConfirma2min(S)) },
  { id: "step_email_2h", label: "Tu hueco parado (2 h)", category: "Cita de bienvenida", trigger: "T+2h tras reservar", channel: "email", editable: "timing", render: safe(() => emailBienvenidaRecordatorio2h(S)) },
  { id: "step_email_manana", label: "Mañana es tu bienvenida", category: "Cita de bienvenida", trigger: "T-24h de la cita", channel: "email", editable: "timing", render: safe(() => emailBienvenidaManana(S)) },
  { id: "step_email_descarga_app", label: "Descarga la app", category: "Cita de bienvenida", trigger: "T+30min si no entró", channel: "email", editable: "timing", render: safe(() => emailBienvenidaDescargaApp(S)) },
  { id: "step_email_acceso_app", label: "Ya estás en la app", category: "Cita de bienvenida", trigger: "T+30min tras login", channel: "email", editable: "timing", render: safe(() => emailBienvenidaAccesoApp(S)) },
  { id: "step_email_atencion", label: "URGENTE confirmar", category: "Cita de bienvenida", trigger: "T-6h de la cita", channel: "email", editable: "timing", render: safe(() => emailBienvenidaAtencionAgresivo(S)) },
  { id: "wa_confirma_15min", label: "WA · Te esperamos (15 min)", category: "Cita de bienvenida", trigger: "T+15min tras reservar", channel: "whatsapp", editable: "code_wa", render: safe(() => waBienvenidaConfirma15min(S)) },
  { id: "wa_manana", label: "WA · Mañana tu sesión", category: "Cita de bienvenida", trigger: "T-24h de la cita", channel: "whatsapp", editable: "code_wa", render: safe(() => waBienvenidaManana(S)) },
  { id: "wa_en2h", label: "WA · En 2h empieza", category: "Cita de bienvenida", trigger: "T-2h de la cita", channel: "whatsapp", editable: "code_wa", render: safe(() => waBienvenidaEn2h(S)) },

  // ── Diagnóstico 9,99€ ──
  { id: "diag_paid", label: "Diagnóstico pagado", category: "Diagnóstico 9,99€", trigger: "Al pagar el diagnóstico", channel: "email", editable: "code", render: safe(() => diagnosticoPaidEmail(S)) },
  { id: "diag_slot_taken", label: "Tu hueco se ocupó", category: "Diagnóstico 9,99€", trigger: "Si el slot elegido ya no está", channel: "email", editable: "code", render: safe(() => diagnosticoSlotTakenEmail(S)) },
  { id: "diag_test_reminder", label: "Recordatorio del test", category: "Diagnóstico 9,99€", trigger: "3-5h antes si no hizo el test", channel: "email", editable: "code", render: safe(() => diagnosticoTestReminderEmail(S)) },
  { id: "payment_confirm", label: "Confirmación de pago", category: "Diagnóstico 9,99€", trigger: "Tras cualquier pago", channel: "email", editable: "code", render: safe(() => paymentConfirmationEmail(S)) },
  { id: "report_delivery", label: "Entrega del informe", category: "Diagnóstico 9,99€", trigger: "Cuando el PDF está listo", channel: "email", editable: "code", render: safe(() => reportDeliveryEmail(S)) },
  { id: "test_completed", label: "Test completado", category: "Diagnóstico 9,99€", trigger: "Al terminar el test", channel: "email", editable: "code", render: safe(() => testCompletedEmail(S)) },
  { id: "session_reminder", label: "Recordatorio de sesión", category: "Diagnóstico 9,99€", trigger: "Antes de la sesión", channel: "email", editable: "code", render: safe(() => sessionReminderEmail(S)) },

  // ── App ──
  { id: "app_invitation", label: "Invitación a la app", category: "App", trigger: "Onboarding app", channel: "email", editable: "code", render: safe(() => appDownloadInvitationEmail(S)) },
  { id: "app_reminder", label: "Recordatorio descarga", category: "App", trigger: "Si no descargó la app", channel: "email", editable: "code", render: safe(() => appDownloadReminderEmail(S)) },
  { id: "app_actualiza", label: "Actualiza la app", category: "App", trigger: "Campaña actualización", channel: "email", editable: "code", render: safe(() => appDownloadActualizaEmail(S)) },
  { id: "app_descarga", label: "Descarga la app", category: "App", trigger: "Campaña descarga", channel: "email", editable: "code", render: safe(() => appDownloadDescargaEmail(S)) },
  { id: "app_act_o_desc", label: "Actualiza o descarga", category: "App", trigger: "Campaña mixta app", channel: "email", editable: "code", render: safe(() => appActualizaODescargaEmail(S)) },
  { id: "app_feature_maria", label: "Conoce a María (IA)", category: "App", trigger: "Feature push María 24/7", channel: "email", editable: "code", render: safe(() => appFeatureMariaEmail(S)) },
  { id: "app_no_terapia", label: "No necesitas terapia (app)", category: "App", trigger: "Nurture app sin terapia", channel: "email", editable: "code", render: safe(() => appNoNecesitasTerapiaEmail(S)) },
  { id: "app_chat_notif", label: "Notif. chat de la app", category: "App", trigger: "Mensaje nuevo in-app", channel: "email", editable: "code", render: safe(() => appChatNotificationEmail(S)) },

  // ── Funnel / Leadgen ──
  { id: "funnel_recontacto1", label: "Recontacto 1", category: "Funnel / Leadgen", trigger: "Abandono checkout", channel: "email", editable: "code", render: safe(() => funnelRecontacto1Email(S)) },
  { id: "funnel_recontacto2", label: "Recontacto 2 (bonos)", category: "Funnel / Leadgen", trigger: "Abandono + bonos", channel: "email", editable: "code", render: safe(() => funnelRecontacto2BonosEmail(S)) },
  { id: "funnel_bienvenida", label: "Bienvenida funnel", category: "Funnel / Leadgen", trigger: "Alta lead", channel: "email", editable: "code", render: safe(() => funnelBienvenidaEmail(S)) },
  { id: "funnel_nurturing", label: "Nurturing", category: "Funnel / Leadgen", trigger: "Secuencia nurture", channel: "email", editable: "code", render: safe(() => funnelNurturingEmail(S)) },
  { id: "funnel_leadgen1", label: "Leadgen 1", category: "Funnel / Leadgen", trigger: "Leadgen Meta paso 1", channel: "email", editable: "code", render: safe(() => funnelLeadgen1Email(S)) },
  { id: "funnel_leadgen2", label: "Leadgen 2", category: "Funnel / Leadgen", trigger: "Leadgen Meta paso 2", channel: "email", editable: "code", render: safe(() => funnelLeadgen2Email(S)) },
  { id: "funnel_leadgen3", label: "Leadgen 3", category: "Funnel / Leadgen", trigger: "Leadgen Meta paso 3", channel: "email", editable: "code", render: safe(() => funnelLeadgen3Email(S)) },
  { id: "funnel_leadgen4", label: "Leadgen 4", category: "Funnel / Leadgen", trigger: "Leadgen Meta paso 4", channel: "email", editable: "code", render: safe(() => funnelLeadgen4Email(S)) },
  { id: "funnel_leadgen5", label: "Leadgen 5", category: "Funnel / Leadgen", trigger: "Leadgen Meta paso 5", channel: "email", editable: "code", render: safe(() => funnelLeadgen5Email(S)) },
  { id: "funnel_leadgen6", label: "Leadgen 6", category: "Funnel / Leadgen", trigger: "Leadgen Meta paso 6", channel: "email", editable: "code", render: safe(() => funnelLeadgen6Email(S)) },
  { id: "funnel_leadgen_como", label: "Leadgen · cómo funciona", category: "Funnel / Leadgen", trigger: "Leadgen explicativo", channel: "email", editable: "code", render: safe(() => funnelLeadgenComoFuncionaEmail(S)) },
  { id: "funnel_bonos_ofertas", label: "Bonos y ofertas", category: "Funnel / Leadgen", trigger: "Oferta de bonos", channel: "email", editable: "code", render: safe(() => funnelBonosOfertasEmail(S)) },
  { id: "funnel_seguimiento", label: "Seguimiento", category: "Funnel / Leadgen", trigger: "Seguimiento post-lead", channel: "email", editable: "code", render: safe(() => funnelSeguimientoEmail(S)) },

  // ── Reactivación / Ofertas ──
  { id: "reactivation_a", label: "Reactivación A", category: "Reactivación / Ofertas", trigger: "Paciente inactivo", channel: "email", editable: "code", render: safe(() => reactivationEmailA(S)) },
  { id: "reactivation_b", label: "Reactivación B", category: "Reactivación / Ofertas", trigger: "Paciente inactivo (v2)", channel: "email", editable: "code", render: safe(() => reactivationEmailB(S)) },
  { id: "reactivation_c", label: "Reactivación C", category: "Reactivación / Ofertas", trigger: "Post-compra inactivo", channel: "email", editable: "code", render: safe(() => reactivationEmailC(S)) },
  { id: "ceo_descuento", label: "Descuento del CEO", category: "Reactivación / Ofertas", trigger: "Oferta CEO", channel: "email", editable: "code", render: safe(() => ceoDescuentoEmail(S)) },
  { id: "oferta_tarifas", label: "Oferta de tarifas", category: "Reactivación / Ofertas", trigger: "Campaña tarifas (cron 2h)", channel: "email", editable: "code", render: safe(() => renderOfertaTarifas(S)) },
  { id: "blog_reactivation", label: "Reactivación blog", category: "Reactivación / Ofertas", trigger: "Lector de blog", channel: "email", editable: "code", render: safe(() => blogReactivationEmail(S)) },
  { id: "regalo_ceo", label: "Regalo CEO (diag. cortesía)", category: "Reactivación / Ofertas", trigger: "Regalo diagnóstico", channel: "email", editable: "code", render: safe(() => regaloCeoDiagnosticoGratisEmail(S)) },
  { id: "regalo_cortesia", label: "Regalo cortesía (bono)", category: "Reactivación / Ofertas", trigger: "Regalo bono", channel: "email", editable: "code", render: safe(() => regaloCortesiaBonoDiagnosticoGratisEmail(S)) },
  { id: "urgencia_abandoned", label: "Urgencia · abandonó", category: "Reactivación / Ofertas", trigger: "Checkout abandonado (CTO)", channel: "email", editable: "code", render: safe(() => urgenciaCtoAbandonedEmail(S)) },
  { id: "urgencia_pagaron", label: "Urgencia · pagaron", category: "Reactivación / Ofertas", trigger: "Post-pago (CTO)", channel: "email", editable: "code", render: safe(() => urgenciaCtoPagaronEmail(S)) },

  // ── Encuadre / Llamada ──
  { id: "encuadre_confirmada", label: "Encuadre confirmada", category: "Encuadre / Llamada", trigger: "Al reservar el encuadre", channel: "email", editable: "code", render: safe(() => emailEncuadreConfirmada(S)) },
  { id: "llamada_inmediata", label: "Llamada inmediata (paciente)", category: "Encuadre / Llamada", trigger: "Registro llamada inmediata", channel: "email", editable: "code", render: safe(() => llamadaInmediataEmail(S)) },
  { id: "llamada_inmediata_psi", label: "Llamada inmediata (psi)", category: "Encuadre / Llamada", trigger: "Aviso a la psicóloga", channel: "email", editable: "code", render: safe(() => llamadaInmediataPsiEmail(S)) },
  { id: "link_pago", label: "Link de pago", category: "Encuadre / Llamada", trigger: "Envío de link de pago", channel: "email", editable: "code", render: safe(() => linkPagoEmail(S)) },

  // ── Operacionales ──
  { id: "contact_received", label: "Contacto recibido", category: "Operacionales", trigger: "Formulario de contacto", channel: "email", editable: "code", render: safe(() => contactReceivedEmail(S)) },
  { id: "ebook_delivery", label: "Entrega de ebook", category: "Operacionales", trigger: "Descarga de ebook", channel: "email", editable: "code", render: safe(() => ebookDeliveryEmail(S)) },
  { id: "review_request", label: "Petición de reseña", category: "Operacionales", trigger: "Tras la sesión (cron 30min)", channel: "email", editable: "code", render: safe(() => reviewRequestEmail(S)) },
  { id: "welcome_newsletter", label: "Bienvenida newsletter", category: "Operacionales", trigger: "Alta newsletter", channel: "email", editable: "code", render: safe(() => welcomeNewsletterEmail(S)) },
  { id: "agent_suggested", label: "Email sugerido (agente)", category: "Operacionales", trigger: "Sugerencia CRM", channel: "email", editable: "code", render: safe(() => renderSuggestedEmail(S)) },
];

export function findEntry(id: string): RegistryEntry | undefined {
  return EMAIL_REGISTRY.find((e) => e.id === id);
}
