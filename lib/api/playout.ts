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
