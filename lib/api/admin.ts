/**
 * Admin-side API.
 *
 * Phase 2C scope:
 *   - Email templates: backend has no route yet — passthrough to mock.
 *   - Overview metrics: backend has /api/admin/analytics/overview.
 *   - Audit log: backend has /api/admin/audit-log.
 *
 * Other admin operations live on their respective lib/api modules (ads,
 * events, games, players, teams, streams, polls, orders, flags).
 * Forensic, moderation, users-roles, billing remain on mock until backend
 * adds /api/admin/{forensic,users,...} routes — tracked in Phase 2C.5.
 */

import { api } from "./_client";
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

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export async function listAuditLog(limit = 50): Promise<AuditLogEntry[]> {
  return api<AuditLogEntry[]>(`/api/admin/audit-log?limit=${limit}`);
}
