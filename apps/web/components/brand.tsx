export function BrandMark({ tone = "mint", size = "md", className = "" }: { tone?: "mint" | "ink" | "warm"; size?: "sm" | "md" | "lg"; className?: string }) {
  const colors = tone === "ink" ? { line: "#087F65", node: "#0B1724", soft: "#087F65" } : tone === "warm" ? { line: "#F6F9F7", node: "#47D7AA", soft: "#F6F9F7" } : { line: "#47D7AA", node: "#F6F9F7", soft: "#47D7AA" };
  const sizes = { sm: 24, md: 32, lg: 48 };
  return (
    <svg aria-hidden="true" className={className} height={sizes[size]} viewBox="0 0 48 48" width={sizes[size]} fill="none">
      <path d="M7 34 18 12l8 15 15-15" stroke={colors.line} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
      <path d="M7 34h13" stroke={colors.soft} strokeLinecap="round" strokeWidth="1.5" opacity=".5" />
      <circle cx="7" cy="34" fill={colors.node} r="4" stroke={colors.line} strokeWidth="2" /><circle cx="18" cy="12" fill={colors.line} r="4" /><circle cx="26" cy="27" fill={colors.node} r="4" stroke={colors.line} strokeWidth="2" /><circle cx="41" cy="12" fill={colors.line} r="4" />
    </svg>
  );
}

export function Brand({ tone = "warm", compact = false }: { tone?: "mint" | "ink" | "warm"; compact?: boolean }) {
  return <span className="inline-flex items-center gap-2" aria-label="abot."><BrandMark tone={tone} size={compact ? "sm" : "md"} />{!compact && <span className="text-[1.05rem] font-semibold tracking-[-.04em]">abot<span className={tone === "ink" ? "text-emerald" : "text-mint"}>.</span></span>}</span>;
}
