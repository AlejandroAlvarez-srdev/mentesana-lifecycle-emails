// Cron nocturno: re-embebe customers Amelia con cambios o nuevos
// Detecta nuevos customers (id > max embedded) y customers cuyos stats han cambiado
// desde la última embedding (sesiones nuevas, paquetes nuevos)
//
// Protección: requiere header x-cron-secret O Vercel cron signature
// Configurado en vercel.json para correr diariamente a las 03:30 UTC (Madrid 04:30/05:30)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ameliaQuery, ameliaTable } from "@/lib/amelia-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const SB = createClient(
  process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

const PROXY_URL = `${process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL}/functions/v1/voyage-embed-proxy`;
const PROXY_SECRET = (process.env.INBOX_SECRET || process.env.INSIGHTS_SECRET || "REDACTED_SECRET").trim();
const CRON_SECRET = (process.env.CRON_SECRET || "").trim();

const BATCH = 32;
const MAX_PER_RUN = 500;

function authOk(req: NextRequest): boolean {
  // Vercel Cron añade header authorization: Bearer <CRON_SECRET>
  const v = req.headers.get("authorization") ?? "";
  if (CRON_SECRET && v === `Bearer ${CRON_SECRET}`) return true;
  // También aceptamos header manual para tests
  if (CRON_SECRET && req.headers.get("x-cron-secret") === CRON_SECRET) return true;
  // Fallback en desarrollo si no hay secret
  if (!CRON_SECRET && process.env.NODE_ENV !== "production") return true;
  return false;
}

