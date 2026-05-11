import type { NotificationItem } from "@/lib/types";
import { api } from "./_client";

/** GET /api/notifications — current user's inbox */
export function listNotifications(): Promise<NotificationItem[]> {
  return api<NotificationItem[]>("/api/notifications");
}

/** GET /api/notifications?unread=1 */
export function listUnreadNotifications(): Promise<NotificationItem[]> {
  return api<NotificationItem[]>("/api/notifications", { query: { unread: "1" } });
}

/** POST /api/notifications/[id]/read */
export function markAsRead(id: string): Promise<void> {
  return api<void>(`/api/notifications/${id}/read`, { method: "POST" });
}

/** POST /api/notifications/read-all */
export function markAllAsRead(): Promise<void> {
  return api<void>("/api/notifications/read-all", { method: "POST" });
}
