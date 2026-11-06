import { VeloService } from "@abot/agent";
import { VeloWebhookSignatureVerificationError } from "@carts1024/velo-sdk";
import { env } from "../../../../lib/env";
import { SupabasePayoutGateway } from "../../../../lib/repo-supabase";

const gateway = new SupabasePayoutGateway();

/** Velo signs with HMAC-SHA256 over the raw body. Never parse as JSON before verifying. */
export async function POST(request: Request) {
  const payload = await request.text();
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

  // Delivery ids are the transport-level dedupe key; fall back to the event id if absent.
  const isNew = await gateway.recordWebhookEvent({
    id: `velo:${deliveryId ?? event.id}`,
    source: "velo",
    eventType: event.type,
    payload: event as unknown as Record<string, unknown>,
  });
  if (!isNew) return Response.json({ received: true, duplicate: true });

  if (event.type === "payment.succeeded") {
    await gateway.markFundingRequestPaid(event.paymentIntent.id);
  }

  return Response.json({ received: true });
}
