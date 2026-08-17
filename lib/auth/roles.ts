import type { Role } from "@/lib/types";

/**
 * The platform role ladder, on the app side.
 *
 * A copy of the backend's `lib/auth/role-catalog.ts` rather than an import: the
 * two repos are deliberately not coupled by a shared package. The ranks have to
 * match, and the values below are the ones the API enforces.
 *
 * This exists because `role !== "admin"` was the gate on the whole admin
 * section, and that comparison is true for a **head_admin**: the highest role
 * on the platform was redirected out of the dashboard it owns. The same bug was
 * found and fixed twice on the web the same day, in `AdminGuard` and in
 * `requireAdminFromRequest`. Comparing on a ladder is what stops it recurring.
 */
export const RANK: Record<Role, number> = {
  guest: 0,
  user: 1,
  premium: 2,
  creator: 5,
  support_admin: 10,
  moderator: 20,
  finance_admin: 30,
  admin: 40,
  head_admin: 100,
};

/** Anything unrecognised ranks as a guest, so a typo never grants access. */
export function roleRank(role: string | null | undefined): number {
  if (!role) return 0;
  return RANK[role as Role] ?? 0;
}

/**
 * The canonical comparison. A higher rank satisfies every requirement below it.
 *
 * This is a courtesy, not the security boundary: every route under
 * `/api/admin/*` checks the same ladder server-side, so a screen that renders
 * without permission is a screen full of 403s.
 */
export function hasMinRole(role: string | null | undefined, min: Role): boolean {
  return roleRank(role) >= RANK[min];
}

/**
 * The human name for a role, matching the website's `roleLabel`.
 *
 * Copied rather than imported, same reason as the ladder above: the repos are
 * not coupled. What matters is that "finance_admin" reads as "Finance" in both
 * places, because an access message that names a role the user has never seen
 * written that way is not a message, it is a puzzle.
 */
const LABELS: Record<Role, string> = {
  guest: "Guest",
  user: "User",
  premium: "Premium",
  creator: "Creator",
  support_admin: "Support",
  moderator: "Moderator",
  finance_admin: "Finance",
  admin: "Admin",
  head_admin: "Head admin",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "User";
  return LABELS[role as Role] ?? "User";
}
