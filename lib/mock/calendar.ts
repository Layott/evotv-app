import { sleep, daysAhead, daysAgo } from "./_util";
import type { Match } from "@/lib/types";
import { matches as baseMatches, events as baseEvents } from "./events";
import { teams } from "./teams";
import { games } from "./games";
import { syncGet, syncSet } from "@/lib/storage/persist";

export type CalendarTier = "s" | "a" | "b" | "c";

export interface CalendarMatch {
  id: string;
  matchId: string;
  eventId: string;
  eventTitle: string;
  gameId: string;
  gameShortName: string;
  region: string;
  tier: CalendarTier;
  scheduledAt: string;
  durationMin: number;
  teamA: { id: string; name: string; logoUrl: string; tag: string };
  teamB: { id: string; name: string; logoUrl: string; tag: string };
  bestOf: number;
  state: Match["state"];
  round: string;
}

const TIERS: CalendarTier[] = ["s", "a", "b", "c"];
const ROUNDS = [
  "Group stage",
  "Quarterfinal",
  "Semifinal",
  "Wildcard",
  "Final",
  "Lower bracket",
  "Upper bracket",
];

function teamPair(seed: number) {
  const a = teams[seed % teams.length]!;
  // pick a different team in same game when possible
  const candidates = teams.filter((t) => t.gameId === a.gameId && t.id !== a.id);
  const b = (candidates[(seed + 3) % Math.max(candidates.length, 1)] ??
    teams[(seed + 1) % teams.length])!;
  return { a, b };
}

function buildSyntheticMatches(): CalendarMatch[] {
  const list: CalendarMatch[] = [];
  // Spread ~80 matches across previous 14 days and next 28 days for a rich calendar.
  const now = Date.now();
  for (let i = 0; i < 80; i++) {
    const dayOffset = -14 + (i % 42); // -14..+27
    const hour = 12 + (i % 8);
    const minute = (i % 4) * 15;
    const date = new Date(now + dayOffset * 86_400_000);
    date.setHours(hour, minute, 0, 0);
    const tier = TIERS[i % TIERS.length]!;
    const game = games[i % games.length]!;
    const round = ROUNDS[i % ROUNDS.length]!;
    const { a, b } = teamPair(i);
    const eventTpl = baseEvents[i % baseEvents.length]!;
    list.push({
      id: `cal_${i + 1}`,
      matchId: `cal_match_${i + 1}`,
      eventId: eventTpl.id,
      eventTitle: eventTpl.title,
      gameId: game.id,
      gameShortName: game.shortName,
      region: eventTpl.region,
      tier,
      scheduledAt: date.toISOString(),
      durationMin: 45 + (i % 5) * 15,
      teamA: { id: a.id, name: a.name, logoUrl: a.logoUrl, tag: a.tag },
      teamB: { id: b.id, name: b.name, logoUrl: b.logoUrl, tag: b.tag },
      bestOf: i % 4 === 0 ? 5 : 3,
      state: dayOffset < 0 ? "completed" : dayOffset === 0 ? "live" : "scheduled",
      round,
    });
  }
  // Wire in real matches from events.ts
  baseMatches.forEach((m, i) => {
    const ev = baseEvents.find((e) => e.id === m.eventId);
    const a = teams.find((t) => t.id === m.teamAId);
    const b = teams.find((t) => t.id === m.teamBId);
    const game = games.find((g) => g.id === ev?.gameId);
    if (!ev || !a || !b || !game) return;
    list.push({
      id: `cal_real_${m.id}`,
      matchId: m.id,
      eventId: ev.id,
      eventTitle: ev.title,
      gameId: game.id,
      gameShortName: game.shortName,
      region: ev.region,
      tier: ev.tier,
      scheduledAt: m.scheduledAt,
      durationMin: 60,
      teamA: { id: a.id, name: a.name, logoUrl: a.logoUrl, tag: a.tag },
      teamB: { id: b.id, name: b.name, logoUrl: b.logoUrl, tag: b.tag },
      bestOf: m.bestOf,
      state: m.state,
      round: m.round,
    });
  });
  return list;
}

