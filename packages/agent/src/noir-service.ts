import {
  NoirAgentClient,
  keypairSigner,
  type NoirSigner,
  type PaymentCheck,
} from "@noirx402/agent-sdk";
import { Asset, Networks, StrKey } from "@stellar/stellar-sdk";
import type { Payout } from "@abot/shared";

export interface AuthorizeResult {
  txHash: string;
  nonce: string;
}

export const NATIVE_XLM_SAC = Asset.native().contractId(Networks.TESTNET);

/** Persist business asset codes, but give Noir the Testnet SAC address it serializes as an Address. */
export function toNoirAsset(asset: string): string {
  const normalized = asset.trim();
  if (normalized === "XLM") return NATIVE_XLM_SAC;
  if (StrKey.isValidContract(normalized)) return normalized;
  throw new Error(`unsupported Noir asset identifier: ${asset}`);
}

/** Thin wrapper over NoirAgentClient scoped to ABOT's payout flow. The agent key signs server-side only. */
export class NoirService {
  private readonly client: NoirAgentClient;
  private readonly agent: NoirSigner;

  constructor(opts: { agentSecret: string; expectedAgentPublicKey?: string; rpcUrl?: string }) {
    this.client = new NoirAgentClient(opts.rpcUrl ? { rpcUrl: opts.rpcUrl } : undefined);
    this.agent = keypairSigner(opts.agentSecret);
    if (opts.expectedAgentPublicKey && this.agent.publicKey !== opts.expectedAgentPublicKey) {
      throw new Error("AGENT_PUBLIC_KEY does not match the public key derived from AGENT_SECRET");
    }
  }

  checkPayment(payout: Payout): Promise<PaymentCheck> {
    return this.client.checkPayment({
      deviceHash: payout.deviceHash,
      agent: this.agent.publicKey,
      asset: toNoirAsset(payout.asset),
      amount: payout.amountStroops,
    });
  }

  getEscrowBalance(deviceHash: string): Promise<bigint> {
    return this.client.getEscrowBalance(deviceHash);
  }

  getPendingBalance(merchant: string): Promise<bigint> {
    return this.client.getPendingBalance(merchant);
  }

  async authorizePayment(payout: Payout): Promise<AuthorizeResult> {
    const nonce = payout.authorizationNonce ? BigInt(payout.authorizationNonce) : BigInt(Date.now());
    const { hash, nonce: submittedNonce } = await this.client.authorizePayment({
      agent: this.agent,
      deviceHash: payout.deviceHash,
      merchant: payout.recipientAddress,
      asset: toNoirAsset(payout.asset),
      amount: payout.amountStroops,
      nonce,
    });
    return { txHash: hash, nonce: submittedNonce.toString() };
  }

  claim(merchant: NoirSigner, token: string): Promise<{ hash: string }> {
    return this.client.claim({ merchant, token: toNoirAsset(token) });
  }

  submitClaim(signedTxXdr: string, token: string): Promise<string> {
    return this.client.submit(signedTxXdr, { kind: "claim", token: toNoirAsset(token) });
  }

  prepareClaim(source: string, token: string): Promise<string> {
    return this.client.prepare(source, { kind: "claim", token: toNoirAsset(token) });
  }
}
