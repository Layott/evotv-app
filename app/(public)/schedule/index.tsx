import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, BellOff, Calendar, Clock, Film, Radio, Trophy } from "@/components/icons";

import { PressableScale } from "@/components/common/pressable-scale";
import { TopNavbar } from "@/components/home/top-navbar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listScheduleForDay,
  type EpgPillar,
  type EpgRow,
} from "@/lib/api/schedule";
import { useReminder } from "@/hooks/useReminder";
import { useAuth } from "@/components/providers";

type PillarFilter = "all" | EpgPillar;

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildDayStrip(): { iso: string; label: string; sub: string }[] {
  const out: { iso: string; label: string; sub: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = -1; i <= 6; i++) {
    const d = new Date(today.getTime() + i * 86_400_000);
    let label: string;
    if (i === 0) label = "Today";
    else if (i === 1) label = "Tomorrow";
    else if (i === -1) label = "Yesterday";
    else label = d.toLocaleDateString(undefined, { weekday: "short" });
    out.push({
      iso: isoDay(d),
      label,
      sub: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    });
  }
  return out;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function pillarStyle(p: EpgPillar): {
  backgroundColor: string;
  color: string;
  label: string;
} {
  switch (p) {
    case "anime":
      return {
        backgroundColor: "rgba(244,114,182,0.3)",
        color: "#f9a8d4",
        label: "Anime",
      };
    case "lifestyle":
      return {
        backgroundColor: "rgba(168,85,247,0.3)",
        color: "#d8b4fe",
        label: "Lifestyle",
      };
    case "esports":
    default:
      return {
        backgroundColor: "rgba(70,227,206,0.3)",
        color: "#67e8f9",
        label: "Esports",
      };
  }
}

function KindIcon({ kind, size = 13, color = "#9FBDBD" }: { kind: EpgRow["kind"]; size?: number; color?: string }) {
  if (kind === "live_stream") return <Radio size={size} color={color} />;
  if (kind === "match") return <Trophy size={size} color={color} />;
  return <Film size={size} color={color} />;
}

function LiveBadge() {
  return (
    <View
      className="flex-row items-center gap-1 rounded-md px-2 py-0.5"
      style={{
        backgroundColor: "rgba(239,68,68,0.25)",
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#ef4444",
        }}
      />
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 1,
          color: "#fca5a5",
        }}
      >
        LIVE
      </Text>
    </View>
  );
}

/**
 * Which programme is imminent, on a list where every row is in the future.
 *
 * Quieter than LIVE on purpose: one thing is happening, the other is only
 * about to. Same shape, no red, and no dot, since nothing is on air.
 */
function UpNextBadge() {
  return (
    <View
      className="rounded-md px-2 py-0.5"
      style={{ backgroundColor: "rgba(56,189,248,0.25)" }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 1,
          color: "#7dd3fc",
        }}
      >
        UP NEXT
      </Text>
    </View>
  );
}

function ReminderBell({
  targetId,
  airsAt,
  isAuthenticated,
}: {
  targetId: string;
  airsAt: string;
  isAuthenticated: boolean;
}) {
  const palette = useTokens();
  const router = useRouter();
  const reminder = useReminder(targetId, airsAt, isAuthenticated);

  const onPress = () => {
    if (!isAuthenticated) {
      router.push("/login" as never);
      return;
    }
    reminder.toggle();
  };

  const Icon = reminder.active ? Bell : BellOff;
  const color = reminder.active ? "#67e8f9" : palette.muted;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      disabled={reminder.isPending}
      className="absolute right-2 top-2 rounded-md border bg-card/70 px-1.5 py-1 active:opacity-70"
      style={{
        opacity: reminder.isPending ? 0.5 : 1,
      }}
      accessibilityRole="button"
      accessibilityLabel={reminder.active ? "Remove reminder" : "Set reminder"}
    >
      <Icon size={13} color={color} />
    </Pressable>
  );
}

