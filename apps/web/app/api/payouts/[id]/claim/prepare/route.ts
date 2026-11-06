import { Keypair } from "@stellar/stellar-sdk";
import { SupabasePayoutGateway } from "../../../../../../lib/repo-supabase";
import { noirService } from "../../../../../../lib/services";

const gateway = new SupabasePayoutGateway();

/** Builds the unsigned claim transaction; the recipient wallet signs it. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = new URL(request.url).searchParams.get("source");
  if (!source) return Response.json({ error: "source (recipient public key) is required" }, { status: 400 });

  try {
    if (Keypair.fromPublicKey(source).publicKey() !== source) throw new Error("invalid source");
  } catch {
    return Response.json({ error: "invalid recipient public key" }, { status: 400 });
  }

  const payout = await gateway.getPayout(id);
  if (!payout) return Response.json({ error: "payout not found" }, { status: 404 });
  if (payout.status !== "authorized") {
    return Response.json({ error: `payout is '${payout.status}', not ready to claim` }, { status: 409 });
  }
  if (source !== payout.recipientAddress) return Response.json({ error: "source does not match payout recipient" }, { status: 403 });

  const unsignedTxXdr = await noirService().prepareClaim(source, payout.asset);
  return Response.json({ unsignedTxXdr }, { headers: { "Cache-Control": "no-store" } });
}
