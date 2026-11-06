import { Networks, TransactionBuilder } from "@stellar/stellar-sdk";
import { SupabasePayoutGateway } from "../../../../../lib/repo-supabase";
import { noirService } from "../../../../../lib/services";

const gateway = new SupabasePayoutGateway();

/** Recipient wallets sign; ABOT only submits the signed XDR. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (Number(request.headers.get("content-length") ?? 0) > 64_000) {
    return Response.json({ error: "request body too large" }, { status: 413 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const signedTxXdr = body && typeof body === "object" ? (body as Record<string, unknown>).signedTxXdr : null;

  if (typeof signedTxXdr !== "string" || signedTxXdr.length > 64_000) {
    return Response.json({ error: "signedTxXdr (wallet-signed Stellar transaction) is required" }, { status: 400 });
  }

  const payout = await gateway.getPayout(id);
  if (!payout) return Response.json({ error: "payout not found" }, { status: 404 });
  if (payout.status !== "authorized") {
    return Response.json({ error: `payout is '${payout.status}', not ready to claim` }, { status: 409 });
  }

  let source: string;
  try {
    const transaction = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
    if (!("source" in transaction)) throw new Error("fee-bump transaction is not accepted");
    source = transaction.source;
  } catch {
    return Response.json({ error: "invalid signed transaction" }, { status: 400 });
  }

  if (source !== payout.recipientAddress) {
    return Response.json({ error: "signed transaction source does not match the payout recipient" }, { status: 403 });
  }

  try {
    const hash = await noirService().submitClaim(signedTxXdr, payout.asset);
    await gateway.markClaimed(payout.id, hash);
    return Response.json({ ok: true, txHash: hash }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "claim failed" }, { status: 502 });
  }
}
