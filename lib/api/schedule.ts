import { api } from "./_client";

export type EpgPillar = "esports" | "anime" | "lifestyle";
export type EpgKind = "live_stream" | "episode" | "match";
export type EpgState = "scheduled" | "live" | "completed";

export interface EpgRow {
  id: string;
  kind: EpgKind;
  pillar: EpgPillar;
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  airsAt: string;
  durationMin: number;
  watchUrl: string;
  state: EpgState;
}

interface DayResponse {
  date: string;
  rows: EpgRow[];
}

interface WeekResponse {
  from: string;
  byDay: Record<string, EpgRow[]>;
}

export interface ScheduleDayParams {
  date: string;
  pillar?: EpgPillar | "all";
}

export interface ScheduleWeekParams {
  from: string;
  pillar?: EpgPillar | "all";
}

export async function listScheduleForDay(
  params: ScheduleDayParams,
): Promise<EpgRow[]> {
  const data = await api<DayResponse>("/api/schedule", {
    query: { date: params.date, pillar: params.pillar },
  });
  return data.rows;
}

export async function listScheduleForWeek(
  params: ScheduleWeekParams,
): Promise<Record<string, EpgRow[]>> {
  const data = await api<WeekResponse>("/api/schedule", {
    query: { week: 1, from: params.from, pillar: params.pillar },
  });
  return data.byDay;
}