function EpgCard({
  row,
  isAuthenticated,
  upNext = false,
}: {
  row: EpgRow;
  isAuthenticated: boolean;
  /** The programme that starts next. Only ever one card on a day. */
  upNext?: boolean;
}) {
  const palette = useTokens();
  const router = useRouter();
  const pillar = pillarStyle(row.pillar);
  const isLive = row.state === "live";
  const isCompleted = row.state === "completed";
  const showBell = row.state === "scheduled";

  return (
    <PressableScale
      onPress={() => router.push(row.watchUrl as never)}
      className="flex-row overflow-hidden rounded-xl border border-border bg-card"
      style={{ opacity: isCompleted ? 0.6 : 1 }}
    >
      <View
        style={{
          width: 128,
          aspectRatio: 1,
          position: "relative",
          backgroundColor: "#0d0d0d",
        }}
      >
        <Image
          source={row.thumbnailUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View
          className="absolute left-2 top-2 rounded-md px-1.5 py-0.5"
          style={{
            backgroundColor: pillar.backgroundColor,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 0.5,
              color: pillar.color,
            }}
          >
            {pillar.label.toUpperCase()}
          </Text>
        </View>
        {isLive ? (
          <View className="absolute left-2 top-9">
            <LiveBadge />
          </View>
        ) : null}
        {upNext ? (
          <View className="absolute left-2 top-9">
            <UpNextBadge />
          </View>
        ) : null}
      </View>

      <View className="flex-1 gap-1 p-3">
        {showBell ? (
          <ReminderBell
            targetId={row.id}
            airsAt={row.airsAt}
            isAuthenticated={isAuthenticated}
          />
        ) : null}
        <View className="flex-row items-center gap-1 pr-7">
          <Clock size={11} color={palette.muted} />
          <Text style={{ fontSize: 11, color: palette.muted, fontWeight: "500" }}>
            {formatTime(row.airsAt)}
          </Text>
          <Text style={{ fontSize: 11, color: palette.muted }}>
            · {row.durationMin}m
          </Text>
        </View>

        <Text
          className="text-sm font-semibold text-foreground"
          numberOfLines={1}
        >
          {row.title}
        </Text>

        <Text
          style={{ fontSize: 12, color: palette.muted }}
          numberOfLines={1}
        >
          {row.subtitle}
        </Text>

        <View className="mt-auto flex-row items-center gap-1 pt-1">
          <KindIcon kind={row.kind} />
          <Text style={{ fontSize: 11, color: palette.muted }}>
            {row.kind === "live_stream"
              ? "Live broadcast"
              : row.kind === "match"
                ? "Match"
                : "Episode"}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

function Chip({
  active,
  onPress,
  label,
  toneActive,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  toneActive?: { backgroundColor: string; color: string };
}) {
  const palette = useTokens();
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border px-3 py-1 active:opacity-70"
      style={{
        backgroundColor: active
          ? toneActive?.backgroundColor ?? "rgba(70,227,206,0.1)"
          : "rgba(15,15,15,0.6)",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          color: active ? toneActive?.color ?? "#67e8f9" : palette.muted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DayChip({
  active,
  onPress,
  label,
  sub,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
  sub: string;
}) {
  const palette = useTokens();
  return (
    <Pressable
      onPress={onPress}
      className="items-center rounded-xl border px-4 py-2 active:opacity-70"
      style={{
        backgroundColor: active
          ? "rgba(70,227,206,0.1)"
          : "rgba(15,15,15,0.6)",
        minWidth: 76,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: active ? "#67e8f9" : palette.fg,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: active ? "#67e8f9" : palette.muted,
          marginTop: 2,
        }}
      >
        {sub}
      </Text>
    </Pressable>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Text className="px-4 text-xl font-semibold tracking-tight text-foreground">
      {children}
    </Text>
  );
}

export default function ScheduleScreen() {
  const palette = useTokens();
  const days = React.useMemo(() => buildDayStrip(), []);
  const [selectedDay, setSelectedDay] = React.useState<string>(
    isoDay(new Date()),
  );
  const [pillar, setPillar] = React.useState<PillarFilter>("all");
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ["schedule", selectedDay, pillar],
    queryFn: () => listScheduleForDay({ date: selectedDay, pillar }),
  });

  const rows = query.data ?? [];
  const live = rows.filter((r) => r.state === "live");
  const upcoming = rows.filter((r) => r.state === "scheduled");
  const past = rows.filter((r) => r.state === "completed");

  const isToday = selectedDay === isoDay(new Date());

  return (
    <View className="flex-1 bg-background">
      <TopNavbar />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 48 }}
      >
        <View className="gap-1 px-4 pb-4">
          <Text className="text-2xl font-bold tracking-tight text-foreground">
            What's airing
          </Text>
          <Text className="text-sm text-muted-foreground">
            Live streams, anime drops, lifestyle premieres, and esports matches -
            in one schedule.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {days.map((d) => (
            <DayChip
              key={d.iso}
              active={selectedDay === d.iso}
              onPress={() => setSelectedDay(d.iso)}
              label={d.label}
              sub={d.sub}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginTop: 12 }}
        >
          <Chip
            active={pillar === "all"}
            onPress={() => setPillar("all")}
            label="All pillars"
          />
          <Chip
            active={pillar === "esports"}
            onPress={() => setPillar("esports")}
            label="Esports"
            toneActive={pillarStyle("esports")}
          />
          <Chip
            active={pillar === "anime"}
            onPress={() => setPillar("anime")}
            label="Anime"
            toneActive={pillarStyle("anime")}
          />
          <Chip
            active={pillar === "lifestyle"}
            onPress={() => setPillar("lifestyle")}
            label="Lifestyle"
            toneActive={pillarStyle("lifestyle")}
          />
        </ScrollView>

        <View className="mt-6 gap-6">
          {query.isPending ? (
            <View className="gap-3 px-4">
              <Skeleton style={{ height: 112, borderRadius: 12 }} />
              <Skeleton style={{ height: 112, borderRadius: 12 }} />
              <Skeleton style={{ height: 112, borderRadius: 12 }} />
            </View>
          ) : query.isError ? (
            <View className="mx-4 rounded-xl border border-border bg-card p-8">
              <Text className="text-center text-sm text-muted-foreground">
                Schedule could not load. Pull to retry.
              </Text>
            </View>
          ) : rows.length === 0 ? (
            <View className="mx-4 rounded-xl border border-border bg-card p-8">
              <View className="items-center gap-2">
                <Calendar size={28} color={palette.muted} />
                <Text className="text-center text-sm text-muted-foreground">
                  Nothing on the schedule for this day yet.
                </Text>
              </View>
            </View>
          ) : (
            <>
              {isToday && live.length > 0 ? (
                <View className="gap-3">
                  <View className="flex-row items-center gap-2 px-4">
                    <LiveBadge />
                    <Text className="text-xl font-semibold tracking-tight text-foreground">
                      Airing now
                    </Text>
                  </View>
                  <View className="gap-3 px-4">
                    {live.map((r) => (
                      <EpgCard key={r.id} row={r} isAuthenticated={isAuthenticated} />
                    ))}
                  </View>
                </View>
              ) : null}

              {upcoming.length > 0 ? (
                <View className="gap-3">
                  <SectionHeader>
                    {isToday ? "Coming up today" : "Scheduled"}
                  </SectionHeader>
                  <View className="gap-3 px-4">
                    {upcoming.map((r, i) => (
                      <EpgCard
                        key={r.id}
                        row={r}
                        isAuthenticated={isAuthenticated}
                        /* The list is ordered by airtime, so the first card is
                           what comes on next. Only on a day that is running:
                           on a future day every row is upcoming and none of
                           them is next. */
                        upNext={isToday && i === 0}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {past.length > 0 ? (
                <View className="gap-3">
                  <SectionHeader>Earlier</SectionHeader>
                  <View className="gap-3 px-4">
                    {past.map((r) => (
                      <EpgCard key={r.id} row={r} isAuthenticated={isAuthenticated} />
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
