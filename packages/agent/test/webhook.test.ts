import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { VeloWebhookSignatureVerificationError } from "@carts1024/velo-sdk";
import { VeloService } from "../src/velo-service.js";

const secret = "whsec_test_secret";

function sign(payload: string, timestamp: number, key = secret) {
  const hmac = createHmac("sha256", key).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${hmac}`;
}

function paymentSucceededPayload(id: string) {
  return JSON.stringify({
    version: "1",
    id,
    type: "payment.succeeded",
    test: true,
    sentAt: new Date().toISOString(),
    project: { id: "proj_1", registryProjectId: "reg_1", name: "ABOT", slug: "abot" },
    paymentIntent: {
      id: "pi_1",
      amount: "25.00",
      asset: "USDC",
      merchantName: "ABOT",
      status: "paid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
}

describe("Velo webhook signature verification", () => {
  it("accepts a correctly signed, fresh payload", async () => {
    const payload = paymentSucceededPayload("evt_1");
    const signature = sign(payload, Math.floor(Date.now() / 1000));

    const event = await VeloService.verifyWebhook({ payload, signature, secret });

    expect(event.type).toBe("payment.succeeded");
  });

  it("rejects a payload signed with the wrong secret", async () => {
    const payload = paymentSucceededPayload("evt_2");
    const signature = sign(payload, Math.floor(Date.now() / 1000), "wrong_secret");

    await expect(VeloService.verifyWebhook({ payload, signature, secret })).rejects.toBeInstanceOf(
      VeloWebhookSignatureVerificationError,
    );
  });

  it("rejects a tampered payload even with a validly-formatted signature", async () => {
    const payload = paymentSucceededPayload("evt_3");
    const signature = sign(payload, Math.floor(Date.now() / 1000));
    const tampered = payload.replace('"amount":"25.00"', '"amount":"999.00"');

    await expect(VeloService.verifyWebhook({ payload, signature, secret: secret })).resolves.toBeTruthy();
    await expect(
      VeloService.verifyWebhook({ payload: tampered, signature, secret }),
    ).rejects.toBeInstanceOf(VeloWebhookSignatureVerificationError);
  });

  it("rejects a replayed, stale timestamp", async () => {
    const payload = paymentSucceededPayload("evt_4");
    const staleTimestamp = Math.floor(Date.now() / 1000) - 10_000; // ~2.7h old, outside the 300s default tolerance
    const signature = sign(payload, staleTimestamp);

    await expect(VeloService.verifyWebhook({ payload, signature, secret })).rejects.toBeInstanceOf(
      VeloWebhookSignatureVerificationError,
    );
  });

  it("rejects a missing signature header", async () => {
    const payload = paymentSucceededPayload("evt_5");
    await expect(VeloService.verifyWebhook({ payload, signature: null, secret })).rejects.toBeInstanceOf(
      VeloWebhookSignatureVerificationError,
    );
  });
});
