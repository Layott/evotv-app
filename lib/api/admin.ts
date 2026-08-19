/**
 * Admin-side API.
 *
 * Phase 2C + 2C.5 scope (backend real):
 *   - Overview metrics: /api/admin/analytics/overview
 *   - Audit log: /api/admin/audit-log
 *   - Orders list: /api/admin/orders
 *   - Polls list: /api/admin/polls
 *   - Users list + role PATCH: /api/admin/users
 *
 * Still mock (no backend table yet, tracked in Phase 5+):
 *   - Forensic marks (piracy/leak tracking)
 *   - Chat moderation log (banned users, chat reports)
 */

import { api } from "./_client";
import type {
  Order,
  OrderStatus,
  Poll,
  Role,
  Subscription,
  SubscriptionStatus,
  SubscriptionTier,
} from "@/lib/types";

export interface EmailTemplate {
  key: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  version: number;
  updatedBy: string | null;
  updatedAt: string;
}

/**
 * Backend admin/email-templates routes. Versioned + audit-logged.
 *
 * - GET /api/admin/email-templates → list all
 * - GET /api/admin/email-templates/[key] → read one (404 when missing)
 * - PATCH /api/admin/email-templates/[key] → upsert with version bump
 */
export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  const res = await api<{ templates: EmailTemplate[] }>(
    "/api/admin/email-templates",
  );
  return res.templates;
}

export async function getEmailTemplate(
  key: string,
): Promise<EmailTemplate | null> {
  try {
    return await api<EmailTemplate>(
      `/api/admin/email-templates/${encodeURIComponent(key)}`,
    );
  } catch {
    return null;
  }
}

export async function saveEmailTemplate(
  key: string,
  /** Subject line (was `label` in the mock). Keep arg name for compat. */
  label: string,
  body: string,
): Promise<{ savedAt: string; version: number }> {
  // The mock used `body` as a single field; backend separates html + text.
  // Send the same content to both so existing call sites don't need to change.
  const res = await api<{ ok: true; key: string; version: number }>(
    `/api/admin/email-templates/${encodeURIComponent(key)}`,
    {
      method: "PATCH",
      body: { subject: label, htmlBody: body, textBody: body },
    },
  );
  return { savedAt: new Date().toISOString(), version: res.version };
}

export interface OverviewMetrics {
  liveStreams: number;
  /** Daily new sign-ups (matches backend field `todaySignups`). */
  todaySignups: number;
  activePremiumSubs: number;
  /** Monthly recurring revenue in NGN. */
  mrrNgn: number;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  return api<OverviewMetrics>("/api/admin/analytics/overview");
}

export interface ViewsPoint {
  date: string;
  views: number;
}

export async function getViewsOverTime(days = 30): Promise<ViewsPoint[]> {
  return api<ViewsPoint[]>(`/api/admin/analytics/views?days=${days}`);
}

/**
 * The same series for a chosen window rather than a preset.
 *
 * `from` on its own is a single day, which is the question the preset chips
 * cannot ask: how the premiere did on the night it went out.
 */
export async function getViewsInWindow(window: {
  from?: string;
  to?: string;
}): Promise<ViewsPoint[]> {
  if (!window.from) return getViewsOverTime(30);
  const to = window.to ?? window.from;
  return api<ViewsPoint[]>(
    `/api/admin/analytics/views?from=${encodeURIComponent(window.from)}&to=${encodeURIComponent(to)}`,
  );
}

export interface RetentionData {
  cohorts: { weekStart: string; size: number }[];
  matrix: (number | null)[][];
}
export async function getRetention(weeks = 8): Promise<RetentionData> {
  return api<RetentionData>(`/api/admin/analytics/retention?weeks=${weeks}`);
}

export interface RevenuePoint {
  month: string;
  ngn: number;
}
export async function getRevenueByMonth(months = 6): Promise<RevenuePoint[]> {
  return api<RevenuePoint[]>(`/api/admin/analytics/revenue?months=${months}`);
}

export interface TopVodRow {
  id: string;
  title: string;
  viewCount: number;
}
export async function getTopVods(limit = 10): Promise<TopVodRow[]> {
  return api<TopVodRow[]>(`/api/admin/analytics/top-vods?limit=${limit}`);
}

