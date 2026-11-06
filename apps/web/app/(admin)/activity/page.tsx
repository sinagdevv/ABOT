"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "../../../lib/api-client";
import { Card, PageHeader } from "../../../components/card";
import { StatusBadge } from "../../../components/status-badge";

type Decision = {
  id: string;
  payout_id: string;
  action: string;
  reason: string;
  detail: Record<string, unknown> | null;
  created_at: string;
};

export default function ActivityPage() {
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/api/agent/activity")
      .then((d) => setDecisions(d.decisions))
      .catch((err) => setError(err instanceof Error ? err.message : "failed to load"));
  }, []);

  return (
    <div>
      <PageHeader
        title="Agent activity"
        description="Every autonomous decision, with the reason the contract or the engine gave — the full audit trail."
      />
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="space-y-3">
        {(decisions ?? []).map((d) => (
          <Card key={d.id} className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <StatusBadge status={d.action} />
                <span className="text-xs text-ink/40">{new Date(d.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-ink">{d.reason}</p>
              <p className="mt-1 font-mono text-xs text-ink/40">payout {d.payout_id}</p>
              {d.detail && (
                <pre className="mt-2 overflow-x-auto rounded-md bg-ink/5 p-2 text-xs text-ink/60">
                  {JSON.stringify(d.detail, null, 2)}
                </pre>
              )}
            </div>
          </Card>
        ))}
        {decisions && decisions.length === 0 && <p className="text-sm text-ink/40">No agent activity yet.</p>}
      </div>
    </div>
  );
}
