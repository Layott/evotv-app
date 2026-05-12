/**
 * Feature flags — admin-only routes today. Public read of flags is not
 * exposed yet (RN client never reads flags outside the admin settings UI).
 *
 * Backend:
 *   GET    /api/admin/feature-flags                  → FeatureFlag[]
 *   POST   /api/admin/feature-flags  body={key,enabled,description?,payload?}
 *   PATCH  /api/admin/feature-flags/[key]  body={enabled?, description?, payload?}
 *   DELETE /api/admin/feature-flags/[key]
 */

import { api, ApiError } from "./_client";
import type { FeatureFlag } from "@/lib/types";

interface BackendFlagRow {
  key: string;
  enabled: boolean;
  description: string;
  payload?: Record<string, unknown> | null;
}

function toFlag(row: BackendFlagRow): FeatureFlag {
  return {
    key: row.key,
    enabled: row.enabled,
    description: row.description ?? "",
  };
}

export async function listFlags(): Promise<FeatureFlag[]> {
  const rows = await api<BackendFlagRow[]>("/api/admin/feature-flags");
  return rows.map(toFlag);
}

export async function getFlag(key: string): Promise<boolean> {
  try {
    const rows = await api<BackendFlagRow[]>("/api/admin/feature-flags");
    return rows.find((r) => r.key === key)?.enabled ?? false;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403))
      return false;
    throw err;
  }
}

export async function setFlag(
  key: string,
  enabled: boolean,
  description?: string,
): Promise<void> {
  try {
    await api(`/api/admin/feature-flags/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: { enabled, ...(description !== undefined ? { description } : {}) },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      // Flag doesn't exist yet — upsert via POST.
      await api("/api/admin/feature-flags", {
        method: "POST",
        body: { key, enabled, description: description ?? "" },
      });
      return;
    }
    throw err;
  }
}
