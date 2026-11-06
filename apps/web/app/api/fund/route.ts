import { isAuthorized, unauthorized } from "../../../lib/auth";
import { env } from "../../../lib/env";
import { veloService } from "../../../lib/services";
import { supabaseServer } from "../../../lib/supabase-server";

/** Admin-initiated, general top-up (not tied to one payout) — pre-funding the org's operating balance. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  if (Number(request.headers.get("content-length") ?? 0) > 4_096) {
    return Response.json({ error: "request body too large" }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  const amount = body && typeof body === "object" ? (body as Record<string, unknown>).amount : null;
  if (typeof amount !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,12})?$/.test(amount) || /^0(?:\.0*)?$/.test(amount)) {
    return Response.json({ error: "amount (decimal string) is required" }, { status: 400 });
  }

  const session = await veloService().createTopUpSession(amount, {
    successUrl: `${env.appUrl}/fund/success`,
    cancelUrl: `${env.appUrl}/fund/cancel`,
  });

  const res = await supabaseServer().from("funding_requests").insert({
    payout_id: null,
    payment_intent_id: session.paymentIntentId,
    checkout_url: session.checkoutUrl,
    amount: session.amount,
    asset: session.asset,
  });
  if (res.error) return Response.json({ error: res.error.message }, { status: 500 });

  return Response.json({ checkoutUrl: session.checkoutUrl, paymentIntentId: session.paymentIntentId });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  const res = await supabaseServer()
    .from("funding_requests")
    .select("id, payout_id, payment_intent_id, checkout_url, amount, asset, status, created_at")
    .order("created_at", { ascending: false });
  if (res.error) return Response.json({ error: res.error.message }, { status: 500 });
  return Response.json({ fundingRequests: res.data });
}
