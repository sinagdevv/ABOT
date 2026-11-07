"use client";

import { useEffect, useState } from "react";
import { isDemoMode, setAdminToken } from "../lib/api-client";

export function AdminTokenField() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setValue(""), []);

  async function connect() {
    setError(null); setBusy(true);
    try {
      await setAdminToken(value);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error && err.message === "invalid admin token"
        ? "The operator token was rejected. Verify the current Production token and try again."
        : err instanceof Error ? err.message : "Unable to connect to the live API. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void connect(); }} className="space-y-3">
      <label className="block text-sm font-medium text-warm"><span className="mb-1 block">Operator access token</span><span className="block text-xs font-normal leading-5 text-mist/55">Used once to establish a short-lived HttpOnly session. It is never written to localStorage or sent to the client bundle.</span></label>
      <input
        aria-label="Operator access token"
        type="password"
        autoComplete="new-password"
        required
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        placeholder="Paste token for this session"
        className="w-full rounded-xl border border-white/10 bg-ink px-3 py-3 text-sm text-warm placeholder:text-mist/40 focus:border-mint focus:outline-none"
      />
      <button type="submit" disabled={!value || !isDemoMode() || busy} className="flex w-full items-center justify-center rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-ink transition hover:bg-warm disabled:opacity-40">{busy ? "Checking token…" : "Enter Live Testnet"}</button>
      {error && <p className="rounded-xl border border-red-300/30 bg-red-400/10 px-3 py-2 text-xs text-red-100" role="alert">{error}</p>}
    </form>
  );
}
