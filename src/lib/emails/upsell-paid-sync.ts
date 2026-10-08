// Sincroniza desde Stripe quién PAGÓ la sesión adicional (Payment Link 19,99) y
// AUTOMATIZA "sumarle la cita": +1 sesión en su bono activo de Amelia.
// Se usa para: (1) que la oferta le DESAPAREZCA (email + app), (2) sumarle en
// Amelia la sesión que pagó (idempotente), (3) avisar al equipo.
import Stripe from "stripe";
import { blogClient } from "@/lib/flujos-auto";
import { sendEmail } from "@/lib/emails/send";
import { ameliaQuery, ameliaExec, ameliaTable } from "@/lib/amelia-db";

// Payment Link de la "Sesión adicional 19,99€" (LIVE).
const SESION_ADICIONAL_PLINK = "plink_REDACTED";
const OPS_EMAIL = process.env.UPSELL_OPS_EMAIL || "hola@mentesanapsicologia.com";

function stripeClient(): Stripe | null {
  const k = (process.env.STRIPE_SECRET_KEY || "").match(/sk_(live|test)_[A-Za-z0-9]+/)?.[0];
  if (!k) return null;
  return new Stripe(k, { httpClient: Stripe.createFetchHttpClient() });
}

// ── Amelia: sumar +1 sesión en el bono activo del cliente ───────────────────
// bookingsCount en packages_customers_to_services = sesiones INCLUIDAS (no usadas);
// las usadas se cuentan en customer_bookings. Restantes = bookingsCount - usadas.
// Sumar una sesión = incrementar ese bookingsCount en +1 (por-cliente, no toca
// la plantilla compartida). Además aseguramos que el bono no expire antes de que
// pueda usarla (extiende `end` a hoy+30d solo si vencía antes; nunca lo acorta).
export interface GrantResult { ok: boolean; pcsId?: number; detail: string }

export async function grantExtraSessionInAmelia(email: string): Promise<GrantResult> {
  const clean = email.toLowerCase().trim();
  const ub = ameliaTable("users");
  const ptc = ameliaTable("packages_to_customers");
  const pcs = ameliaTable("packages_customers_to_services");

  const cust = await ameliaQuery<{ id: number }>(
    `SELECT id FROM ${ub} WHERE LOWER(email)=? AND type='customer' ORDER BY id DESC LIMIT 1`,
    [clean]
  );
  const cid = cust[0]?.id;
  if (!cid) return { ok: false, detail: "customer_not_found" };

  // Bono activo más reciente con fila per-servicio (preferimos serviceId 4 = terapia individual).
  const rows = await ameliaQuery<{
    ptc_id: number; pcs_id: number; serviceId: number; bookingsCount: number;
  }>(
    `SELECT ptc.id AS ptc_id, pcs.id AS pcs_id, pcs.serviceId AS serviceId, pcs.bookingsCount AS bookingsCount
       FROM ${ptc} ptc
       JOIN ${pcs} pcs ON pcs.packageCustomerId = ptc.id
      WHERE ptc.customerId = ? AND ptc.status = 'approved'
        AND (ptc.end IS NULL OR ptc.end >= NOW())
      ORDER BY (pcs.serviceId = 4) DESC, ptc.purchased DESC, pcs.id DESC
      LIMIT 1`,
    [cid]
  );
  const t = rows[0];
  if (!t) return { ok: false, detail: "no_active_bono" };

  await ameliaExec(`UPDATE ${pcs} SET bookingsCount = bookingsCount + 1 WHERE id = ?`, [t.pcs_id]);
  // No acorta bonos ilimitados (end NULL) ni los que ya duran más de 30 días.
  await ameliaExec(
    `UPDATE ${ptc} SET end = DATE_ADD(NOW(), INTERVAL 30 DAY)
      WHERE id = ? AND end IS NOT NULL AND end < DATE_ADD(NOW(), INTERVAL 30 DAY)`,
    [t.ptc_id]
  );
  return {
    ok: true,
    pcsId: t.pcs_id,
    detail: `bono ${t.ptc_id} · pcs ${t.pcs_id} · svc ${t.serviceId} · sesiones ${t.bookingsCount}→${t.bookingsCount + 1}`,
  };
}

