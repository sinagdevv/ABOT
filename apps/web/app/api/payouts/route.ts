import { toStroops } from "@abot/shared";
import { payoutIdempotencyKey } from "@abot/agent";
import { isAuthorized, unauthorized } from "../../../lib/auth";
import { env } from "../../../lib/env";
import { SupabasePayoutGateway } from "../../../lib/repo-supabase";

const gateway = new SupabasePayoutGateway();

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  const payouts = await gateway.listPayouts();
  return Response.json({
    payouts: payouts.map((p) => ({ ...p, amountStroops: p.amountStroops.toString() })),
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { recipientName, recipientAddress, amount, asset, dueAt, deviceHash } = body as Record<string, unknown>;
  const resolvedDeviceHash = typeof deviceHash === "string" && deviceHash ? deviceHash : env.orgDeviceHash;

  if (
    typeof recipientName !== "string" ||
    !recipientName ||
    typeof recipientAddress !== "string" ||
    !recipientAddress.startsWith("G") ||
    typeof amount !== "string" ||
    typeof asset !== "string" ||
    !asset ||
    typeof dueAt !== "string" ||
    Number.isNaN(Date.parse(dueAt)) ||
    !resolvedDeviceHash
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
    { payout: { ...payout, amountStroops: payout.amountStroops.toString() } },
    { status: 201 },
  );
}
