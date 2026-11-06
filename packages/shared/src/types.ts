/** Stroops: Stellar's smallest unit (1 XLM = 10_000_000 stroops). Always bigint — never float. */
export type Stroops = bigint;

export type PayoutStatus =
  | "pending"
  | "needs_funding"
  | "authorizing"
  | "manual_review"
  | "authorized"
  | "claimed"
  | "failed"
  | "cancelled";

export interface Payout {
  id: string;
  idempotencyKey: string;
  deviceHash: string;
  recipientName: string;
  recipientAddress: string;
  amountStroops: Stroops;
  asset: string;
  dueAt: string;
  status: PayoutStatus;
  authorizationNonce: string | null;
  authorizationTxHash: string | null;
  claimTxHash: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  /** Internal DB lease; never expose this in API responses. */
  leaseToken: string | null;
  leaseExpiresAt: string | null;
}

export type AgentDecisionAction =
  | "authorized"
  | "hold_not_due"
  | "hold_needs_funding"
  | "hold_policy_missing"
  | "hold_policy_expired"
  | "hold_over_limit"
  | "hold_wrong_asset"
  | "hold_in_flight"
  | "hold_manual_review"
  | "funding_requested"
  | "error";

export interface AgentDecision {
  id: string;
  payoutId: string;
  action: AgentDecisionAction;
  reason: string;
  escrowBalanceStroops: Stroops | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

export type FundingRequestStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled";

export interface FundingRequest {
  id: string;
  payoutId: string | null;
  paymentIntentId: string;
  checkoutUrl: string | null;
  amount: string;
  asset: string;
  status: FundingRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export type WebhookSource = "velo" | "noir";

export interface WebhookEventRecord {
  id: string;
  source: WebhookSource;
  eventType: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}
