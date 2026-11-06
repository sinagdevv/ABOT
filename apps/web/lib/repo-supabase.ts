import type { FundingGateway, NewDecision, PayoutGateway } from "@abot/agent";
import type { Payout, PayoutStatus } from "@abot/shared";
import { supabaseServer } from "./supabase-server";

const PAYOUT_COLUMNS =
  "id, idempotency_key, device_hash, recipient_name, recipient_address, amount_stroops::text, asset, due_at, status, authorization_nonce, authorization_tx_hash, claim_tx_hash, failure_reason, lease_token, lease_expires_at, created_at, updated_at";

type PayoutRow = {
  id: string;
  idempotency_key: string;
  device_hash: string;
  recipient_name: string;
  recipient_address: string;
  amount_stroops: string;
  asset: string;
  due_at: string;
  status: PayoutStatus;
  authorization_nonce: string | null;
  authorization_tx_hash: string | null;
  claim_tx_hash: string | null;
  failure_reason: string | null;
  lease_token: string | null;
  lease_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

function toPayout(row: PayoutRow): Payout {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    deviceHash: row.device_hash,
    recipientName: row.recipient_name,
    recipientAddress: row.recipient_address,
    amountStroops: BigInt(row.amount_stroops),
    asset: row.asset,
    dueAt: row.due_at,
    status: row.status,
    authorizationNonce: row.authorization_nonce,
    authorizationTxHash: row.authorization_tx_hash,
    claimTxHash: row.claim_tx_hash,
    failureReason: row.failure_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    leaseToken: row.lease_token,
    leaseExpiresAt: row.lease_expires_at,
  };
}

