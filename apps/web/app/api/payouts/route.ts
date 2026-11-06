import { toStroops } from "@abot/shared";
import { payoutIdempotencyKey } from "@abot/agent";
import { Keypair } from "@stellar/stellar-sdk";
import type { Payout } from "@abot/shared";
import { isAuthorized, unauthorized } from "../../../lib/auth";
import { env } from "../../../lib/env";
import { SupabasePayoutGateway } from "../../../lib/repo-supabase";

const gateway = new SupabasePayoutGateway();

function publicPayout(payout: Payout) {
  const { leaseToken: _leaseToken, leaseExpiresAt: _leaseExpiresAt, ...safe } = payout;
  return { ...safe, amountStroops: payout.amountStroops.toString() };
}

function bodyTooLarge(request: Request) {
  return Number(request.headers.get("content-length") ?? 0) > 16_384;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  const payouts = await gateway.listPayouts();
  return Response.json({
    payouts: payouts.map(publicPayout),
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  if (bodyTooLarge(request)) return Response.json({ error: "request body too large" }, { status: 413 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { recipientName, recipientAddress, amount, asset, dueAt, deviceHash } = body as Record<string, unknown>;
  const resolvedDeviceHash = typeof deviceHash === "string" && deviceHash ? deviceHash : env.orgDeviceHash;

  let validRecipient = false;
  try {
    validRecipient = typeof recipientAddress === "string" && Keypair.fromPublicKey(recipientAddress).publicKey() === recipientAddress;
  } catch {
    validRecipient = false;
  }

  if (
    typeof recipientName !== "string" ||
    !recipientName ||
    recipientName.length > 200 ||
    typeof recipientAddress !== "string" ||
    !validRecipient ||
    typeof amount !== "string" ||
    typeof asset !== "string" ||
    !asset || asset.length > 128 ||
    typeof dueAt !== "string" ||
    Number.isNaN(Date.parse(dueAt)) ||
    !resolvedDeviceHash ||
    !/^[0-9a-f]{64}$/i.test(resolvedDeviceHash)
  ) {
    return Response.json(
      { error: "required: recipientName, recipientAddress (G...), amount (decimal string), asset, dueAt (ISO date); deviceHash if ORG_DEVICE_HASH is not configured" },
      { status: 400 },
    );
  }

  let amountStroops: bigint;
  try {
    amountStroops = toStroops(amount);
    if (amountStroops <= 0n) throw new Error("amount must be positive");
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "invalid amount" }, { status: 400 });
  }

  const idempotencyKey = payoutIdempotencyKey({
    deviceHash: resolvedDeviceHash,
    recipientAddress,
    amountStroops,
    asset,
    dueAt,
  });

  const payout = await gateway.createPayout({
    idempotencyKey,
    deviceHash: resolvedDeviceHash,
    recipientName,
    recipientAddress,
    amountStroops,
    asset,
    dueAt,
  });

  return Response.json(
    { payout: publicPayout(payout) },
    { status: 201 },
  );
}
