"use client";

import { useEffect, useState } from "react";
import { fromStroops } from "@abot/shared";
import { Play, RefreshCw } from "lucide-react";
import { adminFetch } from "../../../lib/api-client";
import { Card, PageHeader } from "../../../components/card";
import { StatusBadge } from "../../../components/status-badge";

type PayoutRow = { id: string; status: string; amountStroops: string; recipientName: string; dueAt: string };
type Decision = { id: string; payout_id: string; action: string; reason: string; created_at: string };

export default function DashboardPage() {
  const [payouts, setPayouts] = useState<PayoutRow[] | null>(null);
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [p, d] = await Promise.all([
        adminFetch("/api/payouts"),
        adminFetch("/api/agent/activity"),
      ]);
      setPayouts(p.payouts);
      setDecisions(d.decisions.slice(0, 6));
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runSweep() {
    setRunning(true);
    setError(null);
    try {
      await adminFetch("/api/agent/run", { method: "POST", body: "{}" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "sweep failed");
    } finally {
      setRunning(false);
    }
  }

  const counts = (payouts ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});
  const totalAuthorized = (payouts ?? [])
    .filter((p) => p.status === "authorized" || p.status === "claimed")
    .reduce((sum, p) => sum + BigInt(p.amountStroops), 0n);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader
          title="Dashboard"
          description="Autonomous payout agent — Noir escrow on Stellar Testnet."
        />
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-lg border border-mist px-3 py-2 text-sm text-ink hover:bg-mist/40"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={runSweep}
            disabled={running}
            className="flex items-center gap-2 rounded-lg bg-emerald px-3 py-2 text-sm font-medium text-warm hover:bg-emerald/90 disabled:opacity-50"
          >
            <Play size={14} /> {running ? "Running sweep…" : "Run agent sweep"}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {(["pending", "needs_funding", "authorizing", "authorized", "claimed"] as const).map((status) => (
          <Card key={status}>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{status.replaceAll("_", " ")}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{counts[status] ?? 0}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-ink">Value authorized / claimed</h2>
          <p className="text-3xl font-semibold text-emerald">{fromStroops(totalAuthorized)} XLM</p>
          <p className="mt-1 text-xs text-ink/50">Sum of payouts the agent has authorized against Noir escrow.</p>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-ink">Recent agent decisions</h2>
          <ul className="space-y-2">
            {(decisions ?? []).map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-ink/70">{d.reason}</span>
                <StatusBadge status={d.action} />
              </li>
            ))}
            {decisions && decisions.length === 0 && <p className="text-sm text-ink/40">No decisions yet.</p>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
