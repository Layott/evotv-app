import {
  BarChart3,
  Bell,
  CalendarRange,
  CreditCard,
  FileText,
  Film,
  Fingerprint,
  Landmark,
  LayoutDashboard,
  Megaphone,
  Radio,
  Settings,
  Shield,
  ShoppingBag,
  Store,
  Tv,
  Users,
  Vote,
  type Icon,
} from "@/components/icons";

import { hasMinRole } from "@/lib/auth/roles";
import type { Role } from "@/lib/types";

export interface AdminNavItem {
  href: string;
  label: string;
  Icon: Icon;
  /** Only `/admin` itself needs an exact match, or it lights up everywhere. */
  exact?: boolean;
  /**
   * The weakest role that may open this section. Defaults to `admin`.
   *
   * Filtering the list is a courtesy, not a control: every route under
   * `/api/admin/*` checks the same ladder. What it prevents is a moderator
   * opening Ads and being told off for it.
   */
  minRole?: Role;
}

/**
 * The admin sections, in the website's order, with the website's labels.
 *
 * A deliberate copy of `backend/components/shell/admin-nav-items.ts`, not an
 * import: the two repos are not coupled by a package. What matters is that the
 * list, the order, the labels and the role gates are the same, because the
 * owner's complaint was that the app admin "is a second CMS" - a different set
 * of sections under different names, reached a different way.
 *
 * The app used to carry 22 screens against the website's 18, overlapping only
 * partly. Eight of the app's had no website equivalent as a top-level section:
 * api-keys, audit-log, channels, clips, creator-program, sanctions, vods and
 * waitlist. None of them are deleted - they are reachable from the section they
 * belong to on the website, listed in EXTRA_SECTIONS below - but they are no
 * longer top-level, because on the website they are not.
 *
 * When you add a section here, add it in the web repo too, or the two drift
 * again and this comment becomes a lie.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/admin/shows", label: "Shows", Icon: Tv },
  { href: "/admin/schedule", label: "Schedule", Icon: CalendarRange },
  { href: "/admin/library", label: "Library", Icon: Film, minRole: "moderator" },
  { href: "/admin/streams", label: "Streams", Icon: Radio },
  { href: "/admin/content", label: "Content", Icon: FileText },
  { href: "/admin/polls", label: "Polls", Icon: Vote },
  { href: "/admin/announcements", label: "Announcements", Icon: Bell },
  { href: "/admin/ads", label: "Ads", Icon: Megaphone },
  { href: "/admin/users", label: "Users & roles", Icon: Users, minRole: "support_admin" },
  { href: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/admin/shop", label: "Shop", Icon: Store, minRole: "support_admin" },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingBag, minRole: "support_admin" },
  { href: "/admin/subscriptions", label: "Subscriptions", Icon: CreditCard, minRole: "finance_admin" },
  { href: "/admin/moderation", label: "Moderation", Icon: Shield, minRole: "moderator" },
  { href: "/admin/billing", label: "Billing & USSD", Icon: Landmark, minRole: "finance_admin" },
  { href: "/admin/forensic", label: "Forensic", Icon: Fingerprint },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

/**
 * Screens the app has that the website does not surface as their own section.
 *
 * Keyed by the section that owns them, so each one appears as a link inside
 * that section's screen rather than as an eighteenth-plus entry in the list.
 * Nothing here is dead: every one of these still works and still has a route.
 */
export const EXTRA_SECTIONS: Record<string, Array<{ href: string; label: string }>> = {
  "/admin/library": [
    { href: "/admin/vods", label: "VODs" },
    { href: "/admin/clips", label: "Clips" },
  ],
  "/admin/streams": [{ href: "/admin/channels", label: "Channels" }],
  "/admin/moderation": [{ href: "/admin/sanctions", label: "Sanctions" }],
  "/admin/users": [{ href: "/admin/creator-program", label: "Creator applications" }],
  "/admin/settings": [
    { href: "/admin/api-keys", label: "API keys" },
    { href: "/admin/audit-log", label: "Audit log" },
    { href: "/admin/waitlist", label: "Waitlist" },
  ],
};

/** The sections a role may open, in nav order. */
export function adminNavFor(role: string | null | undefined): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => hasMinRole(role, item.minRole ?? "admin"));
}

/** Shared so a screen and the section list cannot disagree about what is active. */
export function isAdminNavItemActive(item: AdminNavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

/**
 * The role a given admin route needs.
 *
 * The website gates page by page: `AdminGuard` takes a `minRole`, so a
 * moderator opens /admin/moderation and a finance admin opens /admin/billing,
 * while neither can open /admin/ads. The app gated the whole group at `admin`
 * in one layout, which locked every support, moderator and finance role out of
 * the entire section - three of the five admin ranks could not open a single
 * screen. Same bug family as the head_admin one, opposite end of the ladder.
 *
 * Deriving it from the nav list rather than repeating it on 22 screens means a
 * new screen cannot be added without a gate, and the gate cannot disagree with
 * whether the section is listed.
 */
export function requiredRoleForPath(pathname: string | null): Role {
  if (!pathname) return "admin";

  // Nested screens inherit the gate of the section that owns them: sanctions is
  // moderation's, VODs and clips are the library's.
  for (const [parent, subs] of Object.entries(EXTRA_SECTIONS)) {
    if (subs.some((s) => pathname === s.href || pathname.startsWith(s.href + "/"))) {
      const owner = ADMIN_NAV_ITEMS.find((i) => i.href === parent);
      return owner?.minRole ?? "admin";
    }
  }

  const match = [...ADMIN_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isAdminNavItemActive(item, pathname));
  return match?.minRole ?? "admin";
}

/**
 * The weakest role that can open anything at all in here.
 *
 * Used by the group layout as the outer gate, so the per-route check below it
 * is the one that actually decides.
 */
export const WEAKEST_ADMIN_ROLE: Role = "support_admin";

/** The label for the current route, used as the screen title. */
export function adminNavTitle(pathname: string | null): string {
  // Longest href first, so /admin/users/roles prefers "Users & roles" over the
  // exact-match Overview entry.
  const match = [...ADMIN_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isAdminNavItemActive(item, pathname));
  return match?.label ?? "Admin";
}
