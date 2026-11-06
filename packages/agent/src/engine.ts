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
    const leaseToken = payout.leaseToken;
    if (!leaseToken) throw new Error(`payout ${payout.id} was claimed without a lease`);
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
          await deps.gateway.resolveHold(payout.id, leaseToken, "needs_funding");
        } else {
          await deps.gateway.resolveHold(payout.id, leaseToken, "pending");
        }

        await deps.gateway.recordDecision({ payoutId: payout.id, action, reason: check.reason });
        results.push({ payoutId: payout.id, action });
        continue;
      }

      try {
        const auth = await deps.noir.authorizePayment(payout);
        await deps.gateway.completeAuthorization(payout.id, leaseToken, auth);
        await deps.gateway.recordDecision({
          payoutId: payout.id,
          action: "authorized",
          reason: "policy check passed",
          detail: { txHash: auth.txHash, nonce: auth.nonce },
        });
        results.push({ payoutId: payout.id, action: "authorized" });
      } catch (submitError) {
        // Noir events do not include the authorization nonce, so neither a
        // balance delta nor an event can prove this particular payout was paid.
        const reason = "authorization outcome uncertain; held for manual review instead of retrying";
        await deps.gateway.holdForReview(payout.id, leaseToken, reason);
        await deps.gateway.recordDecision({ payoutId: payout.id, action: "hold_manual_review", reason });
        results.push({ payoutId: payout.id, action: "hold_manual_review" });
      }
    } catch (err) {
      const message = (err instanceof Error ? err.message : String(err)).slice(0, 500);
      await deps.gateway.failPayout(payout.id, leaseToken, message);
      await deps.gateway.recordDecision({ payoutId: payout.id, action: "error", reason: message });
      results.push({ payoutId: payout.id, action: "error" });
    }
  }

  return results;
}