export interface ConversionData {
  totalUsers: number;
  convertedUsers: number;
  pct: number;
}
export async function getFreeToPremiumConversion(): Promise<ConversionData> {
  return api<ConversionData>(`/api/admin/analytics/conversion`);
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilters {
  actorId?: string;
  /** Action prefix (e.g. "stream." matches "stream.delete", "stream.force_end"). */
  action?: string;
  targetType?: string;
  targetId?: string;
  /** ISO date inclusive lower bound. */
  fromDate?: string;
  /** ISO date inclusive upper bound. */
  toDate?: string;
  limit?: number;
  offset?: number;
}

export async function listAuditLog(
  filters: AuditLogFilters = {},
): Promise<AuditLogEntry[]> {
  const q = new URLSearchParams();
  if (filters.actorId) q.set("actorId", filters.actorId);
  if (filters.action) q.set("action", filters.action);
  if (filters.targetType) q.set("targetType", filters.targetType);
  if (filters.targetId) q.set("targetId", filters.targetId);
  if (filters.fromDate) q.set("fromDate", filters.fromDate);
  if (filters.toDate) q.set("toDate", filters.toDate);
  q.set("limit", String(filters.limit ?? 200));
  if (filters.offset) q.set("offset", String(filters.offset));
  return api<AuditLogEntry[]>(`/api/admin/audit-log?${q.toString()}`);
}

/**
 * Build the URL for the CSV export endpoint. Caller can pass this to
 * expo-sharing or window.open. Bearer token is NOT in the URL - the caller
 * must fetch with Authorization header + write the response to disk.
 */
export function auditLogExportUrl(filters: AuditLogFilters = {}): string {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3060";
  const q = new URLSearchParams();
  if (filters.actorId) q.set("actorId", filters.actorId);
  if (filters.action) q.set("action", filters.action);
  if (filters.targetType) q.set("targetType", filters.targetType);
  if (filters.targetId) q.set("targetId", filters.targetId);
  if (filters.fromDate) q.set("fromDate", filters.fromDate);
  if (filters.toDate) q.set("toDate", filters.toDate);
  if (filters.limit) q.set("limit", String(filters.limit));
  const qs = q.toString();
  return `${base}/api/admin/audit-log/export${qs ? `?${qs}` : ""}`;
}

export interface PaginatedListResult<T> {
  total: number;
  limit: number;
  offset: number;
}

export interface ListOrdersOptions {
  status?: OrderStatus;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface ListOrdersResult extends PaginatedListResult<Order> {
  orders: Order[];
}

export async function listAdminOrders(
  opts: ListOrdersOptions = {},
): Promise<ListOrdersResult> {
  const q = new URLSearchParams();
  if (opts.status) q.set("status", opts.status);
  if (opts.from) q.set("from", opts.from);
  if (opts.to) q.set("to", opts.to);
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  const qs = q.toString();
  return api<ListOrdersResult>(`/api/admin/orders${qs ? `?${qs}` : ""}`);
}

// -------------------------------------------------------------------
// Subscriptions (admin billing)
// -------------------------------------------------------------------

export interface AdminSubscriptionRow {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  provider: "paystack" | "stripe" | "mock";
  providerSubId: string;
  currentPeriodEnd: string;
  priceNgn: number;
  createdAt: string;
  userEmail: string;
  userName: string;
  userHandle: string | null;
}

export interface ListSubscriptionsResult
  extends PaginatedListResult<AdminSubscriptionRow> {
  subscriptions: AdminSubscriptionRow[];
}

/** GET /api/admin/subscriptions - admin+. */
export async function listAdminSubscriptions(
  opts: { status?: SubscriptionStatus; limit?: number; offset?: number } = {},
): Promise<ListSubscriptionsResult> {
  const q = new URLSearchParams();
  if (opts.status) q.set("status", opts.status);
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  const qs = q.toString();
  return api<ListSubscriptionsResult>(
    `/api/admin/subscriptions${qs ? `?${qs}` : ""}`,
  );
}

/** PATCH /api/admin/subscriptions/[id] {action:"cancel"} - admin+. */
export async function adminCancelSubscription(
  id: string,
): Promise<{ ok: true; subscription: Subscription }> {
  return api(`/api/admin/subscriptions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { action: "cancel" },
  });
}

/** PATCH /api/admin/subscriptions/[id] {action:"extend",days} - admin+. */
export async function adminExtendSubscription(
  id: string,
  days = 30,
): Promise<{ ok: true; subscription: Subscription }> {
  return api(`/api/admin/subscriptions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { action: "extend", days },
  });
}

export interface ListPollsOptions {
  streamId?: string;
  isClosed?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListPollsResult extends PaginatedListResult<Poll> {
  polls: Poll[];
}

export async function listAdminPolls(
  opts: ListPollsOptions = {},
): Promise<ListPollsResult> {
  const q = new URLSearchParams();
  if (opts.streamId) q.set("streamId", opts.streamId);
  if (typeof opts.isClosed === "boolean")
    q.set("isClosed", String(opts.isClosed));
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  const qs = q.toString();
  return api<ListPollsResult>(`/api/admin/polls${qs ? `?${qs}` : ""}`);
}

export type AdminAssignableRole = Exclude<Role, "guest">;

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  handle: string | null;
  role: AdminAssignableRole;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export interface ListUsersOptions {
  role?: AdminAssignableRole;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListUsersResult extends PaginatedListResult<AdminUserRow> {
  users: AdminUserRow[];
}

export async function listAdminUsers(
  opts: ListUsersOptions = {},
): Promise<ListUsersResult> {
  const q = new URLSearchParams();
  if (opts.role) q.set("role", opts.role);
  if (opts.search) q.set("search", opts.search);
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  const qs = q.toString();
  return api<ListUsersResult>(`/api/admin/users${qs ? `?${qs}` : ""}`);
}

export async function patchUserRole(
  userId: string,
  role: AdminAssignableRole,
): Promise<{ ok: true; id: string; role: AdminAssignableRole }> {
  return api(`/api/admin/users`, {
    method: "PATCH",
    body: { userId, role },
  });
}

export type SanctionKind = "suspended" | "banned" | "chat_banned";

export interface UserSanction {
  id: string;
  userId: string;
  kind: SanctionKind;
  reason: string;
  issuedBy: string;
  expiresAt: string | null;
  revertedAt: string | null;
  revertedBy: string | null;
  createdAt: string;
}

export async function listUserSanctions(
  userId: string,
): Promise<{ sanctions: UserSanction[] }> {
  return api(`/api/admin/users/${encodeURIComponent(userId)}/sanction`);
}

export interface IssueSanctionInput {
  kind: SanctionKind;
  reason: string;
  /** Seconds until expiry. Omit for permanent. */
  expiresInSec?: number;
}

export async function sanctionUser(
  userId: string,
  input: IssueSanctionInput,
): Promise<{
  ok: true;
  sanctionId: string;
  kind: SanctionKind;
  expiresAt: string | null;
  sessionsRevoked: number;
}> {
  return api(`/api/admin/users/${encodeURIComponent(userId)}/sanction`, {
    method: "POST",
    body: input,
  });
}

export async function revertSanction(
  userId: string,
  sanctionId: string,
): Promise<{ ok: true; sanctionId: string; revertedAt: string }> {
  return api(
    `/api/admin/users/${encodeURIComponent(userId)}/sanction/${encodeURIComponent(sanctionId)}`,
    { method: "DELETE" },
  );
}

export interface SanctionListRow extends UserSanction {
  userHandle: string | null;
  userEmail: string;
  userName: string;
  userImage: string | null;
}

export interface ListSanctionsOptions {
  kind?: SanctionKind;
  status?: "active" | "all";
  limit?: number;
  offset?: number;
}

export interface ListSanctionsResult {
  sanctions: SanctionListRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface LoginEventRow {
  id: string;
  userId: string;
  ipHash: string | null;
  region: string | null;
  userAgent: string | null;
  deviceFp: string | null;
  method: string;
  createdAt: string;
  userHandle: string | null;
  userEmail: string;
  userName: string;
}

export async function listAdminLoginEvents(opts: {
  ipHash?: string;
  deviceFp?: string;
  limit?: number;
} = {}): Promise<{ events: LoginEventRow[] }> {
  return api(`/api/admin/login-events`, {
    query: { ipHash: opts.ipHash, deviceFp: opts.deviceFp, limit: opts.limit ?? 50 },
  });
}

export async function listAllSanctions(
  opts: ListSanctionsOptions = {},
): Promise<ListSanctionsResult> {
  return api(`/api/admin/sanctions`, {
    query: {
      kind: opts.kind,
      status: opts.status,
      limit: opts.limit,
      offset: opts.offset,
    },
  });
}

// -------------------------------------------------------------------
// Creator program review
// -------------------------------------------------------------------
export type CreatorAppStatus =
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected";

export interface AdminCreatorApplication {
  id: string;
  userId: string;
  bio: string;
  country: string;
  primaryGameId: string;
  socialPlatform: "youtube" | "twitch" | "tiktok" | "kick" | "other";
  socialHandle: string;
  followerCount: number;
  agreementAccepted: boolean;
  status: CreatorAppStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewerNote: string | null;
}

/** GET /api/admin/creator-program?status= - moderator+. */
export function listCreatorApplications(
  status?: CreatorAppStatus,
): Promise<AdminCreatorApplication[]> {
  return api<AdminCreatorApplication[]>("/api/admin/creator-program", {
    query: status ? { status } : undefined,
  });
}

/** PATCH /api/admin/creator-program/[id] - moderator+. */
export function reviewCreatorApplication(
  id: string,
  status: "in_review" | "approved" | "rejected",
  note?: string,
): Promise<AdminCreatorApplication> {
  return api<AdminCreatorApplication>(
    `/api/admin/creator-program/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: note ? { status, note } : { status },
    },
  );
}
