import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Brand } from "../../components/brand";

export default function SignInPage() {
  return <main className="flex min-h-screen items-center justify-center bg-ink px-5 py-10 text-warm"><div className="w-full max-w-md"><Link href="/" className="inline-flex"><Brand /></Link><section className="mt-12 rounded-2xl border border-mist/15 bg-white/5 p-7"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/15 text-mint"><KeyRound size={18} /></div><h1 className="mt-6 text-2xl font-semibold tracking-[-.04em]">Connect ABOT operations</h1><p className="mt-3 text-sm leading-6 text-mist/65">This frontend keeps the existing bearer-token authorization boundary behind a short-lived HttpOnly session cookie. No session is faked and the token is not stored in localStorage.</p><Link href="/dashboard" className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-ink">Continue to dashboard <ArrowLeft className="rotate-180" size={15} /></Link><p className="mt-5 text-center text-xs text-mist/40">Need context? <Link href="/help" className="text-mint hover:underline">Read the guide</Link></p></section></div></main>;
}
