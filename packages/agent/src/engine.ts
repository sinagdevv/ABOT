import type { AgentDecisionAction } from "@abot/shared";
import { actionForRefusal } from "./decision";
import type { FundingGateway, PayoutGateway } from "./gateway";
import type { INoirService, IVeloService } from "./ports";

export interface SweepResult {
  payoutId: string;
  action: AgentDecisionAction;
}

export interface SweepDeps {
  gateway: PayoutGateway;
  funding: FundingGateway;
  noir: INoirService;
  velo: IVeloService;
  fundingUrls: { successUrl: string; cancelUrl: string };
  now?: Date;
}

/**
 * One autonomous pass: claim due payouts, re-check each against the contract's
 * own policy, authorize what passes, request Velo funding for what doesn't fit
 * the escrow, and leave everything else for a human (expired/missing policy,
 * wrong asset, over the per-payment cap).
 */
export async function runAgentSweep(deps: SweepDeps): Promise<SweepResult[]> {
  const now = deps.now ?? new Date();
  const claimed = await deps.gateway.claimDuePayouts(now);
  const results: SweepResult[] = [];

  for (const payout of claimed) {
    try {
      const check = await deps.noir.checkPayment(payout);

      if (!check.ok) {
        const action = actionForRefusal(check.reason);

        if (action === "hold_needs_funding") {
          if (!(await deps.funding.hasOpenFundingRequest(payout.id))) {
            const session = await deps.velo.createFundingSession(payout, deps.fundingUrls);
            await deps.funding.createFundingRequest({
              payoutId: payout.id,
              paymentIntentId: session.paymentIntentId,
              checkoutUrl: session.checkoutUrl,
              amount: session.amount,
              asset: session.asset,
            });
          }
          await deps.gateway.resolveHold(payout.id, "needs_funding");
        } else {
          await deps.gateway.resolveHold(payout.id, "pending");
        }

        await deps.gateway.recordDecision({ payoutId: payout.id, action, reason: check.reason });
        results.push({ payoutId: payout.id, action });
        continue;
      }

      const pendingBefore = await deps.noir.getPendingBalance(payout.recipientAddress);
      try {
        const auth = await deps.noir.authorizePayment(payout);
        await deps.gateway.completeAuthorization(payout.id, auth);
        await deps.gateway.recordDecision({
          payoutId: payout.id,
          action: "authorized",
          reason: "policy check passed",
          detail: { txHash: auth.txHash, nonce: auth.nonce },
        });
        results.push({ payoutId: payout.id, action: "authorized" });
      } catch (submitError) {
        // The transaction may have reached the ledger even though the SDK call
        // threw (timeout, dropped response). Reconcile before ever retrying:
        // ponytail: balance-delta heuristic, not a per-nonce chain lookup —
        // upgrade to matching `payment.authorized` events by nonce once the
        // SDK exposes nonce on that event.
        const pendingAfter = await deps.noir.getPendingBalance(payout.recipientAddress);
        if (pendingAfter - pendingBefore >= payout.amountStroops) {
          await deps.gateway.completeAuthorization(payout.id, { txHash: null, nonce: "" });
          await deps.gateway.recordDecision({
            payoutId: payout.id,
            action: "authorized",
            reason: "reconciled after uncertain submission: merchant pending balance already reflects this payment",
          });
          results.push({ payoutId: payout.id, action: "authorized" });
        } else {
          throw submitError;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await deps.gateway.failPayout(payout.id, message);
      await deps.gateway.recordDecision({ payoutId: payout.id, action: "error", reason: message });
      results.push({ payoutId: payout.id, action: "error" });
    }
  }

  return results;
}
