import { BrandMark } from "../components/brand";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink text-warm">
      <div className="flex flex-col items-center gap-5">
        <div className="relative"><span className="absolute inset-0 rounded-full bg-mint/20 blur-2xl" /><BrandMark tone="mint" size="lg" className="relative cinematic-mark" /></div>
        <div className="text-center"><p className="text-sm font-semibold tracking-[-.02em]">abot<span className="text-mint">.</span></p><p className="mt-1 text-[10px] font-medium uppercase tracking-[.24em] text-mist/45">preparing the journey</p></div>
      </div>
    </main>
  );
}
