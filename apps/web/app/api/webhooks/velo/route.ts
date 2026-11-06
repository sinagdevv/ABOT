import { VeloService } from "@abot/agent";
import { VeloWebhookSignatureVerificationError } from "@carts1024/velo-sdk";
import { env } from "../../../../lib/env";
import { SupabasePayoutGateway } from "../../../../lib/repo-supabase";
import { veloService } from "../../../../lib/services";

const gateway = new SupabasePayoutGateway();

/** Velo signs with HMAC-SHA256 over the raw body. Never parse as JSON before verifying. */
export async function POST(request: Request) {
  const payload = await request.text();
  if (payload.length > 128 * 1024) return new Response("request body too large", { status: 413 });
  const signature = request.headers.get("x-velo-signature");
  const deliveryId = request.headers.get("x-velo-delivery");

  let event: Awaited<ReturnType<typeof VeloService.verifyWebhook>>;
  try {
    event = await VeloService.verifyWebhook({ payload, signature, secret: env.veloWebhookSecret });
  } catch (err) {
    if (err instanceof VeloWebhookSignatureVerificationError) {
      return new Response("invalid signature", { status: 400 });
    }
    return new Response("verification error", { status: 400 });
  }

  if (event.type === "payment.succeeded") {
    if (event.paymentIntent.status !== "paid") return new Response("payment is not paid", { status: 400 });
    let intent: Awaited<ReturnType<ReturnType<typeof veloService>["retrievePaymentIntent"]>>;
    try {
      intent = await veloService().retrievePaymentIntent(event.paymentIntent.id);
    } catch {
      return new Response("payment verification unavailable", { status: 502 });
    }
    if (intent.status !== "paid") return new Response("payment is not paid", { status: 400 });
    if (intent.amount !== event.paymentIntent.amount || intent.asset !== event.paymentIntent.asset) {
      return new Response("payment details mismatch", { status: 400 });
    }
    const accepted = await gateway.markFundingRequestPaid(intent.id, intent.amount, intent.asset);
    if (!accepted) return Response.json({ received: true, linked: false });
  }

  // Delivery ids are the transport-level dedupe key; fall back to the event id if absent.
  const isNew = await gateway.recordWebhookEvent({
    id: `velo:${deliveryId ?? event.id}`,
    source: "velo",
    eventType: event.type,
    payload: {
      id: event.id,
      type: event.type,
      test: event.test,
      paymentIntent: "paymentIntent" in event
        ? {
            id: event.paymentIntent.id,
            amount: event.paymentIntent.amount,
            asset: event.paymentIntent.asset,
            status: event.paymentIntent.status,
          }
        : undefined,
    },
  });
  if (!isNew) return Response.json({ received: true, duplicate: true });

  return Response.json({ received: true });
}
