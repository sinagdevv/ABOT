import { isAuthorized, unauthorized } from "../../../../lib/auth";
import { SupabasePayoutGateway } from "../../../../lib/repo-supabase";

const gateway = new SupabasePayoutGateway();

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  const decisions = await gateway.listDecisions();
  return Response.json({ decisions });
}
