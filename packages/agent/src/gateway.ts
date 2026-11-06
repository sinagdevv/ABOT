import type { AgentDecisionAction, Payout, PayoutStatus } from "@abot/shared";

export interface NewDecision {
  payoutId: string;
  action: AgentDecisionAction;
  reason: string;
  detail?: Record<string, unknown>;
}

/**
 * Everything the decision engine needs from storage. Implemented against
 * Supabase in apps/web; a fake in-memory implementation backs the unit tests.
 */
export interface PayoutGateway {
  /**
   * Atomically selects due, unlocked payouts and flips them to `authorizing`
   * in the same transaction (DB-level `FOR UPDATE SKIP LOCKED`), so two
   * concurrent sweeps never claim the same payout.
   */
  claimDuePayouts(now: Date): Promise<Payout[]>;
  /** Releases a payout claimed above back to a non-terminal status (no authorization happened). */
  resolveHold(payoutId: string, status: Extract<PayoutStatus, "pending" | "needs_funding">): Promise<void>;
  completeAuthorization(payoutId: string, result: { txHash: string | null; nonce: string }): Promise<void>;
  failPayout(payoutId: string, reason: string): Promise<void>;
  recordDecision(decision: NewDecision): Promise<void>;
  /** Admin-initiated: a human reviewed a failed payout and wants the next sweep to re-evaluate it. */
  requeue(payoutId: string): Promise<void>;
}

export interface FundingGateway {
  hasOpenFundingRequest(payoutId: string): Promise<boolean>;
  createFundingRequest(request: {
    payoutId: string;
    paymentIntentId: string;
    checkoutUrl: string | null;
    amount: string;
    asset: string;
  }): Promise<void>;
}
