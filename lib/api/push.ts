import { api } from "./_client";

/** GET /api/push/vapid-public-key — for browser PushManager.subscribe. */
export function getVapidPublicKey(): Promise<{ publicKey: string }> {
  return api<{ publicKey: string }>("/api/push/vapid-public-key");
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** POST /api/push/subscribe — auth required. Web Push (browser PushManager). */
export function subscribePush(
  payload: PushSubscriptionPayload,
): Promise<{ id: string; ok: true }> {
  return api("/api/push/subscribe", { method: "POST", body: payload });
}

/** DELETE /api/push/subscribe — auth required. Web Push. */
export function unsubscribePush(endpoint: string): Promise<{ ok: true }> {
  return api("/api/push/subscribe", {
    method: "DELETE",
    body: { endpoint },
  });
}

export type ExpoPlatform = "ios" | "android" | "web";

/** POST /api/push/expo-token — auth required. Native (iOS/Android) push.
 *  Idempotent upsert (token PK on backend). */
export function registerExpoPushToken(
  token: string,
  platform: ExpoPlatform,
): Promise<{ ok: true }> {
  return api("/api/push/expo-token", {
    method: "POST",
    body: { token, platform },
  });
}

/** DELETE /api/push/expo-token — auth required. Fire on sign-out. */
export function unregisterExpoPushToken(
  token: string,
): Promise<{ ok: true }> {
  return api("/api/push/expo-token", {
    method: "DELETE",
    body: { token },
  });
}
