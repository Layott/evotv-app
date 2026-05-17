import type { NotificationItem } from "@/lib/types";
import { api } from "./_client";

/**
 * Backend wraps notifications in `{ items, unread }`. The wrapper is useful
 * for inbox bells (read count without paginating) but most consumers want
 * the bare list. Helpers below unwrap on the client.
 */
interface NotificationsEnvelope {
  items: NotificationItem[];
  unread: number;
}

/** GET /api/notifications — current user's inbox. */
export async function listNotifications(): Promise<NotificationItem[]> {
  const res = await api<NotificationsEnvelope>("/api/notifications");
  return res.items ?? [];
}

/** GET /api/notifications?unread=1 — only unread rows. */
export async function listUnreadNotifications(): Promise<NotificationItem[]> {
  const res = await api<NotificationsEnvelope>("/api/notifications", {
    query: { unread: "1" },
  });
  return res.items ?? [];
}

/** GET /api/notifications + unread count without paginating the list. Used
 *  by the bell badge on the top navbar. */
export async function getNotificationsSummary(): Promise<{
  items: NotificationItem[];
  unread: number;
}> {
  const res = await api<NotificationsEnvelope>("/api/notifications");
  return { items: res.items ?? [], unread: res.unread ?? 0 };
}

/** POST /api/notifications/[id]/read */
export function markAsRead(id: string): Promise<void> {
  return api<void>(`/api/notifications/${id}/read`, { method: "POST" });
}

/** POST /api/notifications/read-all */
export function markAllAsRead(): Promise<void> {
  return api<void>("/api/notifications/read-all", { method: "POST" });
}
