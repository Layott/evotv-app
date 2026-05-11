import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { toast } from "sonner-native";
import {
  Bell,
  CalendarPlus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Trophy,
} from "lucide-react-native";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useMockAuth } from "@/components/providers";
import {
  CALENDAR_REGIONS,
  buildIcsFile,
  isReminderSet,
  listMatchCalendarEntries,
  toggleReminder,
  type CalendarMatch,
  type CalendarTier,
} from "@/lib/mock/calendar";
import { listGames } from "@/lib/api/games";
import { userPrefs } from "@/lib/mock/users";
import type { Game } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIERS: CalendarTier[] = ["s", "a", "b", "c"];
const TIER_TONES: Record<
  CalendarTier,
  { borderColor: string; backgroundColor: string; color: string; dot: string }
> = {
  s: {
    borderColor: "rgba(245,158,11,0.4)",
    backgroundColor: "rgba(245,158,11,0.1)",
    color: "#fcd34d",
    dot: "#fbbf24",
  },
  a: {
    borderColor: "rgba(44,215,227,0.4)",
    backgroundColor: "rgba(44,215,227,0.1)",
    color: "#67e8f9",
    dot: "#38bdf8",
  },
  b: {
    borderColor: "rgba(16,185,129,0.4)",
    backgroundColor: "rgba(16,185,129,0.1)",
    color: "#6ee7b7",
    dot: "#34d399",
  },
  c: {
    borderColor: "#404040",
    backgroundColor: "#262626",
    color: "#d4d4d4",
    dot: "#737373",
  },
};

