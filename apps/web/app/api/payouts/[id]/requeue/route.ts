import { isAuthorized, unauthorized } from "../../../../../lib/auth";
import { SupabasePayoutGateway } from "../../../../../lib/repo-supabase";

const gateway = new SupabasePayoutGateway();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) return unauthorized();
  const { id } = await params;
  await gateway.requeue(id);
  return Response.json({ ok: true });
}
