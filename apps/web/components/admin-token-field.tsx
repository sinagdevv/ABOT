"use client";

import { useEffect, useState } from "react";
import { getAdminToken, setAdminToken } from "../lib/api-client";

export function AdminTokenField() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(getAdminToken());
  }, []);

  return (
    <div className="rounded-lg bg-white/5 p-3">
      <label className="mb-1 block text-xs font-medium text-mist/70">Admin token</label>
      <input
        type="password"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        onBlur={() => {
          setAdminToken(value);
          setSaved(true);
        }}
        placeholder="paste ADMIN_API_TOKEN"
        className="w-full rounded-md border border-white/10 bg-ink px-2 py-1.5 text-xs text-warm placeholder:text-mist/40 focus:border-mint focus:outline-none"
      />
      {saved && <p className="mt-1 text-[11px] text-mint">Saved locally.</p>}
    </div>
  );
}
