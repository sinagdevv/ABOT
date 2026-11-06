import { describe, expect, it } from "vitest";
import { payoutIdempotencyKey } from "../src/index";

describe("payoutIdempotencyKey", () => {
  it("is deterministic for identical inputs", () => {
    const input = {
      deviceHash: "a".repeat(64),
      recipientAddress: "GRECIPIENT",
      amountStroops: 10_000_000n,
      asset: "CTOKEN",
      dueAt: "2026-11-10T00:00:00.000Z",
    };
    expect(payoutIdempotencyKey(input)).toBe(payoutIdempotencyKey({ ...input }));
  });

  it("differs when the amount differs", () => {
    const base = {
      deviceHash: "a".repeat(64),
      recipientAddress: "GRECIPIENT",
      amountStroops: 10_000_000n,
      asset: "CTOKEN",
      dueAt: "2026-11-10T00:00:00.000Z",
    };
    expect(payoutIdempotencyKey(base)).not.toBe(payoutIdempotencyKey({ ...base, amountStroops: 20_000_000n }));
  });
});
