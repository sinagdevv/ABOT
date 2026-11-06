import { runAgentSweep } from "@abot/agent";
import { isAuthorized, unauthorized } from "../../../../lib/auth";
import { env } from "../../../../lib/env";
import { SupabasePayoutGateway } from "../../../../lib/repo-supabase";
import { noirService, veloService } from "../../../../lib/services";

const gateway = new SupabasePayoutGateway();

function isCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** One autonomous sweep over due payouts. Call from the dashboard or a scheduler (Vercel Cron with CRON_SECRET). */
async function sweep(request: Request): Promise<Response> {
  if (!isAuthorized(request) && !isCronRequest(request)) return unauthorized();

  const results = await runAgentSweep({
    gateway,
    funding: gateway,
    noir: noirService(),
    velo: veloService(),
    fundingUrls: {
      successUrl: `${env.appUrl}/fund/success`,
      cancelUrl: `${env.appUrl}/fund/cancel`,
    },
  });

  return Response.json({ results });
}

export const POST = sweep;
// Vercel Cron Jobs only issue GET requests, so the scheduled trigger needs this too.
export const GET = sweep;
