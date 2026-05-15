import type { UserPrefs } from "@/lib/types";
import { api } from "./_client";

/**
 * GET /api/users/me/prefs — caller's stored preferences. Creates a default
 * row server-side if none exists, so this never returns null.
 */
export function getMyPrefs(): Promise<UserPrefs & { userId: string }> {
  return api<UserPrefs & { userId: string }>("/api/users/me/prefs");
}

/**
 * PATCH /api/users/me/prefs — partial update. Any field omitted is unchanged.
 */
export function patchMyPrefs(
  patch: Partial<UserPrefs>,
): Promise<UserPrefs & { userId: string }> {
  return api<UserPrefs & { userId: string }>("/api/users/me/prefs", {
    method: "PATCH",
    body: patch,
  });
}