// Recorre los pagadores que aún NO tienen la sesión sumada y se la suma.
// Idempotente por "claim atómico": el UPDATE ... WHERE session_granted=false
// solo lo gana UN proceso (row lock de Postgres) → nunca suma dos veces.
export async function grantPendingSessions(): Promise<{ granted: number; failed: number }> {
  const sb = blogClient();
  let granted = 0;
  let failed = 0;
  const { data: pending } = await sb
    .from("upsell_paid")
    .select("email, name")
    .eq("product", "sesion_adicional")
    .eq("session_granted", false);
  for (const row of pending ?? []) {
    const email = String((row as { email: string }).email).toLowerCase().trim();
    const name = (row as { name: string | null }).name;
    // 1) CLAIM atómico
    const { data: claimed } = await sb
      .from("upsell_paid")
      .update({ session_granted: true, granted_at: new Date().toISOString() })
      .eq("email", email)
      .eq("product", "sesion_adicional")
      .eq("session_granted", false)
      .select("email");
    if (!claimed || claimed.length === 0) continue; // ya reclamado por otro
    // 2) GRANT en Amelia
    try {
      const g = await grantExtraSessionInAmelia(email);
      if (g.ok) {
        granted++;
        await sb.from("upsell_paid").update({ granted_pcs_id: g.pcsId ?? null, granted_detail: g.detail })
          .eq("email", email).eq("product", "sesion_adicional");
        await sendEmail({
          to: OPS_EMAIL,
          subject: `✅ Sesión adicional SUMADA automáticamente — ${name || email}`,
          html: `<div style="font-family:Inter,sans-serif;color:#1a0a1f;line-height:1.6">
            <p><b>${name || "Cliente"}</b> (${email}) pagó la sesión adicional y ya se le <b>sumó +1 sesión en su bono</b> automáticamente.</p>
            <p>Solo tiene que agendarla desde la app con su psicóloga. No hay que hacer nada más.</p>
            <p style="font-size:12px;color:#8a85a0">${g.detail}</p>
          </div>`,
        }).catch(() => {});
      } else {
        failed++;
        // Motivo permanente (sin bono activo / sin cuenta): dejamos reclamado
        // para no reintentar en bucle, pero avisamos para hacerlo a mano.
        await sb.from("upsell_paid").update({ granted_detail: `FAILED: ${g.detail}`, granted_pcs_id: null })
          .eq("email", email).eq("product", "sesion_adicional");
        await sendEmail({
          to: OPS_EMAIL,
          subject: `⚠️ Sesión adicional pagada pero NO se pudo sumar — ${name || email}`,
          html: `<div style="font-family:Inter,sans-serif;color:#1a0a1f;line-height:1.6">
            <p><b>${name || "Cliente"}</b> (${email}) pagó la sesión adicional (19,99 €) pero NO pude sumársela automáticamente.</p>
            <p>Motivo: <b>${g.detail}</b> (probablemente no tiene un bono activo). 👉 Súmasela a mano en Amelia.</p>
          </div>`,
        }).catch(() => {});
      }
    } catch (e) {
      failed++;
      // Fallo transitorio (DB/red): revertimos el claim para reintentar luego.
      await sb.from("upsell_paid")
        .update({ session_granted: false, granted_detail: `RETRY: ${e instanceof Error ? e.message : String(e)}` })
        .eq("email", email).eq("product", "sesion_adicional");
    }
  }
  return { granted, failed };
}

// Trae los checkouts PAGADOS del link de sesión adicional, los guarda en
// upsell_paid, avisa al equipo por cada pagador NUEVO y SUMA la sesión pendiente.
export async function syncUpsellPaid(): Promise<{ found: number; nuevos: number; granted: number; failed: number }> {
  const stripe = stripeClient();
  const sb = blogClient();
  let found = 0;
  let nuevos = 0;
  if (stripe) {
    try {
      const sessions = await stripe.checkout.sessions.list({
        payment_link: SESION_ADICIONAL_PLINK,
        limit: 100,
      });
      for (const s of sessions.data) {
        if (s.payment_status !== "paid") continue;
        const email = (s.customer_details?.email || "").toLowerCase().trim();
        if (!email) continue;
        found++;
        const { data: exist } = await sb
          .from("upsell_paid")
          .select("email")
          .eq("email", email)
          .eq("product", "sesion_adicional")
          .maybeSingle();
        if (exist) continue;
        nuevos++;
        const name = s.customer_details?.name || null;
        await sb.from("upsell_paid").insert({
          email,
          product: "sesion_adicional",
          stripe_session_id: s.id,
          amount_cents: s.amount_total ?? 1999,
          name,
          paid_at: new Date((s.created || 0) * 1000).toISOString(),
          notified: true,
        });
      }
    } catch {
      /* Stripe opcional; si falla, no rompemos el runner */
    }
  }
  // Sumar en Amelia las sesiones pendientes (nuevas + Paulina/Andrea backfill).
  const { granted, failed } = await grantPendingSessions();
  return { found, nuevos, granted, failed };
}

// Set de emails que YA pagaron la sesión adicional (para ocultar la oferta).
export async function loadPaidAdicional(): Promise<Set<string>> {
  try {
    const sb = blogClient();
    const { data } = await sb
      .from("upsell_paid")
      .select("email")
      .eq("product", "sesion_adicional");
    return new Set((data ?? []).map((r: { email: string }) => String(r.email).toLowerCase().trim()));
  } catch {
    return new Set();
  }
}
