import { Asset, Keypair, Networks } from "@stellar/stellar-sdk";
import { toCall as noirToCall } from "@noirx402/agent-sdk";
import { describe, expect, it } from "vitest";
import { NATIVE_XLM_SAC, toNoirAsset } from "../src/noir-service";

describe("Noir asset boundary", () => {
  it("maps native XLM to the Testnet SAC contract address", () => {
    expect(NATIVE_XLM_SAC).toBe(Asset.native().contractId(Networks.TESTNET));
    expect(toNoirAsset("XLM")).toBe(NATIVE_XLM_SAC);
  });

  it("rejects malformed and unsupported asset identifiers", () => {
    expect(() => toNoirAsset("not-an-address")).toThrow("unsupported Noir asset identifier");
    expect(() => toNoirAsset("USDC")).toThrow("unsupported Noir asset identifier");
  });

  it("serializes a mapped native asset with a valid Stellar recipient", () => {
    const recipient = Keypair.random().publicKey();
    expect(() => noirToCall(recipient, {
      kind: "authorize",
      deviceHash: "a".repeat(64),
      merchant: recipient,
      asset: toNoirAsset("XLM"),
      amount: 10_000_000n,
      nonce: 1n,
    })).not.toThrow();
  });
});
