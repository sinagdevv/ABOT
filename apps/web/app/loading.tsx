import { BrandMark } from "../components/brand";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink text-warm">
      <div className="flex flex-col items-center gap-4">
        <BrandMark tone="mint" size="lg" className="animate-pulse" />
        <p className="text-[11px] font-medium uppercase tracking-[.24em] text-mist/60">connecting the dots</p>
      </div>
    </main>
  );
}
