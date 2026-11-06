"use client";

import { use, useState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";

export default function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch(`/api/payouts/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientSecret: secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "claim failed");
      setTxHash(data.txHash);
      setStatus("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "claim failed");
      setStatus("error");
    } finally {
      setSecret("");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-md rounded-xl2 bg-white p-8 shadow-card">
        <h1 className="mb-1 text-lg font-semibold text-ink">Claim your payout</h1>
        <p className="mb-6 text-sm text-ink/60">
          Testnet demo only. Your secret key signs the claim locally for this request and is never stored. Production
          ABOT connects a wallet extension instead of asking for a secret key.
        </p>

        {status === "done" ? (
          <div className="rounded-lg bg-mint/10 p-4 text-sm text-emerald">
            <CheckCircle2 className="mb-2" size={22} />
            Claimed. Transaction hash:
            <p className="mt-1 break-all font-mono text-xs">{txHash}</p>
          </div>
        ) : (
          <form onSubmit={claim}>
            <label className="mb-1 block text-xs font-medium text-ink/60">Testnet secret key (S…)</label>
            <input
              required
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="SA1B2C3…"
              className="mb-3 w-full rounded-lg border border-mist px-3 py-2 text-sm font-mono"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-emerald py-2.5 text-sm font-medium text-warm hover:bg-emerald/90 disabled:opacity-50"
            >
              {status === "loading" ? "Claiming…" : "Claim payment"}
            </button>
            {status === "error" && (
              <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
                <ShieldAlert size={14} /> {message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
