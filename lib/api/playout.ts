import { api } from "./_client";

export interface PlayoutMediaFile {
  id: string;
  filePath: string;
  fileName: string;
  durationSec: number | null;
  sizeMb: number | null;
  lastSeenAt: string;
}

export interface ListPlayoutMediaResult {
  files: PlayoutMediaFile[];
  total: number;
}

/**
 * GET /api/admin/playout-media - support_admin+.
 * Active media files the office playout box has reported (see the office
 * media-agent). Powers the file picker in the stream schedule editor.
 */
export function listPlayoutMedia(q?: string): Promise<ListPlayoutMediaResult> {
  return api<ListPlayoutMediaResult>("/api/admin/playout-media", {
    query: q ? { q } : undefined,
  });
}

export interface PlayoutConfig {
  /** File paths looped in gaps between scheduled shows. Max 100. */
  fillerFiles: string[];
  /** File paths rotated during ad breaks. Max 100. */
  adFiles: string[];
}

/**
 * GET /api/admin/playout-config - support_admin+.
 * Filler + ad-break media the office playout box pulls automatically
 * (it receives the same config via /api/internal/playout-resolve).
 */
export function getPlayoutConfig(): Promise<PlayoutConfig> {
  return api<PlayoutConfig>("/api/admin/playout-config");
}

/**
 * PUT /api/admin/playout-config - support_admin+.
 * Replaces the whole config (both arrays) and echoes what was saved.
 */
export function savePlayoutConfig(config: PlayoutConfig): Promise<PlayoutConfig> {
  return api<PlayoutConfig>("/api/admin/playout-config", {
    method: "PUT",
    body: config,
  });
}
