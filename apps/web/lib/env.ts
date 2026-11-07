function required(...names: string[]): string {
  const name = names.find((candidate) => process.env[candidate]?.trim());
  const value = name ? process.env[name]?.trim() : undefined;
  if (!name || !value) throw new Error(`Missing required env var: ${names.join(" or ")}`);
  if (/replace_with|xxxx\.supabase\.co|tk_test_replace_me/i.test(value)) {
    throw new Error(`Placeholder value is not allowed for env var: ${name}`);
  }
  return value;
}

/** Lazily read so a missing var only breaks the route that needs it, not the whole build. */
export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
  },
  get adminApiToken() {
    return required("ADMIN_API_TOKEN");
  },
  get agentSecret() {
    return required("AGENT_SECRET");
  },
  get agentPublicKey() {
    return required("AGENT_PUBLIC_KEY");
  },
  /** The Noir device whose escrow funds payouts when a request doesn't name one explicitly. */
  get orgDeviceHash() {
    return process.env.ORG_DEVICE_HASH ?? "";
  },
  get noirRpcUrl() {
    return process.env.NOIR_RPC_URL;
  },
  get veloApiKey() {
    return required("VELO_API_KEY");
  },
  get veloBaseUrl() {
    return process.env.VELO_BASE_URL;
  },
  get veloEnvironment() {
    return process.env.VELO_ENVIRONMENT ?? "testnet";
  },
  get veloWebhookSecret() {
    return required("VELO_WEBHOOK_SECRET");
  },
  get veloFundingAsset() {
    return process.env.VELO_FUNDING_ASSET ?? "USDC";
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
};
