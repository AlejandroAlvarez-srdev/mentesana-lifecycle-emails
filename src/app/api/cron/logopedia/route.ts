import { NextRequest, NextResponse } from "next/server";
import { ameliaQuery } from "@/lib/amelia-db";
import { fulfillLogopedia } from "@/lib/logopedia/fulfill";
import { expireUncreatedOrder, releaseExpiredOrder, stripeLogopedia, type Order } from "@/lib/logopedia/orders";
import { ordersTable } from "@/lib/logopedia/setup";
import { equalSecret } from "@/lib/logopedia/security";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(req:NextRequest) {
  const secret=process.env.CRON_SECRET;
  if(!secret||!equalSecret(req.headers.get("authorization")||"",`Bearer ${secret}`)) return NextResponse.json({error:"unauthorized"},{status:401});
  try {
    const orders=await ameliaQuery<Order>(`SELECT * FROM ${ordersTable()} WHERE (worker_until IS NULL OR worker_until<UTC_TIMESTAMP()) AND ((state IN ('creating','pending') AND expires_at<UTC_TIMESTAMP()) OR state='paid' OR (state='attention' AND email_sent_at IS NULL)) ORDER BY created_at LIMIT 8`);
    let processed=0,failed=0;
    for(const order of orders) {
      try {
        const session=order.stripe_session_id?await stripeLogopedia().checkout.sessions.retrieve(order.stripe_session_id):await expireUncreatedOrder(order);
        if(session?.payment_status==="paid") await fulfillLogopedia(session);
        else if(session?.status==="expired") await releaseExpiredOrder(session);
        processed++;
      } catch {failed++;}
    }
    return NextResponse.json({processed,failed});
  } catch { return NextResponse.json({error:"reconciliation_unavailable"},{status:503}); }
}
