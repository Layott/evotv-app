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
 *   - Email templates
 *   - Forensic marks (piracy/leak tracking)
 *   - Chat moderation log (banned users, chat reports)
 */

import { api } from "./_client";
import type { Order, OrderStatus, Poll, Role } from "@/lib/types";
import {
  saveEmailTemplate as mockSaveEmailTemplate,
  getEmailTemplate as mockGetEmailTemplate,
  listEmailTemplates as mockListEmailTemplates,
} from "@/lib/mock/admin";

export const saveEmailTemplate = mockSaveEmailTemplate;
export const getEmailTemplate = mockGetEmailTemplate;
export const listEmailTemplates = mockListEmailTemplates;

export interface OverviewMetrics {
  liveStreams: number;
  totalViewers: number;
  signupsToday: number;
  revenueNgnToday: number;
  flaggedItems: number;
  topGames: Array<{ id: string; name: string; viewers: number }>;
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
 * expo-sharing or window.open. Bearer token is NOT in the URL — the caller
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
