"use client";

import { useEffect, useState } from "react";
import { isDemoMode, setAdminToken } from "../lib/api-client";

export function AdminTokenField() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setValue(""), []);

  async function connect() {
    setSaved(false); setError(null);
    try {
      await setAdminToken(value);
      setValue("");
      setSaved(true);
      window.location.reload();
    } catch (err) {
      setSaved(false);
      setError(err instanceof Error ? err.message : "Unable to connect live API");
    }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void connect(); }} className="space-y-3">
      <label className="block text-sm font-medium text-warm"><span className="mb-1 block">Operator access token</span><span className="block text-xs font-normal leading-5 text-mist/55">Used once to establish a short-lived HttpOnly session. It is never written to localStorage or sent to the client bundle.</span></label>
      <input
        aria-label="Operator access token"
        type="password"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder="Paste token for this session"
        className="w-full rounded-xl border border-white/10 bg-ink px-3 py-3 text-sm text-warm placeholder:text-mist/40 focus:border-mint focus:outline-none"
      />
      <button type="submit" disabled={!value || !isDemoMode()} className="flex w-full items-center justify-center rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-ink transition hover:bg-warm disabled:opacity-40">{saved ? "Session established" : "Enter Live Testnet"}</button>
      {saved && <p className="text-xs text-mint">Authenticated session active for this browser tab.</p>}
      {error && <p className="rounded-xl border border-red-300/30 bg-red-400/10 px-3 py-2 text-xs text-red-100" role="alert">{error}</p>}
    </form>
  );
}