function assertOk<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export class SupabasePayoutGateway implements PayoutGateway, FundingGateway {
  private get db() {
    return supabaseServer();
  }

  async claimDuePayouts(now: Date): Promise<Payout[]> {
    const result = await this.db.rpc("claim_due_payouts", { p_now: now.toISOString(), p_limit: 50 });
    const rows = assertOk(result as { data: PayoutRow[]; error: { message: string } | null });
    return rows.map(toPayout);
  }

  async resolveHold(payoutId: string, leaseToken: string, status: Extract<PayoutStatus, "pending" | "needs_funding">) {
    const result = await this.db
      .from("payouts")
      .update({ status, lease_token: null, lease_expires_at: null })
      .eq("id", payoutId)
      .eq("status", "authorizing")
      .eq("lease_token", leaseToken)
      .select("id")
      .maybeSingle();
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error("payout lease lost");
  }

  async completeAuthorization(payoutId: string, leaseToken: string, result: { txHash: string | null; nonce: string }) {
    const res = await this.db
      .from("payouts")
      .update({ status: "authorized", authorization_tx_hash: result.txHash, authorization_nonce: result.nonce, lease_token: null, lease_expires_at: null })
      .eq("id", payoutId)
      .eq("status", "authorizing")
      .eq("lease_token", leaseToken)
      .select("id")
      .maybeSingle();
    if (res.error) throw new Error(res.error.message);
    if (!res.data) throw new Error("payout lease lost");
  }

  async holdForReview(payoutId: string, leaseToken: string, reason: string) {
    const res = await this.db
      .from("payouts")
      .update({ status: "manual_review", failure_reason: reason, lease_token: null, lease_expires_at: null })
      .eq("id", payoutId)
      .eq("status", "authorizing")
      .eq("lease_token", leaseToken)
      .select("id")
      .maybeSingle();
    if (res.error) throw new Error(res.error.message);
    if (!res.data) throw new Error("payout lease lost");
  }

  async failPayout(payoutId: string, leaseToken: string, reason: string) {
    const res = await this.db
      .from("payouts")
      .update({ status: "failed", failure_reason: reason, lease_token: null, lease_expires_at: null })
      .eq("id", payoutId)
      .eq("status", "authorizing")
      .eq("lease_token", leaseToken)
      .select("id")
      .maybeSingle();
    if (res.error) throw new Error(res.error.message);
    if (!res.data) throw new Error("payout lease lost");
  }

  async recordDecision(decision: NewDecision) {
    const res = await this.db.from("agent_decisions").insert({
      payout_id: decision.payoutId,
      action: decision.action,
      reason: decision.reason,
      detail: decision.detail ?? null,
    });
    assertOk(res as { data: null; error: { message: string } | null });
  }

  async requeue(payoutId: string) {
    const res = await this.db
      .from("payouts")
      .update({ status: "pending", failure_reason: null })
      .eq("id", payoutId)
      .in("status", ["failed", "manual_review"]);
    assertOk(res as { data: null; error: { message: string } | null });
  }

  async hasOpenFundingRequest(payoutId: string): Promise<boolean> {
    const res = await this.db
      .from("funding_requests")
      .select("id", { count: "exact", head: true })
      .eq("payout_id", payoutId)
      .eq("status", "pending");
    if (res.error) throw new Error(res.error.message);
    return (res.count ?? 0) > 0;
  }

  async createFundingRequest(request: {
    payoutId: string;
    paymentIntentId: string;
    checkoutUrl: string | null;
    amount: string;
    asset: string;
  }) {
    const res = await this.db.from("funding_requests").insert({
      payout_id: request.payoutId,
      payment_intent_id: request.paymentIntentId,
      checkout_url: request.checkoutUrl,
      amount: request.amount,
      asset: request.asset,
    });
    // 23505 = unique_violation: another concurrent sweep already opened one. Idempotent by design.
    if (res.error && res.error.code !== "23505") throw new Error(res.error.message);
  }

  async createPayout(input: {
    idempotencyKey: string;
    deviceHash: string;
    recipientName: string;
    recipientAddress: string;
    amountStroops: bigint;
    asset: string;
    dueAt: string;
  }): Promise<Payout> {
    const res = await this.db
      .from("payouts")
      .insert(
        {
          idempotency_key: input.idempotencyKey,
          device_hash: input.deviceHash,
          recipient_name: input.recipientName,
          recipient_address: input.recipientAddress,
          amount_stroops: input.amountStroops.toString(),
          asset: input.asset,
          due_at: input.dueAt,
        },
      )
      .select(PAYOUT_COLUMNS)
      .single();
    if (res.error?.code === "23505") {
      const existing = await this.db.from("payouts").select(PAYOUT_COLUMNS).eq("idempotency_key", input.idempotencyKey).single();
      return toPayout(assertOk(existing as { data: PayoutRow; error: { message: string } | null }));
    }
    return toPayout(assertOk(res as { data: PayoutRow; error: { message: string } | null }));
  }

  async listPayouts(): Promise<Payout[]> {
    const res = await this.db
      .from("payouts")
      .select(PAYOUT_COLUMNS)
      .order("due_at", { ascending: true });
    return assertOk(res as { data: PayoutRow[]; error: { message: string } | null }).map(toPayout);
  }

  async getPayout(id: string): Promise<Payout | null> {
    const res = await this.db.from("payouts").select(PAYOUT_COLUMNS).eq("id", id).maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return res.data ? toPayout(res.data as PayoutRow) : null;
  }

  async markClaimed(payoutId: string, claimTxHash: string) {
    const res = await this.db
      .from("payouts")
      .update({ status: "claimed", claim_tx_hash: claimTxHash })
      .eq("id", payoutId)
      .eq("status", "authorized")
      .select("id")
      .maybeSingle();
    if (res.error) throw new Error(res.error.message);
    if (!res.data) throw new Error("payout was already claimed or changed");
  }

  async listDecisions(limit = 100) {
    const res = await this.db
      .from("agent_decisions")
      .select("id, payout_id, action, reason, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return assertOk(res as { data: unknown[]; error: { message: string } | null });
  }

  async markFundingRequestPaid(paymentIntentId: string, amount: string, asset: string) {
    const res = await this.db
      .from("funding_requests")
      .update({ status: "paid" })
      .eq("payment_intent_id", paymentIntentId)
      .eq("amount", amount)
      .eq("asset", asset)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (res.error) throw new Error(res.error.message);
    return Boolean(res.data);
  }

  async recordWebhookEvent(event: {
    id: string;
    source: "velo" | "noir";
    eventType: string;
    payload: Record<string, unknown>;
  }) {
    const res = await this.db
      .from("webhook_events")
      .insert({ id: event.id, source: event.source, event_type: event.eventType, payload: event.payload })
      .select("id")
      .maybeSingle();
    // Unique violation on id = already processed this delivery. Not an error, just a no-op.
    if (res.error && res.error.code !== "23505") throw new Error(res.error.message);
    return !res.error;
  }
}
