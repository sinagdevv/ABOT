import { NoirService, VeloService } from "@abot/agent";
import { env } from "./env";

let noir: NoirService | null = null;
let velo: VeloService | null = null;

export function noirService(): NoirService {
  if (!noir) noir = new NoirService({ agentSecret: env.agentSecret, expectedAgentPublicKey: env.agentPublicKey, rpcUrl: env.noirRpcUrl });
  return noir;
}

export function veloService(): VeloService {
  if (!velo) {
    velo = new VeloService({
      apiKey: env.veloApiKey,
      baseUrl: env.veloBaseUrl,
      environment: env.veloEnvironment,
      fundingAsset: env.veloFundingAsset,
    });
  }
  return velo;
}
