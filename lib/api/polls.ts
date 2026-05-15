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

export interface CreatePollPayload {
  streamId: string;
  question: string;
  options: Array<{ id: string; label: string }>;
  closesAt: string;
}

/** POST /api/streams/[id]/polls — admin only. */
export async function createPoll(payload: CreatePollPayload): Promise<Poll> {
  const res = await api<{ poll: Poll }>(
    `/api/streams/${encodeURIComponent(payload.streamId)}/polls`,
    {
      method: "POST",
      body: {
        question: payload.question,
        options: payload.options,
        closesAt: payload.closesAt,
      },
    },
  );
  return res.poll;
}

/** POST /api/polls/[id]/close — admin only. */
export async function closePollById(pollId: string): Promise<Poll> {
  const res = await api<{ poll: Poll }>(
    `/api/polls/${encodeURIComponent(pollId)}/close`,
    { method: "POST" },
  );
  return res.poll;
}
