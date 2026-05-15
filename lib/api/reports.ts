import { api } from "./_client";

export type ReportTargetType =
  | "stream"
  | "vod"
  | "clip"
  | "user"
  | "chat_message"
  | "party";

export type ReportCategory =
  | "spam"
  | "abuse"
  | "copyright"
  | "illegal"
  | "csam"
  | "impersonation"
  | "other";

export type ReportStatus = "open" | "resolved" | "dismissed";

export interface ContentReport {
  id: string;
  reporterUserId: string | null;
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  details: string | null;
  status: ReportStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  /** Server-enriched: present when targetType=chat_message. */
  targetPreview?: {
    body: string;
    streamId: string;
    userId: string;
  } | null;
}

export interface SubmitReportInput {
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  details?: string;
}

export function submitReport(
  input: SubmitReportInput,
): Promise<{ ok: true; reportId: string }> {
  return api("/api/reports", { method: "POST", body: input });
}

export function listMyReports(): Promise<{ reports: ContentReport[] }> {
  return api("/api/reports");
}

export interface ListReportsOptions {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  category?: ReportCategory;
  limit?: number;
  offset?: number;
}

export interface ListReportsResult {
  reports: ContentReport[];
  total: number;
  limit: number;
  offset: number;
}

export function listAdminReports(
  opts: ListReportsOptions = {},
): Promise<ListReportsResult> {
  return api("/api/admin/reports", {
    query: {
      status: opts.status,
      targetType: opts.targetType,
      category: opts.category,
      limit: opts.limit,
      offset: opts.offset,
    },
  });
}

export function resolveReport(
  id: string,
  status: "resolved" | "dismissed",
  notes?: string,
): Promise<{ ok: true; reportId: string; status: "resolved" | "dismissed" }> {
  return api(`/api/admin/reports/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status, notes },
  });
}

export function bulkResolveReports(
  ids: string[],
  status: "resolved" | "dismissed",
  notes?: string,
): Promise<{ ok: true; updated: number; skipped: number }> {
  return api(`/api/admin/reports/bulk`, {
    method: "POST",
    body: { ids, status, notes },
  });
}
