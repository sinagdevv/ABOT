import { describe, expect, it, vi } from "vitest";
import type { Payout, PayoutStatus } from "@abot/shared";
import { runAgentSweep } from "../src/engine";
import type { FundingGateway, NewDecision, PayoutGateway } from "../src/gateway";
import type { FundingSession, INoirService, IVeloService } from "../src/ports";

function makePayout(overrides: Partial<Payout> = {}): Payout {
  return {
    id: "payout-1",
    idempotencyKey: "key-1",
    deviceHash: "a".repeat(64),
    recipientName: "Juan Dela Cruz",
    recipientAddress: "GRECIPIENT",
    amountStroops: 10_000_000n,
    asset: "CTOKEN",
    dueAt: new Date(0).toISOString(),
    status: "pending",
    authorizationNonce: null,
    authorizationTxHash: null,
    claimTxHash: null,
    failureReason: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

class FakeGateway implements PayoutGateway, FundingGateway {
  statuses = new Map<string, PayoutStatus>();
  decisions: NewDecision[] = [];
  fundingRequests = new Set<string>();
  authorized: { payoutId: string; txHash: string | null }[] = [];
  failed: { payoutId: string; reason: string }[] = [];

  constructor(private readonly payouts: Payout[]) {
    for (const p of payouts) this.statuses.set(p.id, p.status);
  }

  async claimDuePayouts(now: Date): Promise<Payout[]> {
    return this.payouts.filter(
      (p) =>
        (this.statuses.get(p.id) === "pending" || this.statuses.get(p.id) === "needs_funding") &&
        new Date(p.dueAt).getTime() <= now.getTime(),
    );
  }
  async resolveHold(payoutId: string, status: "pending" | "needs_funding") {
    this.statuses.set(payoutId, status);
  }
  async completeAuthorization(payoutId: string, result: { txHash: string | null }) {
    this.statuses.set(payoutId, "authorized");
    this.authorized.push({ payoutId, txHash: result.txHash });
  }
  async failPayout(payoutId: string, reason: string) {
    this.statuses.set(payoutId, "failed");
    this.failed.push({ payoutId, reason });
  }
  async recordDecision(decision: NewDecision) {
    this.decisions.push(decision);
  }
  async requeue(payoutId: string) {
    this.statuses.set(payoutId, "pending");
  }
  async hasOpenFundingRequest(payoutId: string) {
    return this.fundingRequests.has(payoutId);
  }
  async createFundingRequest(request: { payoutId: string }) {
    this.fundingRequests.add(request.payoutId);
  }
}

const fundingUrls = { successUrl: "https://abot.app/fund/success", cancelUrl: "https://abot.app/fund/cancel" };

function fakeVelo(createFundingSession?: IVeloService["createFundingSession"]): IVeloService {
  return {
    createFundingSession: createFundingSession ?? (vi.fn() as unknown as IVeloService["createFundingSession"]),
    createTopUpSession: vi.fn() as unknown as IVeloService["createTopUpSession"],
  };
}

describe("runAgentSweep", () => {
  it("authorizes a payout that passes the contract's own policy check", async () => {
    const payout = makePayout();
    const gateway = new FakeGateway([payout]);
    const noir: INoirService = {
      checkPayment: async () => ({ ok: true }),
      getPendingBalance: async () => 0n,
      authorizePayment: async () => ({ txHash: "tx-hash-1", nonce: "123" }),
    };
    const velo = fakeVelo();

    const results = await runAgentSweep({ gateway, funding: gateway, noir, velo, fundingUrls, now: new Date(1) });

    expect(results).toEqual([{ payoutId: "payout-1", action: "authorized" }]);
    expect(gateway.statuses.get("payout-1")).toBe("authorized");
    expect(gateway.authorized).toEqual([{ payoutId: "payout-1", txHash: "tx-hash-1" }]);
  });

  it("requests Velo funding exactly once when the escrow is short, and holds as needs_funding", async () => {
    const payout = makePayout();
    const gateway = new FakeGateway([payout]);
    const noir: INoirService = {
      checkPayment: async () => ({ ok: false, reason: "insufficient_escrow" }),
      getPendingBalance: async () => 0n,
      authorizePayment: async () => ({ txHash: "unused", nonce: "0" }),
    };
    const session: FundingSession = { paymentIntentId: "pi_1", checkoutUrl: "https://velo/x", amount: "1", asset: "USDC" };
    const createFundingSession = vi.fn(async () => session);
    const velo = fakeVelo(createFundingSession);

    await runAgentSweep({ gateway, funding: gateway, noir, velo, fundingUrls, now: new Date(1) });
    // Simulate the sweep running again before the org has topped up escrow.
    gateway.statuses.set(payout.id, "needs_funding");
    await runAgentSweep({ gateway, funding: gateway, noir, velo, fundingUrls, now: new Date(1) });

    expect(createFundingSession).toHaveBeenCalledTimes(1);
    expect(gateway.statuses.get("payout-1")).toBe("needs_funding");
  });

  it("holds (does not authorize) a payout whose policy has expired", async () => {
    const payout = makePayout();
    const gateway = new FakeGateway([payout]);
    const noir: INoirService = {
      checkPayment: async () => ({ ok: false, reason: "expired" }),
      getPendingBalance: async () => 0n,
      authorizePayment: async () => ({ txHash: "unused", nonce: "0" }),
    };
    const velo = fakeVelo();

    const results = await runAgentSweep({ gateway, funding: gateway, noir, velo, fundingUrls, now: new Date(1) });

    expect(results).toEqual([{ payoutId: "payout-1", action: "hold_policy_expired" }]);
    expect(gateway.statuses.get("payout-1")).toBe("pending");
  });

  it("reconciles an uncertain submission instead of blindly retrying", async () => {
    const payout = makePayout();
    const gateway = new FakeGateway([payout]);
    let pendingBalance = 0n;
    const noir: INoirService = {
      checkPayment: async () => ({ ok: true }),
      getPendingBalance: async () => pendingBalance,
      authorizePayment: async () => {
        // The ledger actually applied the authorization before the SDK call errored.
        pendingBalance += payout.amountStroops;
        throw new Error("request timed out");
      },
    };
    const velo = fakeVelo();

    const results = await runAgentSweep({ gateway, funding: gateway, noir, velo, fundingUrls, now: new Date(1) });

    expect(results).toEqual([{ payoutId: "payout-1", action: "authorized" }]);
    expect(gateway.statuses.get("payout-1")).toBe("authorized");
    expect(gateway.failed).toEqual([]);
  });

  it("fails a payout when the submission is uncertain and the balance never reflects it", async () => {
    const payout = makePayout();
    const gateway = new FakeGateway([payout]);
    const noir: INoirService = {
      checkPayment: async () => ({ ok: true }),
      getPendingBalance: async () => 0n,
      authorizePayment: async () => {
        throw new Error("network error");
      },
    };
    const velo = fakeVelo();

    const results = await runAgentSweep({ gateway, funding: gateway, noir, velo, fundingUrls, now: new Date(1) });

    expect(results).toEqual([{ payoutId: "payout-1", action: "error" }]);
    expect(gateway.statuses.get("payout-1")).toBe("failed");
  });

  it("never claims a payout that is not yet due", async () => {
    const payout = makePayout({ dueAt: new Date(10_000).toISOString() });
    const gateway = new FakeGateway([payout]);
    const noir: INoirService = {
      checkPayment: vi.fn() as unknown as INoirService["checkPayment"],
      getPendingBalance: async () => 0n,
      authorizePayment: vi.fn() as unknown as INoirService["authorizePayment"],
    };
    const velo = fakeVelo();

    const results = await runAgentSweep({ gateway, funding: gateway, noir, velo, fundingUrls, now: new Date(1) });

    expect(results).toEqual([]);
    expect(gateway.statuses.get("payout-1")).toBe("pending");
  });
});