function ymKey(d: Date) {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

function Chip({
  active,
  onPress,
  label,
  small,
  toneActive,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  small?: boolean;
  toneActive?: { borderColor: string; backgroundColor: string; color: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border px-3 active:opacity-70"
      style={{
        paddingVertical: small ? 2 : 4,
        borderColor: active
          ? toneActive?.borderColor ?? "rgba(44,215,227,0.5)"
          : "#262626",
        backgroundColor: active
          ? toneActive?.backgroundColor ?? "rgba(44,215,227,0.1)"
          : "rgba(15,15,15,0.6)",
      }}
    >
      <Text
        style={{
          fontSize: small ? 11 : 12,
          fontWeight: "500",
          color: active
            ? toneActive?.color ?? "#67e8f9"
            : "#a3a3a3",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function MatchCalendarPage() {
  const { user } = useMockAuth();
  const tz = React.useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );

  const [cursor, setCursor] = React.useState<Date>(() => new Date());
  const [matches, setMatches] = React.useState<CalendarMatch[] | null>(null);
  const [games, setGames] = React.useState<Game[]>([]);
  const [gameFilter, setGameFilter] = React.useState<string | null>(null);
  const [tierFilter, setTierFilter] = React.useState<CalendarTier | null>(null);
  const [regionFilter, setRegionFilter] = React.useState<string | null>(null);
  const [favOnly, setFavOnly] = React.useState(false);
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
  const [reminders, setReminders] = React.useState<Set<string>>(new Set());

  const favoriteTeams = React.useMemo(
    () => (user ? userPrefs[user.id]?.favoriteTeams ?? [] : []),
    [user],
  );

  React.useEffect(() => {
    listGames().then(setGames);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setMatches(null);
    listMatchCalendarEntries({
      monthIso: ymKey(cursor),
      gameId: gameFilter ?? undefined,
      tier: tierFilter ?? undefined,
      region: regionFilter ?? undefined,
      favoriteTeams: favOnly ? favoriteTeams : undefined,
    }).then((list) => {
      if (!cancelled) setMatches(list);
    });
    return () => {
      cancelled = true;
    };
  }, [cursor, gameFilter, tierFilter, regionFilter, favOnly, favoriteTeams]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push(d);
  }

  const matchesByDay: Record<string, CalendarMatch[]> = {};
  (matches ?? []).forEach((m) => {
    const key = format(parseISO(m.scheduledAt), "yyyy-MM-dd");
    matchesByDay[key] = matchesByDay[key] ?? [];
    matchesByDay[key]!.push(m);
  });

  const dayMatches = selectedDay
    ? matchesByDay[format(selectedDay, "yyyy-MM-dd")] ?? []
    : [];

  function handleAddToCalendar(matchesForExport: CalendarMatch[]) {
    if (matchesForExport.length === 0) return;
    // Build the .ics string but do not download — RN can't write a Blob.
    buildIcsFile(matchesForExport);
    toast.success(
      `Generated ${matchesForExport.length} event${
        matchesForExport.length === 1 ? "" : "s"
      } (.ics)`,
      { description: "Use share sheet to export." },
    );
  }

  function handleReminder(match: CalendarMatch) {
    const next = toggleReminder(match.id);
    setReminders((prev) => {
      const s = new Set(prev);
      if (next) s.add(match.id);
      else s.delete(match.id);
      return s;
    });
    if (next) {
      toast.success(
        `Reminder set: ${match.teamA.tag} vs ${match.teamB.tag}`,
      );
    } else {
      toast("Reminder cleared");
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <View className="mb-5">
        <Text className="text-2xl font-bold tracking-tight text-foreground">
          Match calendar
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Every match across African esports. Times shown in your local zone (
          <Text className="font-medium text-foreground">{tz}</Text>).
        </Text>
      </View>

      <View className="mb-4 flex-row flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onPress={() => setCursor(new Date())}>
          Today
        </Button>
        <View className="flex-row items-center rounded-lg border border-border bg-card">
          <Pressable
            onPress={() => setCursor((c) => subMonths(c, 1))}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            className="h-8 w-8 items-center justify-center active:opacity-70"
          >
            <ChevronLeft size={16} color="#e5e5e5" />
          </Pressable>
          <Text
            style={{
              paddingHorizontal: 8,
              fontSize: 13,
              fontWeight: "600",
              color: "#e5e5e5",
              fontVariant: ["tabular-nums"],
            }}
          >
            {format(cursor, "MMMM yyyy")}
          </Text>
          <Pressable
            onPress={() => setCursor((c) => addMonths(c, 1))}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            className="h-8 w-8 items-center justify-center active:opacity-70"
          >
            <ChevronRight size={16} color="#e5e5e5" />
          </Pressable>
        </View>
        <Button
          variant="outline"
          size="sm"
          disabled={!matches || matches.length === 0}
          onPress={() => handleAddToCalendar(matches ?? [])}
        >
          <CalendarPlus size={14} color="#e5e5e5" />
          <Text className="text-sm text-foreground">Export month</Text>
        </Button>
      </View>

      {/* Filters */}
      <View className="gap-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <Chip
            active={gameFilter === null}
            onPress={() => setGameFilter(null)}
            label="All games"
          />
          {games.map((g) => (
            <Chip
              key={g.id}
              active={gameFilter === g.id}
              onPress={() => setGameFilter(g.id)}
              label={g.shortName}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, alignItems: "center" }}
        >
          <Text style={{ fontSize: 11, color: "#737373" }}>Tier:</Text>
          {TIERS.map((t) => (
            <Chip
              key={t}
              active={tierFilter === t}
              onPress={() => setTierFilter(tierFilter === t ? null : t)}
              label={t.toUpperCase()}
              small
              toneActive={TIER_TONES[t]}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, alignItems: "center" }}
        >
          <Text style={{ fontSize: 11, color: "#737373" }}>Region:</Text>
          {CALENDAR_REGIONS.map((r) => (
            <Chip
              key={r}
              active={regionFilter === r}
              onPress={() => setRegionFilter(regionFilter === r ? null : r)}
              label={r}
              small
            />
          ))}
        </ScrollView>

        <Pressable
          onPress={() => setFavOnly(!favOnly)}
          disabled={favoriteTeams.length === 0}
          className="self-start flex-row items-center gap-1 rounded-full border px-3 py-1 active:opacity-70"
          style={{
            opacity: favoriteTeams.length === 0 ? 0.5 : 1,
            borderColor: favOnly
              ? "rgba(236,72,153,0.5)"
              : "#262626",
            backgroundColor: favOnly
              ? "rgba(236,72,153,0.1)"
              : "rgba(15,15,15,0.6)",
          }}
        >
          <Heart
            size={11}
            color={favOnly ? "#f472b6" : "#a3a3a3"}
            fill={favOnly ? "#f472b6" : "transparent"}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: favOnly ? "#f472b6" : "#a3a3a3",
            }}
          >
            Favorites only
          </Text>
        </Pressable>
      </View>

      {/* Calendar grid */}
      <View className="mt-5 rounded-xl border border-border bg-card p-3">
        <View className="flex-row gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <View
              key={d}
              style={{
                flex: 1,
                paddingVertical: 4,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: 1,
                  color: "#737373",
                  textTransform: "uppercase",
                }}
              >
                {d}
              </Text>
            </View>
          ))}
        </View>
        <View className="mt-1">
          {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIdx) => (
            <View key={weekIdx} className="mb-1 flex-row gap-1">
              {days.slice(weekIdx * 7, weekIdx * 7 + 7).map((d) => {
                const key = format(d, "yyyy-MM-dd");
                const inMonth = isSameMonth(d, cursor);
                const dayList = matchesByDay[key] ?? [];
                const isSelected =
                  selectedDay && isSameDay(d, selectedDay);
                return (
                  <Pressable
                    key={key}
                    onPress={() => setSelectedDay(d)}
                    className={cn(
                      "rounded-lg border p-1.5",
                      "active:opacity-80",
                    )}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      minHeight: 56,
                      borderColor: isSelected
                        ? "#67e8f9"
                        : isToday(d)
                          ? "rgba(44,215,227,0.6)"
                          : "#262626",
                      backgroundColor: isToday(d)
                        ? "rgba(44,215,227,0.05)"
                        : "rgba(15,15,15,0.6)",
                      opacity: inMonth ? 1 : 0.4,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          fontVariant: ["tabular-nums"],
                          color: isToday(d) ? "#67e8f9" : "#e5e5e5",
                        }}
                      >
                        {format(d, "d")}
                      </Text>
                      {dayList.length > 0 ? (
                        <Text
                          style={{
                            fontSize: 10,
                            color: "#a3a3a3",
                            fontVariant: ["tabular-nums"],
                          }}
                        >
                          {dayList.length}
                        </Text>
                      ) : null}
                    </View>
                    <View className="mt-1 flex-row flex-wrap gap-0.5">
                      {dayList.slice(0, 4).map((m) => (
                        <View
                          key={m.id}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 2.5,
                            backgroundColor: TIER_TONES[m.tier].dot,
                          }}
                        />
                      ))}
                      {dayList.length > 4 ? (
                        <Text style={{ fontSize: 9, color: "#737373" }}>
                          +{dayList.length - 4}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Day details */}
      <View className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
        <View className="border-b border-border p-4">
          <View className="flex-row items-center gap-2">
            <CalendarIcon size={14} color="#67e8f9" />
            <Text className="text-sm font-semibold text-foreground">
              {selectedDay
                ? format(selectedDay, "EEEE, d MMMM yyyy")
                : "Pick a day"}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: "#737373", marginTop: 4 }}>
            {selectedDay
              ? `${dayMatches.length} match${dayMatches.length === 1 ? "" : "es"} scheduled`
              : "Tap any day on the calendar to see matches."}
          </Text>
        </View>

        <View className="p-3">
          {matches === null ? (
            <View className="gap-2">
              <Skeleton style={{ height: 96, borderRadius: 8 }} />
              <Skeleton style={{ height: 96, borderRadius: 8 }} />
            </View>
          ) : !selectedDay ? (
            <View className="rounded-lg border border-dashed border-border p-6">
              <Text className="text-center text-sm text-muted-foreground">
                Select a day to see fixtures.
              </Text>
            </View>
          ) : dayMatches.length === 0 ? (
            <View className="rounded-lg border border-dashed border-border p-6">
              <Text className="text-center text-sm text-muted-foreground">
                No matches scheduled.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {dayMatches.map((match) => (
                <DayMatchCard
                  key={match.id}
                  match={match}
                  onReminder={() => handleReminder(match)}
                  onExport={() => handleAddToCalendar([match])}
                  reminded={reminders.has(match.id) || isReminderSet(match.id)}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function DayMatchCard({
  match,
  reminded,
  onReminder,
  onExport,
}: {
  match: CalendarMatch;
  reminded: boolean;
  onReminder: () => void;
  onExport: () => void;
}) {
  const tone = TIER_TONES[match.tier];
  return (
    <View
      className="rounded-lg border border-border p-3"
      style={{ backgroundColor: "rgba(15,15,15,0.6)" }}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <View
              className="rounded-md px-1.5 py-0.5"
              style={{
                borderWidth: 1,
                borderColor: tone.borderColor,
                backgroundColor: tone.backgroundColor,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 1,
                  color: tone.color,
                }}
              >
                {match.tier.toUpperCase()}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 1,
                color: "#737373",
                textTransform: "uppercase",
              }}
            >
              {match.gameShortName}
            </Text>
            {match.state === "live" ? (
              <View className="flex-row items-center gap-1">
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: "#ef4444",
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    letterSpacing: 1,
                    color: "#fca5a5",
                  }}
                >
                  LIVE
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            style={{ fontSize: 11, color: "#a3a3a3", marginTop: 4 }}
            numberOfLines={1}
          >
            {match.eventTitle}
          </Text>
        </View>
        <Countdown iso={match.scheduledAt} state={match.state} />
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        <TeamRow team={match.teamA} />
        <Text style={{ fontSize: 11, fontWeight: "600", color: "#737373" }}>
          vs
        </Text>
        <TeamRow team={match.teamB} reverse />
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Clock size={11} color="#737373" />
          <Text style={{ fontSize: 11, color: "#737373" }}>
            {new Intl.DateTimeFormat(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(match.scheduledAt))}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <MapPin size={11} color="#737373" />
          <Text style={{ fontSize: 11, color: "#737373" }}>
            {match.region}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Trophy size={11} color="#737373" />
          <Text style={{ fontSize: 11, color: "#737373" }}>
            Bo{match.bestOf}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <Button
          size="sm"
          variant={reminded ? "default" : "outline"}
          onPress={onReminder}
        >
          <Bell size={14} color={reminded ? "#000" : "#e5e5e5"} />
          <Text
            className={reminded ? "text-sm font-medium text-black" : "text-sm font-medium text-foreground"}
          >
            {reminded ? "Reminder set" : "Remind me"}
          </Text>
        </Button>
        <Button size="sm" variant="outline" onPress={onExport}>
          <CalendarPlus size={14} color="#e5e5e5" />
          <Text className="text-sm font-medium text-foreground">.ics</Text>
        </Button>
      </View>
    </View>
  );
}

function TeamRow({
  team,
  reverse,
}: {
  team: { id: string; name: string; tag: string; logoUrl: string };
  reverse?: boolean;
}) {
  return (
    <View
      className={cn(
        "min-w-0 flex-1 flex-row items-center gap-2",
        reverse && "flex-row-reverse",
      )}
    >
      <Avatar className="h-7 w-7">
        <AvatarImage src={team.logoUrl} />
        <AvatarFallback>
          {team.tag.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <View className="min-w-0 flex-1">
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: "#e5e5e5",
            textAlign: reverse ? "right" : "left",
          }}
          numberOfLines={1}
        >
          {team.tag}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: "#737373",
            textAlign: reverse ? "right" : "left",
          }}
          numberOfLines={1}
        >
          {team.name}
        </Text>
      </View>
    </View>
  );
}

function Countdown({
  iso,
  state,
}: {
  iso: string;
  state: "scheduled" | "live" | "completed";
}) {
  const target = new Date(iso).getTime();
  const [diff, setDiff] = React.useState(() => target - Date.now());
  React.useEffect(() => {
    const i = setInterval(() => setDiff(target - Date.now()), 30_000);
    return () => clearInterval(i);
  }, [target]);

  if (state === "completed") {
    return <Text style={{ fontSize: 10, color: "#737373" }}>Final</Text>;
  }
  if (state === "live") {
    return (
      <View
        className="rounded-md px-1.5 py-0.5"
        style={{ backgroundColor: "rgba(239,68,68,0.15)" }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 1,
            color: "#fca5a5",
          }}
        >
          NOW
        </Text>
      </View>
    );
  }
  if (diff <= 0) {
    return (
      <Text style={{ fontSize: 10, color: "#a3a3a3" }}>Starting…</Text>
    );
  }
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const label =
    days > 0
      ? `in ${days}d ${hours}h`
      : hours > 0
        ? `in ${hours}h ${minutes}m`
        : `in ${minutes}m`;
  return (
    <Text
      style={{
        fontSize: 10,
        color: "#d4d4d4",
        fontVariant: ["tabular-nums"],
      }}
    >
      {label}
    </Text>
  );
}

export default MatchCalendarPage;
