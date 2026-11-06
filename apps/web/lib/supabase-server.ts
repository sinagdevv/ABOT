import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { env } from "./env";

let client: ReturnType<typeof createClient<Database>> | null = null;

/** Service-role client. Server-only: this key must never reach the browser. */
export function supabaseServer() {
  if (!client) {
    client = createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}
