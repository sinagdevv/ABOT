import { Velo } from "@carts1024/velo-sdk";
import { fromStroops } from "@abot/shared";
import type { Payout } from "@abot/shared";

export class VeloService {
  private readonly velo: Velo;
  private readonly fundingAsset: string;

  constructor(opts: { apiKey: string; baseUrl?: string; environment?: string; fundingAsset?: string }) {
    this.velo = new Velo({
      apiKey: opts.apiKey,
      environment: opts.environment ?? "testnet",
      baseUrl: opts.baseUrl,
    });
    this.fundingAsset = opts.fundingAsset ?? "USDC";
  }

  /** One checkout session per underfunded payout, so re-running the sweep never opens duplicates. */
  async createFundingSession(payout: Payout, urls: { successUrl: string; cancelUrl: string }) {
    return this.createCheckoutSession({
      amount: fromStroops(payout.amountStroops),
      description: `ABOT escrow top-up for payout ${payout.id} (${payout.recipientName})`,
      idempotencyKey: `fund:${payout.id}`,
      urls,
    });
  }

  /** General, not-tied-to-one-payout top-up of the org's operating balance. */
  async createTopUpSession(amountDecimal: string, urls: { successUrl: string; cancelUrl: string }) {
    return this.createCheckoutSession({
      amount: amountDecimal,
      description: "ABOT operating balance top-up",
      idempotencyKey: `topup:${amountDecimal}:${Date.now()}`,
      urls,
    });
  }

  private createCheckoutSession(params: {
    amount: string;
    description: string;
    idempotencyKey: string;
    urls: { successUrl: string; cancelUrl: string };
  }) {
    return this.velo.checkout.sessions.create(
      {
        amount: params.amount,
        asset: this.fundingAsset,
        description: params.description,
        successUrl: params.urls.successUrl,
        cancelUrl: params.urls.cancelUrl,
      },
      { idempotencyKey: params.idempotencyKey },
    );
  }

  retrievePaymentIntent(id: string) {
    return this.velo.paymentIntents.retrieve(id);
  }

  static verifyWebhook(params: { payload: string; signature: string | null; secret: string }) {
    return Velo.webhooks.verify(params);
  }
}
