import { api } from "./_client";

/**
 * Telling viewers something.
 *
 * One POST does all of it: the notification row every account gets, an Expo
 * push to anyone with the app, and a Web Push to anyone who allowed browser
 * notifications. The row is the channel that cannot fail silently, which is why
 * the delivered counts are always lower than the recipient count.
 *
 * The same endpoint answers a dry run. That is not politeness: there is no
 * unsend once a push is with Apple or Google, so "how many people is this
 * actually going to" has to be answerable before rather than after.
 */

export type AnnouncementAudience =
  | { kind: "everyone" }
  | { kind: "role"; role: string }
  | { kind: "user"; email: string };

export interface AnnouncementInput {
  title: string;
  body: string;
  /** An in-app path starting with a slash. Empty opens the app. */
  linkUrl?: string;
  audience: AnnouncementAudience;
}

export interface AnnouncementPreview {
  preview: true;
  recipients: number;
  description: string;
  /** How many of them have a device that could receive a push at all. */
  withPushTokens: number;
}

export interface AnnouncementResult {
  ok: true;
  recipients: number;
  notified: number;
  expoDelivered: number;
  webDelivered: number;
  description: string;
}

/** Counts who it would reach and sends nothing. */
export function previewAnnouncement(
  input: AnnouncementInput,
): Promise<AnnouncementPreview> {
  return api<AnnouncementPreview>("/api/admin/announcements", {
    method: "POST",
    body: { ...input, preview: true },
  });
}

/** Sends it. There is no unsend. */
export function sendAnnouncement(
  input: AnnouncementInput,
): Promise<AnnouncementResult> {
  return api<AnnouncementResult>("/api/admin/announcements", {
    method: "POST",
    body: { ...input, preview: false },
  });
}
