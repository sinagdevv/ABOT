"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Wallet } from "lucide-react";
import { adminFetch } from "../../../lib/api-client";
import { Card, PageHeader } from "../../../components/card";
import { StatusBadge } from "../../../components/status-badge";

type FundingRequest = {
  id: string;
  payout_id: string | null;
  payment_intent_id: string;
  checkout_url: string | null;
  amount: string;
  asset: string;
  status: string;
  created_at: string;
};

export default function FundPage() {
  const [requests, setRequests] = useState<FundingRequest[] | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const { fundingRequests } = await adminFetch("/api/fund");
      setRequests(fundingRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createTopUp(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { checkoutUrl } = await adminFetch("/api/fund", { method: "POST", body: JSON.stringify({ amount }) });
      setAmount("");
      await load();
      if (checkoutUrl) window.open(checkoutUrl, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create funding session");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Velo funding"
        description="Velo checkout tops up ABOT's operating balance. It does not fund Noir escrow directly — that's a separate, deliberate step once funds arrive."
      />
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <Card className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Wallet size={14} /> Request a top-up
        </h2>
        <form onSubmit={createTopUp} className="flex gap-3">
          <input
            required
            placeholder="Amount (e.g. 100.00)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 rounded-lg border border-mist px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald px-4 py-2 text-sm font-medium text-warm hover:bg-emerald/90 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create checkout session"}
          </button>
        </form>
        <p className="mt-2 text-xs text-ink/50">
          Underfunded payouts also open a session automatically the next time the agent sweep runs.
        </p>
      </Card>

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-mist text-xs uppercase tracking-wide text-ink/50">
              <th className="py-2">Payment intent</th>
              <th>Amount</th>
              <th>Linked payout</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((r) => (
              <tr key={r.id} className="border-b border-mist/60">
                <td className="py-3 font-mono text-xs text-ink/60">{r.payment_intent_id}</td>
                <td>
                  {r.amount} {r.asset}
                </td>
                <td className="font-mono text-xs text-ink/40">{r.payout_id?.slice(0, 8) ?? "—"}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td className="text-xs text-ink/50">{new Date(r.created_at).toLocaleString()}</td>
                <td>
                  {r.checkout_url && r.status === "pending" && (
                    <a
                      href={r.checkout_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald hover:underline"
                    >
                      <ExternalLink size={12} /> Open checkout
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {requests && requests.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink/40">
                  No funding requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
