import type { Role } from "@/lib/types";

/**
 * Four rooms, not four rungs. The app side.
 *
 * A copy of the backend's `lib/auth/capabilities.ts` rather than an import: the
 * two repos are deliberately not coupled by a shared package. The table has to
 * match, and the API is what enforces it.
 *
 * The ladder in `roles.ts` decides seniority, which is who may grant what. This
 * decides who may open which room, and nothing here is inherited: a programmer
 * ranks above support and cannot read an account.
 */
export type Capability =
  | "editorial"
  | "broadcast"
  | "commerce"
  | "community"
  | "support"
  | "roster"
  | "audit_full";

const ALL_ROOMS: Capability[] = [
  "editorial",
  "broadcast",
  "commerce",
  "community",
  "support",
  "roster",
];

export const CAPABILITIES: Record<Role, Capability[]> = {
  guest: [],
  user: [],
  premium: [],
  creator: [],
  support_admin: ["support"],
  programmer: ["editorial"],
  broadcast_op: ["broadcast"],
  moderator: ["community"],
  finance_admin: ["commerce", "support"],
  admin: ALL_ROOMS,
  head_admin: [...ALL_ROOMS, "audit_full"],
};

/** What a room is called on screen. Matches the website's ROOMS labels. */
export const ROOM_LABELS: Record<Capability, string> = {
  editorial: "Editorial",
  broadcast: "Broadcast",
  commerce: "Commerce",
  community: "Community",
  support: "Support",
  roster: "Roster",
  audit_full: "Audit",
};

export function capabilitiesFor(role: string | null | undefined): Capability[] {
  if (!role) return [];
  return CAPABILITIES[role as Role] ?? [];
}

/** The one comparison. An unknown role holds nothing, so a typo grants nothing. */
export function hasCapability(
  role: string | null | undefined,
  capability: Capability,
): boolean {
  return capabilitiesFor(role).includes(capability);
}

/** Anyone who can open a room at all, and so should see the dashboard. */
export function isStaffRole(role: string | null | undefined): boolean {
  return capabilitiesFor(role).length > 0;
}
