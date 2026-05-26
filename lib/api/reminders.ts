import { api } from "./_client";

export interface EpgReminder {
  userId: string;
  targetId: string;
  airsAt: string;
  leadMin: number;
  notifiedAt: string | null;
  createdAt: string;
}

export async function listReminders(): Promise<EpgReminder[]> {
  const data = await api<{ reminders: EpgReminder[] }>("/api/reminders");
  return data.reminders;
}

export async function createReminder(body: {
  targetId: string;
  airsAt: string;
  leadMin?: number;
}): Promise<{ ok: true; targetId: string; airsAt: string; leadMin: number }> {
  return api("/api/reminders", { method: "POST", body });
}

export async function deleteReminder(
  targetId: string,
): Promise<{ ok: true; targetId: string }> {
  return api("/api/reminders", {
    method: "DELETE",
    query: { targetId },
  });
}
