import type { PaymentRefusal } from "@noirx402/agent-sdk";
import type { AgentDecisionAction, Payout } from "@abot/shared";

/** Maps the contract's own refusal reason (from `checkPayment`) to what ABOT does about it. */
export function actionForRefusal(reason: PaymentRefusal): AgentDecisionAction {
  switch (reason) {
    case "insufficient_escrow":
      return "hold_needs_funding";
    case "no_agent":
    case "wrong_agent":
      return "hold_policy_missing";
    case "wrong_asset":
      return "hold_wrong_asset";
    case "over_limit":
      return "hold_over_limit";
    case "expired":
      return "hold_policy_expired";
    case "invalid_amount":
      return "error";
  }
}

export function isDue(payout: Payout, now: Date): boolean {
  return new Date(payout.dueAt).getTime() <= now.getTime();
}
