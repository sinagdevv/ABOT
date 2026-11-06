"use client";

import { useEffect, useState } from "react";
import { isDemoMode, setAdminToken } from "../lib/api-client";

export function AdminTokenField() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => setValue(""), []);

  async function connect() {
    setSaved(false);
    try {
      await setAdminToken(value);
      setValue("");
      setSaved(true);
      window.location.reload();
    } catch (err) {
      setSaved(false);
      window.alert(err instanceof Error ? err.message : "Unable to connect live API");
    }
  }

  return (
    <div className="rounded-lg bg-white/5 p-3">
      <label className="mb-1 block text-xs font-medium text-mist/70">Connect live API</label>
      <input
        type="password"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder="paste token for this session"
        className="w-full rounded-md border border-white/10 bg-ink px-2 py-1.5 text-xs text-warm placeholder:text-mist/40 focus:border-mint focus:outline-none"
      />
      <button type="button" onClick={connect} disabled={!value || !isDemoMode()} className="mt-2 rounded-md bg-mint px-2 py-1.5 text-[11px] font-semibold text-ink disabled:opacity-40">{saved ? "Connected" : "Connect"}</button>
      {saved && <p className="mt-1 text-[11px] text-mint">HttpOnly session active for this tab.</p>}
    </div>
  );
}
