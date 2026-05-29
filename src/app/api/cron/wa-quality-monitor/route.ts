// CRON cada 10 min: lee quality_rating de cada whatsapp_numbers active vía
// Graph API, guarda snapshot y reacciona si cambia respecto al estado
// anterior almacenado en wa_quality_state.
//
// Acciones automáticas:
//  · GREEN → YELLOW: cap diario monolito = daily_cap_yellow (default 50),
//    pausa nada manualmente. Manda email a CTO+CEO.
//  · YELLOW → RED o GREEN → RED: marketing_paused=true. Actualiza monolito
//    para reducir el cap. Manda email URGENTE.
//  · RED → YELLOW o YELLOW → GREEN o RED → GREEN: restaura
//    daily_cap_normal y desactiva marketing_paused. Manda email
//    de recuperación.
//
// El polling es robusto: no depende del webhook (que ya está suscrito pero
// va al monolito). Si Meta tarda en enviar el webhook, el polling pilla el
// cambio en máx 10 min.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/emails/send";
import { emailLayout } from "@/lib/emails/layout";

const sb = createClient(
  process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

const GRAPH = "https://graph.facebook.com/v22.0";
const MONOLITH = `${process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL}/functions/v1/legacy-server`;
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const QUALITY_ORDER: Record<string, number> = { GREEN: 0, YELLOW: 1, RED: 2, UNKNOWN: -1 };

type Action = "throttle_yellow" | "throttle_red" | "restore_normal" | "no_change";

function decideAction(prev: string, curr: string): Action {
  if (prev === curr) return "no_change";
  if (curr === "RED") return "throttle_red";
  if (curr === "YELLOW") return "throttle_yellow";
  if (curr === "GREEN" && (QUALITY_ORDER[prev] ?? 0) > 0) return "restore_normal";
  return "no_change";
}

async function patchMonolithCap(phoneNumberId: string, dailyCap: number): Promise<boolean> {
  // Encuentra wanum_* en el monolito y actualiza messagesPerDay
  try {
    const list = await fetch(`${MONOLITH}/whatsapp/numbers`).then((r) => r.json());
    const w = (list.numbers ?? []).find((n: { phoneNumberId: string; id: string }) => n.phoneNumberId === phoneNumberId);
    if (!w) return false;
    const r = await fetch(`${MONOLITH}/whatsapp/numbers/${w.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limits: { messagesPerDay: dailyCap, currentUsage: 0, lastReset: new Date().toISOString() } }),
    });
    return r.ok;
  } catch { return false; }
}

async function notifyQualityChange(
  num: { name: string; phone_number: string; phone_number_id: string },
  prev: string,
  curr: string,
  action: Action,
  emails: string[],
  newCap: number | null,
) {
  const isAlert = action === "throttle_red" || action === "throttle_yellow";
  const subject = isAlert
    ? `🚨 WhatsApp ${num.phone_number}: quality ${prev} → ${curr}`
    : `✅ WhatsApp ${num.phone_number}: recuperado (${prev} → ${curr})`;

  const body = `
    <h2 style="color:${isAlert ? "#dc2626" : "#16a34a"};margin-top:0">
      ${isAlert ? "🚨 Bajada de calidad detectada" : "✅ Calidad recuperada"}
    </h2>
    <table style="font-size:14px;border-collapse:collapse;width:100%;margin:14px 0">
      <tr><td style="padding:6px;color:#666">Número</td><td style="padding:6px"><strong>${num.name} · ${num.phone_number}</strong></td></tr>
      <tr><td style="padding:6px;color:#666">Quality anterior</td><td style="padding:6px">${prev}</td></tr>
      <tr><td style="padding:6px;color:#666">Quality actual</td><td style="padding:6px"><strong>${curr}</strong></td></tr>
      <tr><td style="padding:6px;color:#666">Acción tomada</td><td style="padding:6px">${action.replace("_", " ")}</td></tr>
      ${newCap !== null ? `<tr><td style="padding:6px;color:#666">Nuevo cap diario</td><td style="padding:6px"><strong>${newCap} mensajes/día</strong></td></tr>` : ""}
    </table>
    ${isAlert ? `
      <p style="font-size:13px;color:#666">
        Revisa la <a href="https://www.mentesanapsicologia.com/agent/wa-risk">dashboard de riesgo</a>
        para identificar qué plantillas pueden estar causando el problema.
      </p>` : `
      <p style="font-size:13px;color:#666">
        Cap restaurado a normal. Puedes seguir enviando volumen estándar.
      </p>`}
  `;

  for (const to of emails) {
    try { await sendEmail({ to, subject, html: emailLayout({ title: subject, content: body }) }); }
    catch (e) { console.warn(`[wa-quality] email to ${to} failed:`, e); }
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: nums } = await sb
    .from("whatsapp_numbers")
    .select("name, phone_number, phone_number_id, access_token, status")
    .eq("status", "active");

  if (!nums || nums.length === 0) return NextResponse.json({ ok: true, checked: 0 });

  const results = [];
  for (const n of nums) {
    try {
      const r = await fetch(
        `${GRAPH}/${n.phone_number_id}?fields=quality_rating,messaging_limit_tier,status,name_status`,
        { headers: { Authorization: `Bearer ${n.access_token}` } },
      );
      const meta = await r.json();
      const curr = meta.quality_rating ?? "UNKNOWN";

      // Snapshot histórico
      await sb.from("wa_quality_snapshots").insert({
        phone_number_id: n.phone_number_id,
        quality_rating: curr,
        messaging_limit_tier: meta.messaging_limit_tier ?? null,
        status: meta.status ?? null,
        name_status: meta.name_status ?? null,
      });

      // Estado actual
      const { data: state } = await sb
        .from("wa_quality_state")
        .select("*")
        .eq("phone_number_id", n.phone_number_id)
        .maybeSingle();

      if (!state) {
        // primera vez que vemos este número → init
        await sb.from("wa_quality_state").insert({
          phone_number_id: n.phone_number_id,
          current_quality: curr,
        });
        results.push({ phone_number_id: n.phone_number_id, action: "init", quality: curr });
        continue;
      }

      const prev = state.current_quality;
      const action = decideAction(prev, curr);

      if (action === "no_change") {
        await sb.from("wa_quality_state").update({ last_check_at: new Date().toISOString() }).eq("phone_number_id", n.phone_number_id);
        results.push({ phone_number_id: n.phone_number_id, action: "no_change", quality: curr });
        continue;
      }

      let newCap = 0;
      let hasNewCap = false;
      let marketingPaused = state.marketing_paused;
      if (action === "throttle_yellow") {
        newCap = state.daily_cap_yellow ?? 50; hasNewCap = true;
        await patchMonolithCap(n.phone_number_id, newCap);
      } else if (action === "throttle_red") {
        newCap = Math.max(0, Math.floor((state.daily_cap_yellow ?? 50) / 5)); hasNewCap = true;
        marketingPaused = true;
        await patchMonolithCap(n.phone_number_id, newCap);
      } else if (action === "restore_normal") {
        newCap = state.daily_cap_normal ?? 200; hasNewCap = true;
        marketingPaused = false;
        await patchMonolithCap(n.phone_number_id, newCap);
      }

      await sb.from("wa_quality_state").update({
        current_quality: curr,
        previous_quality: prev,
        marketing_paused: marketingPaused,
        last_change_at: new Date().toISOString(),
        last_check_at: new Date().toISOString(),
      }).eq("phone_number_id", n.phone_number_id);

      await notifyQualityChange(
        { name: n.name, phone_number: n.phone_number, phone_number_id: n.phone_number_id },
        prev, curr, action, state.notify_emails ?? ["cto@example.com"], hasNewCap ? newCap : null,
      );

      results.push({ phone_number_id: n.phone_number_id, prev, curr, action, newCap: hasNewCap ? newCap : null });
    } catch (e) {
      results.push({ phone_number_id: n.phone_number_id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ ok: true, checked: nums.length, results });
}