async function voyageBatch(texts: string[]): Promise<number[][]> {
  const r = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-inbox-secret": PROXY_SECRET },
    body: JSON.stringify({ texts, input_type: "document" }),
  });
  if (!r.ok) throw new Error(`Proxy ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return j.embeddings;
}

function profileTextFor(c: any, stats: any, pkg: any): string {
  const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "(sin nombre)";
  const sessions = `${stats.total_approved} sesiones approved + ${stats.total_pending} pending`;
  const packageInfo = (pkg.packages_count ?? 0) > 0
    ? `${pkg.packages_count} paquete${pkg.packages_count === 1 ? "" : "s"} comprado${pkg.packages_count === 1 ? "" : "s"}${pkg.has_active_package ? " · paquete activo" : " · sin paquete activo"}${pkg.last_package_name ? ` · último: ${pkg.last_package_name}` : ""}`
    : "sin paquete comprado";
  const lastAt = stats.last_appointment ? `última cita ${new Date(stats.last_appointment).toISOString().slice(0, 10)}` : "sin cita aprobada";
  const isPaid = Number(stats.total_approved) >= 2 || Number(pkg.packages_count ?? 0) > 0;
  return [
    name,
    c.email ? `email: ${c.email}` : null,
    c.phone ? `teléfono: ${c.phone}` : null,
    c.countryPhoneIso ? `país: ${c.countryPhoneIso}` : null,
    c.gender ? `género: ${c.gender}` : null,
    sessions,
    packageInfo,
    lastAt,
    isPaid ? "CLIENTE COMPRADOR" : "lead sin compra",
  ].filter(Boolean).join(" | ");
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const t0 = Date.now();

  // 1) Encontrar candidatos a re-embedding:
  //    a) customers Amelia con id > max ya embebido (nuevos)
  //    b) customers con cambios desde su updated_at en embeddings (sesiones nuevas, paquetes nuevos)
  const { data: lastRow } = await SB
    .from("amelia_customer_embeddings")
    .select("amelia_user_id")
    .order("amelia_user_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastId = lastRow?.amelia_user_id ?? 0;

  const ub = ameliaTable("users");
  const cb = ameliaTable("customer_bookings");
  const pc = ameliaTable("packages_to_customers");
  const pks = ameliaTable("packages");

  // Nuevos customers
  const newCustomers = await ameliaQuery<any>(
    `SELECT id, firstName, lastName, email, phone, countryPhoneIso, gender
     FROM ${ub} WHERE type='customer' AND id > ? ORDER BY id ASC LIMIT ?`,
    [lastId, MAX_PER_RUN],
  );

  // Customers cuya activity cambió ayer (refresh de stats)
  const { data: outdated } = await SB
    .from("amelia_customer_embeddings")
    .select("amelia_user_id")
    .lt("updated_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(Math.max(0, MAX_PER_RUN - newCustomers.length));
  const outdatedIds = (outdated ?? []).map((r) => r.amelia_user_id);

  const refreshCustomers = outdatedIds.length > 0
    ? await ameliaQuery<any>(
        `SELECT id, firstName, lastName, email, phone, countryPhoneIso, gender
         FROM ${ub} WHERE id IN (${outdatedIds.map(() => "?").join(",")})`,
        outdatedIds,
      )
    : [];

  const all = [...newCustomers, ...refreshCustomers];
  if (all.length === 0) {
    return NextResponse.json({ ok: true, message: "nothing to do", duration_ms: Date.now() - t0 });
  }

  // Stats y packages agregados
  const ids = all.map((c) => c.id);
  const placeholders = ids.map(() => "?").join(",");
  const [statsRows, pkgRows] = await Promise.all([
    ameliaQuery<any>(
      `SELECT cb.customerId,
        MAX(CASE WHEN cb.status='approved' THEN a.bookingStart END) AS last_appointment,
        SUM(CASE WHEN cb.status='approved' THEN 1 ELSE 0 END) AS total_approved,
        SUM(CASE WHEN cb.status='pending' THEN 1 ELSE 0 END) AS total_pending
       FROM ${cb} cb LEFT JOIN ${ameliaTable("appointments")} a ON a.id = cb.appointmentId
       WHERE cb.customerId IN (${placeholders}) GROUP BY cb.customerId`,
      ids,
    ),
    ameliaQuery<any>(
      `SELECT p.customerId, COUNT(*) AS packages_count,
        MAX(CASE WHEN p.status='approved' AND (p.end IS NULL OR p.end >= NOW()) THEN 1 ELSE 0 END) AS has_active_package,
        SUBSTRING_INDEX(GROUP_CONCAT(pk.name ORDER BY p.purchased DESC SEPARATOR '||'), '||', 1) AS last_package_name
       FROM ${pc} p LEFT JOIN ${pks} pk ON pk.id = p.packageId
       WHERE p.customerId IN (${placeholders}) AND p.status='approved' GROUP BY p.customerId`,
      ids,
    ),
  ]);
  const statsBy = new Map(statsRows.map((s: any) => [s.customerId, s]));
  const pkgBy = new Map(pkgRows.map((p: any) => [p.customerId, p]));

  // Embeber en sub-batches
  let embedded = 0;
  let failed = 0;
  for (let i = 0; i < all.length; i += BATCH) {
    const chunk = all.slice(i, i + BATCH);
    const enriched = chunk.map((c) => {
      const stats = statsBy.get(c.id) ?? { total_approved: 0, total_pending: 0, last_appointment: null };
      const pkg = pkgBy.get(c.id) ?? { packages_count: 0, has_active_package: 0, last_package_name: null };
      return { c, stats, pkg, text: profileTextFor(c, stats, pkg) };
    });
    let embeddings: number[][];
    try {
      embeddings = await voyageBatch(enriched.map((e) => e.text));
    } catch (e: any) {
      failed += chunk.length;
      continue;
    }
    const upserts = enriched.map((e, idx) => ({
      amelia_user_id: e.c.id,
      full_name: `${e.c.firstName ?? ""} ${e.c.lastName ?? ""}`.trim() || null,
      phone: e.c.phone,
      email: e.c.email,
      profile_text: e.text,
      total_approved: Number(e.stats.total_approved ?? 0),
      total_pending: Number(e.stats.total_pending ?? 0),
      has_active_package: Number(e.pkg.has_active_package ?? 0) === 1,
      packages_count: Number(e.pkg.packages_count ?? 0),
      last_appointment_at: e.stats.last_appointment ? new Date(e.stats.last_appointment).toISOString() : null,
      last_package_name: e.pkg.last_package_name ?? null,
      is_paid_customer: Number(e.stats.total_approved) >= 2 || Number(e.pkg.packages_count ?? 0) > 0,
      embedding: `[${embeddings[idx].join(",")}]`,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await SB.from("amelia_customer_embeddings").upsert(upserts as any, { onConflict: "amelia_user_id" });
    if (error) { failed += chunk.length; continue; }
    embedded += chunk.length;
  }

  return NextResponse.json({
    ok: true,
    embedded,
    failed,
    new_customers: newCustomers.length,
    refreshed: refreshCustomers.length,
    last_id_amelia: lastId,
    duration_ms: Date.now() - t0,
  });
}
