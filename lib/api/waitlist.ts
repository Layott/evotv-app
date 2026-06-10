/**
 * Pre-launch waitlist (admin).
 *
 * Backend real:
 *   - GET /api/admin/waitlist - admin-guarded, bearer auth via shared `api` client.
 *
 * Entries are newest first. `verified` = email confirmed; `verifiedAt` is null
 * while a signup is still pending confirmation.
 */

import { api } from "./_client";

export interface WaitlistEntry {
  id: string;
  email: string;
  username: string;
  verified: boolean;
  /** ISO date the email was confirmed; null while pending. */
  verifiedAt: string | null;
  source: string;
  createdAt: string;
}

export interface ListWaitlistResult {
  count: number;
  entries: WaitlistEntry[];
}

/** GET /api/admin/waitlist - admin+. Entries newest first. */
export async function listAdminWaitlist(): Promise<ListWaitlistResult> {
  return api<ListWaitlistResult>("/api/admin/waitlist");
}
