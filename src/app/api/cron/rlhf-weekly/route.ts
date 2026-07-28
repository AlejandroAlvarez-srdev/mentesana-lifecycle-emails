// Cron RLHF semanal (domingos 03:00 UTC).
// Flujo:
//   1) generatePendingCards({ sinceHours: 168 }) — analiza sesiones y clusters
//      de feedback de los últimos 7 días y crea cartas 'pending' para revisión.
//   2) run-cycle interno con trigger='cron_weekly' — recuenta cards aprobadas
//      esta semana, aplica system_prompt_change si toca y cierra el ciclo.
//   3) Email de resumen al admin (CTO).
//
// Auth: Authorization: Bearer $CRON_SECRET (mismo patrón que jefe-psicologas-weekly).
import { NextRequest, NextResponse } from "next/server";
import { generatePendingCards } from "@/lib/rlhf/generate-pending-cards";
import { sendEmail } from "@/lib/emails/send";
import { emailLayout } from "@/lib/emails/layout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Puede tirar de LLM para analizar muchas sesiones → damos margen amplio.
export const maxDuration = 300;

const ADMIN_EMAIL = "cto@example.com";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const got = req.headers.get("authorization") || "";
  if (expected && got !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();

  // 1) Genera cartas pending desde feedback+sesiones de los últimos 7 días.
  //    Shape: { totalCreated, byType, sessionsAnalyzed, sessionsSkipped, clusterCards, errors }
  const gen = await generatePendingCards({ sinceHours: 168 }).catch((e: unknown) => ({
    totalCreated: 0,
    byType: {} as Record<string, number>,
    sessionsAnalyzed: 0,
    sessionsSkipped: 0,
    clusterCards: 0,
    errors: [`generate_pending_cards: ${(e as Error).message ?? String(e)}`],
  }));

  // 2) Cierre de ciclo: llama internamente al endpoint (que ya cuenta approved,
  //    aplica prompt_change y crea la fila en ai_training_cycles). Usamos el
  //    bypass CRON_SECRET añadido a run-cycle para no necesitar cookie de agent.
  const base = (process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL || "mentesanapsicologia.com"}`).replace(/\/$/, "");
  let cycle: {
    ok?: boolean;
    cycle_id?: string;
    changes_summary?: string;
    new_prompt_version?: string | null;
    metrics_after?: Record<string, unknown>;
    error?: string;
    detail?: string;
  } = {};
  try {
    const r = await fetch(`${base}/api/admin/train/run-cycle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Bypass agent-auth: el propio endpoint lo acepta con CRON_SECRET.
        Authorization: `Bearer ${expected ?? ""}`,
      },
      body: JSON.stringify({ trigger: "cron_weekly", dry_run: false }),
      signal: AbortSignal.timeout(120_000),
    });
    cycle = await r.json();
  } catch (e) {
    cycle = { error: "run_cycle_fetch_failed", detail: (e as Error).message ?? String(e) };
  }

  // 3) Email al admin.
  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const durationLabel = `${Math.round(durationMs / 1000)}s`;

  const metrics = (cycle.metrics_after ?? {}) as Record<string, unknown>;
  const cardsApproved = Number(metrics.cards_approved ?? 0);
  const cardsRejected = Number(metrics.cards_rejected ?? 0);
  const fbTotal = Number(metrics.feedback_total ?? 0);
  const fbPos = Number(metrics.feedback_positive ?? 0);
  const fbNeg = Number(metrics.feedback_negative ?? 0);
  const ratio = metrics.positive_ratio != null ? `${Math.round(Number(metrics.positive_ratio) * 100)}%` : "n/a";
  const appliedPromptChanges = Array.isArray(metrics.applied_prompt_changes)
    ? metrics.applied_prompt_changes as Array<{ agent: string; version: string; card_id: string }>
    : [];

  const errorsHtml = gen.errors.length
    ? `<div style="margin:14px 0;padding:12px;background:rgba(220,38,38,0.06);border-left:4px solid #dc2626;border-radius:6px;">
        <strong style="color:#991b1b;font-size:12px;">⚠️ Errores no fatales durante el análisis:</strong>
        <ul style="margin:6px 0 0;padding-left:20px;font-size:11px;color:#7f1d1d;">
          ${gen.errors.slice(0, 10).map((e: string) => `<li>${escapeHtml(e)}</li>`).join("")}
        </ul>
      </div>`
    : "";

  const byTypeHtml = Object.keys(gen.byType).length
    ? `<h3 style="margin:14px 0 6px;color:#6A178C;font-size:14px;">🧩 Cartas por tipo</h3>
       <ul style="margin:0 0 12px;padding-left:20px;font-size:13px;color:#334155;">
         ${Object.entries(gen.byType).map(([k, v]) => `<li><strong>${escapeHtml(k)}</strong>: ${v}</li>`).join("")}
       </ul>`
    : "";

  const cycleErrorHtml = cycle.error
    ? `<div style="margin:14px 0;padding:12px;background:rgba(220,38,38,0.06);border-left:4px solid #dc2626;border-radius:6px;">
        <strong style="color:#991b1b;font-size:12px;">❌ run-cycle falló:</strong>
        <p style="margin:4px 0 0;font-size:11px;color:#7f1d1d;">${escapeHtml(cycle.error)}${cycle.detail ? `: ${escapeHtml(cycle.detail)}` : ""}</p>
      </div>`
    : "";

  const promptChangesHtml = appliedPromptChanges.length
    ? `<h3 style="margin:14px 0 6px;color:#6A178C;font-size:14px;">🚀 System prompt actualizado</h3>
       <ul style="margin:0 0 12px;padding-left:20px;font-size:13px;">
         ${appliedPromptChanges.map((c) => `<li><strong>${escapeHtml(c.agent)}</strong> → ${escapeHtml(c.version)}</li>`).join("")}
       </ul>`
    : `<p style="margin:10px 0;font-size:12px;color:#888;font-style:italic;">Sin cambios de system prompt aprobados esta semana.</p>`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mentesanapsicologia.com";

  const content = `
    <p style="margin:0 0 6px;font-size:15px;color:#1a0a1f;">Hola CTO,</p>
    <p style="margin:0 0 14px;font-size:14px;color:#475569;line-height:1.6;">Resumen del ciclo RLHF semanal de María (últimos 7 días). Ejecutado en ${escapeHtml(durationLabel)}.</p>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:16px;">
      <div style="padding:10px;background:rgba(106,23,140,0.06);border-radius:8px;text-align:center;">
        <div style="font-size:9px;color:#888;font-weight:800;text-transform:uppercase;">Cards creadas</div>
        <div style="font-size:22px;color:#6A178C;font-weight:800;">${gen.totalCreated}</div>
      </div>
      <div style="padding:10px;background:rgba(16,163,74,0.06);border-radius:8px;text-align:center;">
        <div style="font-size:9px;color:#888;font-weight:800;text-transform:uppercase;">✓ Aprobadas</div>
        <div style="font-size:22px;color:#16a34a;font-weight:800;">${cardsApproved}</div>
      </div>
      <div style="padding:10px;background:rgba(220,38,38,0.06);border-radius:8px;text-align:center;">
        <div style="font-size:9px;color:#888;font-weight:800;text-transform:uppercase;">✗ Rechazadas</div>
        <div style="font-size:22px;color:#dc2626;font-weight:800;">${cardsRejected}</div>
      </div>
      <div style="padding:10px;background:rgba(8,145,178,0.06);border-radius:8px;text-align:center;">
        <div style="font-size:9px;color:#888;font-weight:800;text-transform:uppercase;">Ratio +</div>
        <div style="font-size:22px;color:#0891b2;font-weight:800;">${ratio}</div>
      </div>
    </div>

    <h3 style="margin:14px 0 6px;color:#6A178C;font-size:14px;">📥 Origen de las cartas</h3>
    <ul style="margin:0 0 12px;padding-left:20px;font-size:13px;color:#334155;">
      <li>Sesiones analizadas: <strong>${gen.sessionsAnalyzed}</strong>${gen.sessionsSkipped ? ` (${gen.sessionsSkipped} saltadas por error)` : ""}</li>
      <li>Cluster de feedback: <strong>${gen.clusterCards}</strong> cartas</li>
    </ul>

    ${byTypeHtml}

    <h3 style="margin:14px 0 6px;color:#6A178C;font-size:14px;">💬 Feedback analizado en el ciclo</h3>
    <p style="margin:0 0 12px;font-size:13px;color:#334155;">
      Total: <strong>${fbTotal}</strong> · Positivos: <strong style="color:#16a34a;">${fbPos}</strong> · Negativos: <strong style="color:#dc2626;">${fbNeg}</strong>
    </p>

    ${promptChangesHtml}

    ${cycleErrorHtml}
    ${errorsHtml}

    <div style="margin-top:22px;text-align:center;">
      <a href="${baseUrl}/admin/train" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#6A178C,#8B2FB5);color:#fff;text-decoration:none;border-radius:10px;font-weight:800;font-size:13px;">Revisar cartas pending →</a>
    </div>

    <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;">cycle_id: ${escapeHtml(cycle.cycle_id ?? "n/a")} · ventana: 168h</p>
  `;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `🧠 RLHF semanal · ${gen.totalCreated} nuevas cards · ${cardsApproved} aplicadas`,
    html: emailLayout({
      title: "Ciclo RLHF semanal · María",
      preheader: `${gen.totalCreated} cards nuevas, ${cardsApproved} aprobadas, ${appliedPromptChanges.length} prompt updates`,
      content,
    }),
  }).catch((e) => console.warn("[cron/rlhf-weekly] email failed:", (e as Error).message));

  return NextResponse.json({
    ok: true,
    duration_ms: durationMs,
    generate: gen,
    cycle,
  });
}
