import { isAuthorized } from "../../../../lib/auth";

const COOKIE = "abot_admin_session";
const ALLOWED = [/^\/api\/payouts$/, /^\/api\/payouts\/[^/]+\/requeue$/, /^\/api\/agent\/(activity|run)$/, /^\/api\/fund$/];

async function forward(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (!ALLOWED.some((pattern) => pattern.test(path))) return Response.json({ error: "route not allowed" }, { status: 404 });
  const token = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  let decoded = "";
  try { decoded = token ? decodeURIComponent(token) : ""; } catch { decoded = ""; }
  if (!decoded || !isAuthorized(new Request(request.url, { headers: { authorization: `Bearer ${decoded}` } }))) return Response.json({ error: "unauthorized" }, { status: 401 });
  const headers = new Headers(request.headers);
  headers.set("authorization", `Bearer ${decoded}`);
  headers.delete("cookie");
  headers.delete("host");
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const upstream = await fetch(new URL(path, request.url), { method: request.method, headers, body, cache: "no-store" });
  return new Response(upstream.body, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" } });
}

export const GET = forward;
export const POST = forward;
