import { isAuthorized } from "../../../../lib/auth";

const COOKIE = "abot_admin_session";

function valid(request: Request, token: string) {
  return isAuthorized(new Request(request.url, { headers: { authorization: `Bearer ${token}` } }));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = body && typeof body === "object" ? (body as Record<string, unknown>).token : null;
  if (typeof token !== "string" || !token || !valid(request, token)) return Response.json({ error: "invalid admin token" }, { status: 401 });
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return Response.json({ ok: true }, { headers: { "Set-Cookie": `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600${secure}` } });
}

export async function DELETE(request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return Response.json({ ok: true }, { headers: { "Set-Cookie": `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}` } });
}
