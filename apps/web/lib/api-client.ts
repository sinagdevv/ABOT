"use client";

const SESSION_KEY = "abot_admin_session";

let demoPayouts = [
  { id: "payout-demo-01", status: "authorized", amountStroops: "125000000", asset: "XLM", recipientName: "Maya Santos", recipientAddress: "GDEMO7MAYA7SANTOS7RECIPIENT7ADDRESS7TESTNET", dueAt: "2026-11-07T04:30:00.000Z", failureReason: null, authorizationTxHash: "demo-auth-8af1", claimTxHash: null },
  { id: "payout-demo-02", status: "needs_funding", amountStroops: "240000000", asset: "XLM", recipientName: "Jon Bell", recipientAddress: "GDEMO7JON7BELL7RECIPIENT7ADDRESS7TESTNET", dueAt: "2026-11-07T06:00:00.000Z", failureReason: null, authorizationTxHash: null, claimTxHash: null },
  { id: "payout-demo-03", status: "claimed", amountStroops: "80000000", asset: "XLM", recipientName: "Ari Flores", recipientAddress: "GDEMO7ARI7FLORES7RECIPIENT7ADDRESS7TESTNET", dueAt: "2026-11-06T08:15:00.000Z", failureReason: null, authorizationTxHash: "demo-auth-2c11", claimTxHash: "demo-claim-1bd4" },
  { id: "payout-demo-04", status: "manual_review", amountStroops: "50000000", asset: "XLM", recipientName: "Nia Cruz", recipientAddress: "GDEMO7NIA7CRUZ7RECIPIENT7ADDRESS7TESTNET", dueAt: "2026-11-07T02:20:00.000Z", failureReason: "Authorization outcome needs human verification.", authorizationTxHash: null, claimTxHash: null },
];
let demoFunding: Array<{ id: string; payout_id: string | null; payment_intent_id: string; checkout_url: string | null; amount: string; asset: string; status: string; created_at: string }> = [{ id: "fund-demo-01", payout_id: "payout-demo-02", payment_intent_id: "demo_pi_01", checkout_url: null, amount: "240.00", asset: "XLM", status: "pending", created_at: "2026-11-07T03:42:00.000Z" }];
const demoDecisions = [
  { id: "decision-01", payout_id: "payout-demo-04", action: "manual_review", reason: "Authorization submission needs external confirmation.", detail: { policy: "not retried blindly" }, created_at: "2026-11-07T04:00:00.000Z" },
  { id: "decision-02", payout_id: "payout-demo-02", action: "needs_funding", reason: "Escrow balance is below the approved amount.", detail: { source: "Noir checkPayment" }, created_at: "2026-11-07T03:42:00.000Z" },
  { id: "decision-03", payout_id: "payout-demo-01", action: "authorized", reason: "Policy passed and nonce was reserved.", detail: { network: "Stellar Testnet" }, created_at: "2026-11-07T03:10:00.000Z" },
];

export async function setAdminToken(token: string) {
  const res = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }), credentials: "same-origin" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "invalid admin token");
  window.sessionStorage.setItem(SESSION_KEY, "1");
}

export async function clearAdminSession() {
  await fetch("/api/admin/session", { method: "DELETE", credentials: "same-origin" });
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function isDemoMode() {
  if (typeof window === "undefined") return true;
  return !window.sessionStorage.getItem(SESSION_KEY) && process.env.NEXT_PUBLIC_ABOT_DEMO_MODE !== "false";
}

async function demoFetch(path: string, init: RequestInit = {}) {
  const method = init.method ?? "GET";
  const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
  if (path === "/api/payouts" && method === "GET") return { payouts: demoPayouts };
  if (path === "/api/payouts" && method === "POST") {
    const payout = { id: `payout-demo-${demoPayouts.length + 1}`, status: "pending", amountStroops: String(Math.round(Number(body.amount || 0) * 10000000)), asset: body.asset || "XLM", recipientName: body.recipientName, recipientAddress: body.recipientAddress, dueAt: body.dueAt, failureReason: null, authorizationTxHash: null, claimTxHash: null };
    demoPayouts = [payout, ...demoPayouts];
    return { payout };
  }
  if (path === "/api/agent/activity") return { decisions: demoDecisions };
  if (path === "/api/agent/run") return { results: demoPayouts.filter((p) => p.status === "pending").map((p) => ({ payoutId: p.id, action: "held" })) };
  if (path === "/api/fund" && method === "GET") return { fundingRequests: demoFunding };
  if (path === "/api/fund" && method === "POST") {
    const request = { id: `fund-demo-${demoFunding.length + 1}`, payout_id: null, payment_intent_id: `demo_pi_${demoFunding.length + 1}`, checkout_url: null, amount: String(body.amount || "0"), asset: "XLM", status: "pending", created_at: new Date().toISOString() };
    demoFunding = [request, ...demoFunding];
    return { checkoutUrl: null, paymentIntentId: request.payment_intent_id };
  }
  if (path.includes("/requeue")) { demoPayouts = demoPayouts.map((p) => p.id === path.split("/")[3] ? { ...p, status: "pending", failureReason: null } : p); return { ok: true }; }
  if (path.includes("/claim/prepare")) return { unsignedTxXdr: "DEMO_UNSIGNED_XDR — connect a Testnet wallet in live mode" };
  if (path.endsWith("/claim")) return { ok: true, txHash: "demo-only-no-chain-proof" };
  return {};
}

export async function appFetch(path: string, init: RequestInit = {}) {
  if (isDemoMode()) return demoFetch(path, init);
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `request failed (${res.status})`);
  return data;
}

export async function adminFetch(path: string, init: RequestInit = {}) {
  if (isDemoMode()) return demoFetch(path, init);
  const res = await fetch(`/api/admin/proxy?path=${encodeURIComponent(path)}`, {
    ...init,
    credentials: "same-origin",
    headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `request failed (${res.status})`);
  return data;
}
