/**
 * Partner-scoped chat moderation. Backed by:
 *   POST /api/partner/channels/[id]/chat/mod
 *     body { action: "pin" | "delete" | "timeout", ... }
 *
 * Auth: editor+ on the channel's publisher (or EVO admin).
 */

import { api, ApiError } from "./_client";

export type ModAction =
  | { action: "pin"; messageId: string }
  | { action: "delete"; messageId: string }
  | { action: "timeout"; userId: string; durationSec: number };

export interface PinResult {
  ok: true;
  isPinned: boolean;
}

export interface DeleteResult {
  ok: true;
}

export interface TimeoutResult {
  ok: true;
  expiresAt: string;
}

export type ModResult = PinResult | DeleteResult | TimeoutResult;

export class ModError extends Error {
  status: number;
  code: "forbidden" | "not_found" | "invalid" | "auth_required" | "unknown";

  constructor(status: number, code: ModError["code"], message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function modAction(
  channelId: string,
  body: ModAction,
): Promise<ModResult> {
  try {
    return await api<ModResult>(
      `/api/partner/channels/${encodeURIComponent(channelId)}/chat/mod`,
      { method: "POST", body },
    );
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401)
        throw new ModError(401, "auth_required", "Sign in to moderate");
      if (err.status === 403)
        throw new ModError(403, "forbidden", "Need editor role or higher");
      if (err.status === 404)
        throw new ModError(404, "not_found", "Target not found");
      if (err.status === 422)
        throw new ModError(422, "invalid", "Invalid mod action");
    }
    throw new ModError(500, "unknown", "Mod action failed");
  }
}
