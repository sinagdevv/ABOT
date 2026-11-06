// Standalone, dependency-isolated smoke test against Noir's real Testnet
// contracts (no ABOT env vars needed). Run with:
//   npm install @noirx402/agent-sdk@0.3.0 @stellar/stellar-sdk@16 --no-save
//   node docs/scripts/testnet-smoke.mjs
// Generates two throwaway Testnet keypairs, funds them via Friendbot, and
// drives the full register -> fund -> authorize -> claim lifecycle, printing
// a confirmed transaction hash at every step. See docs/testnet-evidence.md
// for a recorded run.
import {
  NoirAgentClient,
  keypairSigner,
  normalizeDeviceHash,
  toStroops,
  fromStroops,
} from "@noirx402/agent-sdk";
import { Keypair, Asset, Networks } from "@stellar/stellar-sdk";
import { createHash } from "node:crypto";

async function fund(pubkey) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${pubkey}`);
  if (!res.ok) throw new Error(`friendbot failed for ${pubkey}: ${await res.text()}`);
}

function log(label, value) {
  console.log(`\n=== ${label} ===`);
  console.log(value);
}

async function main() {
  const owner = Keypair.random(); // also acts as the device/agent key for this smoke test
  const merchant = Keypair.random();

  log("owner/agent public key", owner.publicKey());
  log("merchant public key", merchant.publicKey());

  await fund(owner.publicKey());
  await fund(merchant.publicKey());
  log("friendbot", "funded both Testnet accounts");

  const noir = new NoirAgentClient(); // Testnet by default
  const deviceHash = normalizeDeviceHash(createHash("sha256").update(owner.publicKey()).digest("hex"));
  const asset = Asset.native().contractId(Networks.TESTNET);
  log("device hash", deviceHash);
  log("native XLM SAC contract id (asset)", asset);

  const ownerSigner = keypairSigner(owner.secret());
  const merchantSigner = keypairSigner(merchant.secret());

  const r1 = await noir.execute(ownerSigner, { kind: "registerDevice", deviceHash, agent: owner.publicKey() });
  log("registerDevice tx hash", r1.hash);

  const r2 = await noir.execute(ownerSigner, {
    kind: "registerAgent",
    deviceHash,
    agent: owner.publicKey(),
    asset,
    maxAmount: toStroops("50"),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });
  log("registerAgent tx hash", r2.hash);

  const r3 = await noir.execute(ownerSigner, { kind: "fundEscrow", deviceHash, token: asset, amount: toStroops("20") });
  log("fundEscrow tx hash", r3.hash);

  const escrowBalance = await noir.getEscrowBalance(deviceHash);
  log("escrow balance after funding", `${fromStroops(escrowBalance)} XLM`);

  const check = await noir.checkPayment({ deviceHash, agent: owner.publicKey(), asset, amount: toStroops("5") });
  log("checkPayment result", JSON.stringify(check));

  const auth = await noir.authorizePayment({
    agent: ownerSigner,
    deviceHash,
    merchant: merchant.publicKey(),
    asset,
    amount: toStroops("5"),
  });
  log("authorizePayment tx hash", auth.hash);

  const pending = await noir.getPendingBalance(merchant.publicKey());
  log("merchant pending balance", `${fromStroops(pending)} XLM`);

  const claim = await noir.claim({ merchant: merchantSigner, token: asset });
  log("claim tx hash", claim.hash);

  // Also exercise the insufficient-escrow / over-limit refusal path ABOT's agent relies on.
  const overCheck = await noir.checkPayment({ deviceHash, agent: owner.publicKey(), asset, amount: toStroops("100") });
  log("checkPayment over-limit result", JSON.stringify(overCheck));

  log("SUMMARY", {
    deviceHash,
    ownerAgent: owner.publicKey(),
    merchant: merchant.publicKey(),
    asset,
    registerDeviceTx: r1.hash,
    registerAgentTx: r2.hash,
    fundEscrowTx: r3.hash,
    authorizePaymentTx: auth.hash,
    claimTx: claim.hash,
  });
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
