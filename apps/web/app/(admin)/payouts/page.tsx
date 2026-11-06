"use client";

import { useEffect, useState } from "react";
import { fromStroops } from "@abot/shared";
import { Plus, RotateCcw } from "lucide-react";
import { adminFetch } from "../../../lib/api-client";
import { Card, PageHeader } from "../../../components/card";
import { StatusBadge } from "../../../components/status-badge";

type PayoutRow = {
  id: string;
  status: string;
  amountStroops: string;
  asset: string;
  recipientName: string;
  recipientAddress: string;
  dueAt: string;
  failureReason: string | null;
  authorizationTxHash: string | null;
  claimTxHash: string | null;
};

const EMPTY_FORM = { recipientName: "", recipientAddress: "", amount: "", asset: "", dueAt: "" };

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRow[] | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const { payouts } = await adminFetch("/api/payouts");
      setPayouts(payouts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPayout(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminFetch("/api/payouts", {
        method: "POST",
        body: JSON.stringify({ ...form, dueAt: new Date(form.dueAt).toISOString() }),
      });
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create payout");
    } finally {
      setSubmitting(false);
    }
  }

  async function requeue(id: string) {
    await adminFetch(`/api/payouts/${id}/requeue`, { method: "POST", body: "{}" });
    await load();
  }

  return (
    <div>
      <PageHeader title="Payout queue" description="Admin-approved payouts, evaluated and authorized autonomously." />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <Card className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Plus size={14} /> New approved payout
        </h2>
        <form onSubmit={createPayout} className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <input
            required
            placeholder="Recipient name"
            value={form.recipientName}
            onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
            className="col-span-2 rounded-lg border border-mist px-3 py-2 text-sm md:col-span-1"
          />
          <input
            required
            placeholder="Recipient G… address"
            value={form.recipientAddress}
            onChange={(e) => setForm({ ...form, recipientAddress: e.target.value })}
            className="col-span-2 rounded-lg border border-mist px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Amount (e.g. 25.5)"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="rounded-lg border border-mist px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Asset contract (C…)"
            value={form.asset}
            onChange={(e) => setForm({ ...form, asset: e.target.value })}
            className="rounded-lg border border-mist px-3 py-2 text-sm"
          />
          <input
            required
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            className="rounded-lg border border-mist px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="col-span-2 rounded-lg bg-emerald px-3 py-2 text-sm font-medium text-warm hover:bg-emerald/90 disabled:opacity-50 md:col-span-5"
          >
            {submitting ? "Creating…" : "Approve payout"}
          </button>
        </form>
      </Card>

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-mist text-xs uppercase tracking-wide text-ink/50">
              <th className="py-2">Recipient</th>
              <th>Amount</th>
              <th>Due</th>
              <th>Status</th>
              <th>Evidence</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(payouts ?? []).map((p) => (
              <tr key={p.id} className="border-b border-mist/60">
                <td className="py-3">
                  <p className="font-medium text-ink">{p.recipientName}</p>
                  <p className="font-mono text-xs text-ink/40">{p.recipientAddress.slice(0, 10)}…</p>
                </td>
                <td>{fromStroops(BigInt(p.amountStroops))}</td>
                <td>{new Date(p.dueAt).toLocaleString()}</td>
                <td>
                  <StatusBadge status={p.status} />
                  {p.failureReason && <p className="mt-1 max-w-xs text-xs text-red-600">{p.failureReason}</p>}
                </td>
                <td className="font-mono text-xs text-ink/50">
                  {p.claimTxHash?.slice(0, 10) ?? p.authorizationTxHash?.slice(0, 10) ?? "—"}
                </td>
                <td>
                  {p.status === "failed" && (
                    <button
                      onClick={() => requeue(p.id)}
                      className="flex items-center gap-1 rounded-md border border-mist px-2 py-1 text-xs hover:bg-mist/40"
                    >
                      <RotateCcw size={12} /> Requeue
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {payouts && payouts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink/40">
                  No payouts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
