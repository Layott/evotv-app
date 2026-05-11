import type { Poll } from "@/lib/types";
import { api } from "./_client";

/** GET /api/polls?streamId= */
export function listPollsForStream(streamId: string): Promise<Poll[]> {
  return api<Poll[]>("/api/polls", { query: { streamId } });
}

/** GET /api/polls/[id] */
export function getPollById(id: string): Promise<Poll | null> {
  return api<Poll | null>(`/api/polls/${id}`);
}

/** POST /api/polls/[id]/vote — body { optionId } */
export function voteOnPoll(pollId: string, optionId: string): Promise<Poll> {
  return api<Poll>(`/api/polls/${pollId}/vote`, {
    method: "POST",
    body: { optionId },
  });
}
