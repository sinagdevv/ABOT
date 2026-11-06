import { Keypair } from "@stellar/stellar-sdk";
import { keypairSigner } from "@noirx402/agent-sdk";
import { SupabasePayoutGateway } from "../../../../../lib/repo-supabase";
import { noirService } from "../../../../../lib/services";

const gateway = new SupabasePayoutGateway();

/**
 * Recipient-initiated claim. Testnet demo only: the recipient pastes their
 * Testnet secret key, which signs the claim transaction server-side and is
 * never stored or logged. Production would replace this with a browser
 * wallet signer (Freighter / Stellar Wallets Kit) via the Noir SDK's
 * `walletSigner`, so the secret never leaves the recipient's device.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const recipientSecret = body && typeof body === "object" ? (body as Record<string, unknown>).recipientSecret : null;

  if (typeof recipientSecret !== "string" || !recipientSecret.startsWith("S")) {
    return Response.json({ error: "recipientSecret (Stellar Testnet secret key) is required" }, { status: 400 });
  }

  const payout = await gateway.getPayout(id);
  if (!payout) return Response.json({ error: "payout not found" }, { status: 404 });
  if (payout.status !== "authorized") {
    return Response.json({ error: `payout is '${payout.status}', not ready to claim` }, { status: 409 });
  }

  let keypair: Keypair;
  try {
    keypair = Keypair.fromSecret(recipientSecret);
  } catch {
    return Response.json({ error: "invalid secret key" }, { status: 400 });
  }

  if (keypair.publicKey() !== payout.recipientAddress) {
    return Response.json({ error: "this key does not match the payout's recipient address" }, { status: 403 });
  }

  try {
    const { hash } = await noirService().claim(keypairSigner(recipientSecret), payout.asset);
    await gateway.markClaimed(payout.id, hash);
    return Response.json({ ok: true, txHash: hash });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "claim failed" }, { status: 502 });
  }
}
