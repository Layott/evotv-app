import { api } from "./_client";

/** GET /api/push/vapid-public-key — for browser PushManager.subscribe. */
export function getVapidPublicKey(): Promise<{ publicKey: string }> {
  return api<{ publicKey: string }>("/api/push/vapid-public-key");
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** POST /api/push/subscribe — auth required. */
export function subscribePush(
  payload: PushSubscriptionPayload,
): Promise<{ id: string; ok: true }> {
  return api("/api/push/subscribe", { method: "POST", body: payload });
}

/** DELETE /api/push/subscribe — auth required. */
export function unsubscribePush(endpoint: string): Promise<{ ok: true }> {
  return api("/api/push/subscribe", {
    method: "DELETE",
    body: { endpoint },
  });
}
