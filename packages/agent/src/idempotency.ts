import { createHash } from "node:crypto";

/** Deterministic key for a payout so re-submitting the same admin request never double-creates it. */
export function payoutIdempotencyKey(input: {
  deviceHash: string;
  recipientAddress: string;
  amountStroops: bigint;
  asset: string;
  dueAt: string;
}): string {
  const raw = [
    input.deviceHash,
    input.recipientAddress,
    input.amountStroops.toString(),
    input.asset,
    input.dueAt,
  ].join("|");
  return createHash("sha256").update(raw).digest("hex");
}
