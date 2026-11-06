import { timingSafeEqual } from "node:crypto";
import { env } from "./env";

/** Constant-time bearer-token check for every state-changing admin/agent endpoint. */
export function isAuthorized(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return false;

  const expected = Buffer.from(env.adminApiToken);
  const actual = Buffer.from(token);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