export const calendarMatches: CalendarMatch[] = buildSyntheticMatches();

export interface CalendarMonthFilter {
  monthIso: string; // "2026-04"
  gameId?: string;
  tier?: CalendarTier;
  region?: string;
  favoriteTeams?: string[];
}

export async function listMatchCalendarEntries(
  filter: CalendarMonthFilter,
): Promise<CalendarMatch[]> {
  await sleep(80);
  const [yearStr, monthStr] = filter.monthIso.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const start = new Date(year, month, 1, 0, 0, 0).getTime();
  const end = new Date(year, month + 1, 1, 0, 0, 0).getTime();
  return calendarMatches.filter((m) => {
    const t = new Date(m.scheduledAt).getTime();
    if (t < start || t >= end) return false;
    if (filter.gameId && m.gameId !== filter.gameId) return false;
    if (filter.tier && m.tier !== filter.tier) return false;
    if (filter.region && m.region !== filter.region) return false;
    if (filter.favoriteTeams && filter.favoriteTeams.length > 0) {
      if (
        !filter.favoriteTeams.includes(m.teamA.id) &&
        !filter.favoriteTeams.includes(m.teamB.id)
      ) {
        return false;
      }
    }
    return true;
  });
}

export async function listMatchesForDay(dayIso: string): Promise<CalendarMatch[]> {
  await sleep(60);
  const [yearStr, monthStr, dayStr] = dayIso.split("-");
  const target = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
  const start = target.getTime();
  const end = start + 86_400_000;
  return calendarMatches
    .filter((m) => {
      const t = new Date(m.scheduledAt).getTime();
      return t >= start && t < end;
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
}

function escapeIcs(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toIcsDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export function buildIcsFile(matches: CalendarMatch[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EVO TV//Match Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  matches.forEach((m) => {
    const dtStart = toIcsDate(m.scheduledAt);
    const dtEnd = toIcsDate(
      new Date(new Date(m.scheduledAt).getTime() + m.durationMin * 60_000).toISOString(),
    );
    const summary = `${m.teamA.tag} vs ${m.teamB.tag} — ${m.eventTitle}`;
    const description = `${m.round} · Bo${m.bestOf} · ${m.gameShortName} · ${m.region}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${m.id}@evo.tv`,
      `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `LOCATION:${escapeIcs("evo.tv/stream/" + m.eventId)}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Web parity: the web build dropped a Blob via `URL.createObjectURL`.
 * RN has no Blob/URL/<a> — callers should hand the returned string to
 * expo-file-system + expo-sharing instead. This shim is a no-op so existing
 * call-sites compile; pages will get a runtime warning if they hit it.
 */
export function downloadIcs(filename: string, ics: string) {
  // Intentional no-op in RN. Use expo-file-system to write `ics` and
  // expo-sharing to surface it to the user.
  void filename;
  void ics;
  if (typeof console !== "undefined") {
    console.warn(
      "[mock/calendar] downloadIcs() is a no-op in React Native — pipe the .ics string into expo-file-system + expo-sharing instead.",
    );
  }
}

// Used by the page filter chips.
export const CALENDAR_REGIONS = [
  "Africa",
  "West Africa",
  "East Africa",
  "North Africa",
  "Southern Africa",
];

const REMINDERS_KEY = "evotv_calendar_reminders_v1";
const reminders = new Set<string>();
let remindersHydrated = false;

function hydrateReminders() {
  if (remindersHydrated) return;
  remindersHydrated = true;
  try {
    const raw = syncGet(REMINDERS_KEY);
    if (raw) (JSON.parse(raw) as string[]).forEach((s) => reminders.add(s));
  } catch {
    /* noop */
  }
}

export function isReminderSet(id: string) {
  hydrateReminders();
  return reminders.has(id);
}

export function toggleReminder(id: string): boolean {
  hydrateReminders();
  if (reminders.has(id)) reminders.delete(id);
  else reminders.add(id);
  try {
    syncSet(REMINDERS_KEY, JSON.stringify([...reminders]));
  } catch {
    /* noop */
  }
  return reminders.has(id);
}
