export function Card({ children, className = "", ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-mist/80 bg-white p-5 shadow-card ${className}`} {...props}>{children}</div>;
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.2em] text-emerald">Operations / ABOT</p>
      <h1 className="text-[clamp(1.75rem,3vw,2.35rem)] font-semibold tracking-[-.045em] text-ink">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{description}</p>}
    </div>
  );
}
