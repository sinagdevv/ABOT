const STYLES: Record<string, string> = {
  pending: "bg-mist text-ink",
  needs_funding: "bg-amber/20 text-amber",
  authorizing: "bg-amber/20 text-amber",
  authorized: "bg-mint/20 text-emerald",
  claimed: "bg-emerald text-warm",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-mist text-ink/60",
  paid: "bg-emerald text-warm",
  expired: "bg-mist text-ink/60",
};

const DOT: Record<string, string> = {
  pending: "bg-ink/40",
  needs_funding: "bg-amber",
  authorizing: "bg-amber",
  authorized: "bg-mint",
  claimed: "bg-emerald",
  failed: "bg-red-600",
  cancelled: "bg-ink/30",
  paid: "bg-emerald",
  expired: "bg-ink/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        STYLES[status] ?? "bg-mist text-ink"
      }`}
    >
      <span className={`status-dot ${DOT[status] ?? "bg-ink/40"}`} />
      {status.replaceAll("_", " ")}
    </span>
  );
}
