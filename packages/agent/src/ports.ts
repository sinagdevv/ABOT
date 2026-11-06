import type { PaymentCheck } from "@noirx402/agent-sdk";
import type { Payout } from "@abot/shared";
import type { AuthorizeResult } from "./noir-service";

/** What the engine needs from Noir — narrow enough that tests can fake it without the real SDK. */
export interface INoirService {
  checkPayment(payout: Payout): Promise<PaymentCheck>;
  getPendingBalance(merchant: string): Promise<bigint>;
  authorizePayment(payout: Payout): Promise<AuthorizeResult>;
}

export interface FundingSession {
  paymentIntentId: string;
  checkoutUrl: string | null;
  amount: string;
  asset: string;
}

/** What the engine needs from Velo — narrow enough that tests can fake it without the real SDK. */
export interface IVeloService {
  createFundingSession(payout: Payout, urls: { successUrl: string; cancelUrl: string }): Promise<FundingSession>;
  createTopUpSession(amountDecimal: string, urls: { successUrl: string; cancelUrl: string }): Promise<FundingSession>;
}
