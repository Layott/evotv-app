import * as React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  CalendarClock,
  CalendarRange,
  Copy,
  KeyRound,
  Pencil,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  adminCreateStream,
  adminUpdateStreamSchedule,
  listAdminStreams,
} from "@/lib/api/streams";
import { listGames } from "@/lib/api/games";
import {
  listScheduleForDay,
  listScheduleForWeek,
  type EpgRow,
} from "@/lib/api/schedule";
import type { Stream } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

const DEFAULT_STREAMER = "EVO TV Channel";
const DEFAULT_DURATION = "60";

/**
 * Schedule info recovered from the public EPG. Needed because the backend
 * GET /api/admin/streams select list omits scheduledStartAt and
 * scheduledDurationMin, so admin list rows never carry them at runtime.
 * The /api/schedule feed IS built from streams.scheduledStartAt, so we map
 * its live_stream rows back to stream ids and merge.
 */
interface EpgScheduleInfo {
  airsAt: string;
  durationMin: number;
  state: EpgRow["state"];
}

interface ScheduledStreamRow {
  stream: Stream;
  startAt: string;
  durationMin: number;
}

export function ScheduleManagerPage() {
  const queryClient = useQueryClient();
  const days = React.useMemo(() => buildDayStrip(), []);
  const todayIso = days[0]?.iso ?? isoDay(new Date());
  const [selectedDay, setSelectedDay] = React.useState<string>(todayIso);
  const [editing, setEditing] = React.useState<ScheduledStreamRow | null>(null);
  const [reveal, setReveal] = React.useState<{
    title: string;
    streamKey: string;
    ingestUrl: string;
  } | null>(null);

  // Form state (Section 3).
  const [title, setTitle] = React.useState("");
  const [streamerName, setStreamerName] = React.useState(DEFAULT_STREAMER);
  const [gameId, setGameId] = React.useState("");
  const [startDate, setStartDate] = React.useState(todayIso);
  const [startTime, setStartTime] = React.useState("");
  const [duration, setDuration] = React.useState(DEFAULT_DURATION);

  const guideQ = useQuery({
    queryKey: ["admin-schedule", "day", selectedDay],
    queryFn: () => listScheduleForDay({ date: selectedDay }),
    staleTime: 30_000,
  });

  const weekQ = useQuery({
    queryKey: ["admin-schedule", "week", todayIso],
    queryFn: () => listScheduleForWeek({ from: todayIso }),
    staleTime: 30_000,
  });

  const streamsQ = useQuery({
    queryKey: ["admin-streams", "schedule-page"],
    queryFn: () => listAdminStreams({ limit: 100 }),
    staleTime: 30_000,
  });

  const gamesQ = useQuery({
    queryKey: ["games"],
    queryFn: listGames,
    staleTime: 60_000,
  });

  const invalidateScheduleData = React.useCallback(() => {
    // Guide (day + week share the "admin-schedule" prefix), admin stream
    // lists (this page + the Streams manager), and the public guide screens.
    void queryClient.invalidateQueries({ queryKey: ["admin-schedule"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-streams"] });
    void queryClient.invalidateQueries({ queryKey: ["schedule"] });
  }, [queryClient]);

  const epgByStreamId = React.useMemo(() => {
    const map = new Map<string, EpgScheduleInfo>();
    for (const rows of Object.values(weekQ.data ?? {})) {
      for (const row of rows) {
        if (row.kind !== "live_stream") continue;
        const streamId = streamIdFromEpgRow(row);
        if (!streamId) continue;
        const existing = map.get(streamId);
        if (!existing || row.airsAt < existing.airsAt) {
          map.set(streamId, {
            airsAt: row.airsAt,
            durationMin: row.durationMin,
            state: row.state,
          });
        }
      }
    }
    return map;
  }, [weekQ.data]);

  const scheduledRows = React.useMemo<ScheduledStreamRow[]>(() => {
    const rows: ScheduledStreamRow[] = [];
    for (const s of streamsQ.data?.streams ?? []) {
      if (s.deletedAt) continue;
      if (s.scheduledStartAt) {
        rows.push({
          stream: s,
          startAt: s.scheduledStartAt,
          durationMin: s.scheduledDurationMin ?? 60,
        });
        continue;
      }
      const epg = epgByStreamId.get(s.id);
      if (!epg) continue;
      // The EPG surfaces ad-hoc live streams (no schedule) on today's grid
      // with state "live" and airsAt = startedAt. Skip that combination so
      // we never present a start time as a schedule the stream never had.
      // ("live" state on a NOT-live admin row means the slot is inside its
      // programmed window, which is a real schedule - keep those.)
      if (epg.state === "live" && s.isLive) continue;
      rows.push({ stream: s, startAt: epg.airsAt, durationMin: epg.durationMin });
    }
    rows.sort((a, b) => a.startAt.localeCompare(b.startAt));
    return rows;
  }, [streamsQ.data, epgByStreamId]);

  const scheduleMut = useMutation({
    mutationFn: (args: {
      id: string;
      scheduledStartAt: string | null;
      scheduledDurationMin: number | null;
    }) =>
      adminUpdateStreamSchedule(args.id, {
        scheduledStartAt: args.scheduledStartAt,
        scheduledDurationMin: args.scheduledDurationMin,
      }),
    onSuccess: (_res, args) => {
      toast.success(
        args.scheduledStartAt ? "Schedule updated" : "Stream unscheduled",
      );
      invalidateScheduleData();
      setEditing(null);
    },
    onError: (err) =>
      toast.error("Couldn't update schedule", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const resetForm = React.useCallback(() => {
    setTitle("");
    setStreamerName(DEFAULT_STREAMER);
    setGameId("");
    setStartDate(todayIso);
    setStartTime("");
    setDuration(DEFAULT_DURATION);
  }, [todayIso]);

  const createMut = useMutation({
    mutationFn: async (args: {
      title: string;
      streamerName: string;
      gameId: string;
      startAtIso: string;
      durationMin: number;
    }) => {
      const created = await adminCreateStream({
        title: args.title,
        gameId: args.gameId,
        streamerName: args.streamerName,
      });
      // Schedule in a second call - POST /api/admin/streams has no schedule
      // fields. If this PATCH fails we still surface the one-time key.
      let scheduleError: string | null = null;
      try {
        await adminUpdateStreamSchedule(created.id, {
          scheduledStartAt: args.startAtIso,
          scheduledDurationMin: args.durationMin,
        });
      } catch (err) {
        scheduleError =
          err instanceof Error ? err.message : "Schedule update failed";
      }
      return { created, scheduleError, title: args.title };
    },
    onSuccess: ({ created, scheduleError, title: createdTitle }) => {
      setReveal({
        title: createdTitle,
        streamKey: created.streamKey,
        ingestUrl: created.ingestUrl,
      });
      if (scheduleError) {
        toast.error("Stream created, but scheduling failed", {
          description: `${scheduleError}. Set the airtime from the Scheduled streams list.`,
        });
      } else {
        toast.success("Show scheduled", {
          description: "Copy the stream key now: it is shown only once.",
        });
      }
      invalidateScheduleData();
      resetForm();
    },
    onError: (err) =>
      toast.error("Couldn't create stream", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  function handleCreate() {
    const t = title.trim();
    if (t.length < 3 || t.length > 200) {
      toast.error("Title must be 3-200 characters");
      return;
    }
    const sn = streamerName.trim();
    if (!sn) {
      toast.error("Streamer name is required");
      return;
    }
    if (!gameId) {
      toast.error("Pick a game");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      toast.error("Start date must be YYYY-MM-DD");
      return;
    }
    if (!/^\d{1,2}:\d{2}$/.test(startTime.trim())) {
      toast.error("Start time must be HH:MM");
      return;
    }
    // "T" join parses as device-local time, matching the ScheduleEditor input.
    const combined = new Date(
      `${startDate.trim()}T${startTime.trim().padStart(5, "0")}`,
    );
    if (Number.isNaN(combined.getTime())) {
      toast.error("Invalid start date or time");
      return;
    }
    const d = Number(duration);
    if (!Number.isFinite(d) || d < 1 || d > 1440) {
      toast.error("Duration must be 1-1440 minutes");
      return;
    }
    createMut.mutate({
      title: t,
      streamerName: sn,
      gameId,
      startAtIso: combined.toISOString(),
      durationMin: Math.round(d),
    });
  }

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    toast.success(`${label} copied`);
  };

  const formIncomplete =
    title.trim().length < 3 ||
    !streamerName.trim() ||
    !gameId ||
    !startDate.trim() ||
    !startTime.trim() ||
    !duration.trim();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <PageHeader
          title="Schedule"
          description="Program the channel guide: pick a day, manage airtimes, and put new shows on the air."
        />

        {/* Section 1: Guide */}
        <SectionTitle
          icon={CalendarRange}
          title="Guide"
          caption="Everything the public guide shows. Only streams are schedulable here: episodes and matches come from shows and events."
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row gap-2">
            {days.map((d) => (
              <DayChip
                key={d.iso}
                active={selectedDay === d.iso}
                label={d.label}
                sub={d.sub}
                onPress={() => setSelectedDay(d.iso)}
              />
            ))}
          </View>
        </ScrollView>

        {guideQ.isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#2CD7E3" />
          </View>
        ) : guideQ.isError ? (
          <Text className="py-6 text-center text-sm text-red-400">
            Failed to load the guide.{" "}
            {guideQ.error instanceof Error ? guideQ.error.message : ""}
          </Text>
        ) : (guideQ.data ?? []).length === 0 ? (
          <Text className="py-6 text-center text-sm text-muted-foreground">
            Nothing scheduled this day.
          </Text>
        ) : (
          (guideQ.data ?? []).map((row) => (
            <View
              key={row.id}
              className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
            >
              <View className="w-16">
                <Text
                  className="text-sm font-semibold text-foreground"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatTime(row.airsAt)}
                </Text>
                <Text className="text-[10px] text-muted-foreground">
                  {row.durationMin} min
                </Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-medium text-foreground"
                >
                  {row.title}
                </Text>
                {row.subtitle ? (
                  <Text
                    numberOfLines={1}
                    className="text-xs text-muted-foreground"
                  >
                    {row.subtitle}
                  </Text>
                ) : null}
                <View className="mt-1 flex-row items-center gap-2">
                  <KindBadge kind={row.kind} />
                  <StateBadge state={row.state} />
                </View>
              </View>
            </View>
          ))
        )}

        {/* Section 2: Scheduled streams */}
        <SectionTitle
          icon={CalendarClock}
          title="Scheduled streams"
          caption="Stream slots with a programmed airtime, matched against the 7-day guide window. Edit the airtime or unschedule."
          className="mt-8"
        />

        {streamsQ.isLoading || weekQ.isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#2CD7E3" />
          </View>
        ) : streamsQ.isError ? (
          <Text className="py-6 text-center text-sm text-red-400">
            Failed to load streams.{" "}
            {streamsQ.error instanceof Error ? streamsQ.error.message : ""}
          </Text>
        ) : scheduledRows.length === 0 ? (
          <Text className="py-6 text-center text-sm text-muted-foreground">
            No streams are scheduled yet. Create one below.
          </Text>
        ) : (
          scheduledRows.map(({ stream, startAt, durationMin }) => (
            <View
              key={stream.id}
              className="mb-2 rounded-xl border border-border bg-card/40 p-3"
            >
              <View className="flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-sm font-medium text-foreground"
                  >
                    {stream.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-xs text-muted-foreground"
                  >
                    {stream.streamerName}
                  </Text>
                </View>
                {stream.isLive ? (
                  <StatusBadge tone="red" dot>
                    LIVE
                  </StatusBadge>
                ) : null}
              </View>
              <Text
                className="mt-1.5 text-xs text-cyan-300"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatDayTime(startAt)} · {durationMin} min
              </Text>
              <View className="mt-2 flex-row gap-2">
                <Pressable
                  onPress={() => setEditing({ stream, startAt, durationMin })}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2"
                >
                  <Pencil size={12} color="#67e8f9" />
                  <Text className="text-xs font-semibold text-cyan-300">
                    Edit
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    scheduleMut.mutate({
                      id: stream.id,
                      scheduledStartAt: null,
                      scheduledDurationMin: null,
                    })
                  }
                  disabled={scheduleMut.isPending}
                  className="flex-1 items-center justify-center rounded-lg border border-border bg-card px-3 py-2"
                  style={{ opacity: scheduleMut.isPending ? 0.5 : 1 }}
                >
                  <Text className="text-xs font-medium text-muted-foreground">
                    Unschedule
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* Section 3: New scheduled show */}
        <SectionTitle
          icon={Plus}
          title="New scheduled show"
          caption="Creates an offline stream slot with a fresh ingest key and programs its airtime."
          className="mt-8"
        />

        {reveal ? (
          <View className="mb-3 rounded-xl border border-brand bg-brand/10 p-4">
            <View className="mb-2 flex-row items-center gap-2">
              <KeyRound size={14} color="#2CD7E3" />
              <Text className="text-sm font-bold text-brand">
                Copy the stream key now
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">
              &quot;{reveal.title}&quot; is on the guide. This key is shown only
              once: store it securely, then paste it into the encoder.
            </Text>

            <Text className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              Stream key
            </Text>
            <View className="mt-1 rounded-lg border border-border bg-background p-3">
              <Text className="font-mono text-xs text-foreground" selectable>
                {reveal.streamKey}
              </Text>
            </View>

            <Text className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              Ingest URL
            </Text>
            <View className="mt-1 rounded-lg border border-border bg-background p-3">
              <Text className="font-mono text-xs text-foreground" selectable>
                {reveal.ingestUrl}
              </Text>
            </View>

            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => handleCopy(reveal.streamKey, "Stream key")}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-md border border-brand bg-brand px-3 py-2"
              >
                <Copy size={14} color="#000000" />
                <Text className="text-sm font-semibold text-black">
                  Copy key
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleCopy(reveal.ingestUrl, "Ingest URL")}
                className="flex-row items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <Copy size={14} color="#FAFAFA" />
                <Text className="text-sm text-foreground">Copy URL</Text>
              </Pressable>
              <Pressable
                onPress={() => setReveal(null)}
                className="items-center justify-center rounded-md border border-border bg-card px-3 py-2"
              >
                <Text className="text-sm text-foreground">Done</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View className="rounded-xl border border-border bg-card/40 p-4">
          <Field label="Title">
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="EVO TV Prime Time"
              className="bg-card"
            />
          </Field>

          <Field label="Streamer name">
            <Input
              value={streamerName}
              onChangeText={setStreamerName}
              placeholder={DEFAULT_STREAMER}
              className="bg-card"
            />
          </Field>

          <Field label="Game">
            <Select value={gameId} onValueChange={setGameId}>
              <SelectTrigger className="bg-card">
                <SelectValue
                  placeholder={
                    gamesQ.isLoading ? "Loading games…" : "Select game"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(gamesQ.data ?? []).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Start date">
                <Input
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="bg-card"
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Start time">
                <Input
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:MM"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="bg-card"
                />
              </Field>
            </View>
          </View>

          <Field label="Duration (minutes)">
            <Input
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder={DEFAULT_DURATION}
              className="bg-card"
            />
          </Field>

          <Text className="mb-3 text-[11px] text-muted-foreground">
            Times are entered in your device timezone and stored as UTC.
          </Text>

          <Button
            disabled={formIncomplete || createMut.isPending}
            className="bg-cyan-500"
            onPress={handleCreate}
          >
            {createMut.isPending ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Plus size={14} color="#000000" />
            )}
            <Text className="text-sm font-medium text-black">
              {createMut.isPending ? "Scheduling…" : "Create and schedule"}
            </Text>
          </Button>
        </View>
      </ScrollView>

      {/* Edit airtime modal (Section 2) */}
      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <Pressable
          onPress={() => setEditing(null)}
          className="flex-1 justify-end bg-black/50"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="max-h-[90%] rounded-t-2xl border border-border bg-background"
          >
            {editing ? (
              <ScrollView
                contentContainerStyle={{ padding: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                <View className="mb-1 flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-semibold text-foreground">
                      {editing.stream.title}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {editing.stream.streamerName}
                    </Text>
                  </View>
                  <Pressable onPress={() => setEditing(null)} hitSlop={8}>
                    <X size={20} color="#A3A3A3" />
                  </Pressable>
                </View>

                <ScheduleEditorCard
                  initialStartAt={editing.startAt}
                  initialDurationMin={editing.durationMin}
                  isPending={scheduleMut.isPending}
                  onSave={(startAt, durationMin) =>
                    scheduleMut.mutate({
                      id: editing.stream.id,
                      scheduledStartAt: startAt,
                      scheduledDurationMin: durationMin,
                    })
                  }
                  onClear={() =>
                    scheduleMut.mutate({
                      id: editing.stream.id,
                      scheduledStartAt: null,
                      scheduledDurationMin: null,
                    })
                  }
                />
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/**
 * Shared copy of the ScheduleEditor in streams-manager-page.tsx (not exported
 * there, and that file is out of scope for this change). Same inputs, same
 * validation, same save/clear semantics - only the props differ: it takes the
 * resolved initial values instead of a full Stream, because admin list rows
 * don't carry schedule fields at runtime (see EpgScheduleInfo above).
 */
function ScheduleEditorCard({
  initialStartAt,
  initialDurationMin,
  isPending,
  onSave,
  onClear,
}: {
  initialStartAt: string | null;
  initialDurationMin: number | null;
  isPending: boolean;
  onSave: (startAt: string, durationMin: number) => void;
  onClear: () => void;
}) {
  const initial = initialStartAt
    ? toLocalDatetimeInputValue(initialStartAt)
    : "";
  const initialDuration = initialDurationMin ?? 60;
  const [startAt, setStartAt] = React.useState(initial);
  const [duration, setDuration] = React.useState(String(initialDuration));

  React.useEffect(() => {
    setStartAt(
      initialStartAt ? toLocalDatetimeInputValue(initialStartAt) : "",
    );
    setDuration(String(initialDurationMin ?? 60));
  }, [initialStartAt, initialDurationMin]);

  const dirty = startAt !== initial || duration !== String(initialDuration);
  const canSave = startAt.trim().length > 0 && Number(duration) > 0;

  return (
    <View className="mt-4 rounded-lg border border-border bg-card/40 p-3">
      <View className="mb-3 flex-row items-center gap-2">
        <CalendarClock size={14} color="#67e8f9" />
        <Text className="text-sm font-semibold text-foreground">
          EPG schedule
        </Text>
        {initialStartAt ? (
          <Text className="ml-auto text-[10px] uppercase tracking-wider text-cyan-400">
            Programmed
          </Text>
        ) : (
          <Text className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
            Unscheduled
          </Text>
        )}
      </View>

      <Text className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        Airs at (local time)
      </Text>
      <Input
        value={startAt}
        onChangeText={setStartAt}
        placeholder="YYYY-MM-DDTHH:mm"
        autoCapitalize="none"
        autoCorrect={false}
        className="mb-3 h-9"
      />

      <Text className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        Duration (minutes)
      </Text>
      <Input
        value={duration}
        onChangeText={setDuration}
        placeholder="60"
        keyboardType="numeric"
        className="mb-3 h-9"
      />

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => {
            const parsed = new Date(startAt);
            if (Number.isNaN(parsed.getTime())) {
              toast.error("Invalid date - use YYYY-MM-DDTHH:mm");
              return;
            }
            const d = Number(duration);
            if (!Number.isFinite(d) || d <= 0 || d > 1440) {
              toast.error("Duration must be 1-1440 minutes");
              return;
            }
            onSave(parsed.toISOString(), Math.round(d));
          }}
          disabled={!canSave || !dirty || isPending}
          className="flex-1 items-center rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2"
          style={{ opacity: !canSave || !dirty || isPending ? 0.5 : 1 }}
        >
          <Text className="text-xs font-semibold text-cyan-300">
            {isPending ? "Saving…" : "Save schedule"}
          </Text>
        </Pressable>
        {initialStartAt ? (
          <Pressable
            onPress={onClear}
            disabled={isPending}
            className="items-center rounded-lg border border-border bg-card px-3 py-2"
          >
            <Text className="text-xs font-medium text-muted-foreground">
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  caption,
  className,
}: {
  icon: LucideIcon;
  title: string;
  caption?: string;
  className?: string;
}) {
  return (
    <View className={`mb-3 ${className ?? ""}`}>
      <View className="flex-row items-center gap-2">
        <Icon size={14} color="#2CD7E3" />
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
      </View>
      {caption ? (
        <Text className="mt-0.5 text-xs text-muted-foreground">{caption}</Text>
      ) : null}
    </View>
  );
}

function DayChip({
  active,
  label,
  sub,
  onPress,
}: {
  active: boolean;
  label: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center rounded-lg border px-3 py-2 ${
        active ? "border-cyan-500 bg-cyan-500/10" : "border-border bg-card"
      }`}
      style={{ minWidth: 64 }}
    >
      <Text
        className={`text-xs font-semibold ${
          active ? "text-cyan-300" : "text-foreground"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`mt-0.5 text-[10px] ${
          active ? "text-cyan-400" : "text-muted-foreground"
        }`}
      >
        {sub}
      </Text>
    </Pressable>
  );
}

function KindBadge({ kind }: { kind: EpgRow["kind"] }) {
  if (kind === "live_stream") {
    return <StatusBadge tone="emerald">Stream</StatusBadge>;
  }
  if (kind === "episode") {
    return <StatusBadge tone="violet">Episode</StatusBadge>;
  }
  return <StatusBadge tone="blue">Match</StatusBadge>;
}

function StateBadge({ state }: { state: EpgRow["state"] }) {
  if (state === "live") {
    return (
      <StatusBadge tone="red" dot>
        LIVE
      </StatusBadge>
    );
  }
  if (state === "scheduled") {
    return <StatusBadge tone="amber">Scheduled</StatusBadge>;
  }
  return <StatusBadge tone="neutral">Aired</StatusBadge>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3">
      <Label className="mb-1.5 text-xs text-muted-foreground">{label}</Label>
      {children}
    </View>
  );
}

/** EPG live_stream rows carry watchUrl "/stream/<id>" and id "stream_<id>". */
function streamIdFromEpgRow(row: EpgRow): string | null {
  const marker = "/stream/";
  const idx = row.watchUrl.indexOf(marker);
  if (idx >= 0) {
    const id = row.watchUrl.slice(idx + marker.length).split(/[?#]/)[0];
    if (id) return id;
  }
  return row.id.startsWith("stream_")
    ? row.id.slice("stream_".length)
    : null;
}

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
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime() + i * 86_400_000);
    const label =
      i === 0
        ? "Today"
        : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString(undefined, { weekday: "short" });
    out.push({
      iso: isoDay(d),
      label,
      sub: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    });
  }
  return out;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} · ${formatTime(iso)}`;
}

/** ISO string to "YYYY-MM-DDTHH:mm" in local time for the input. */
function toLocalDatetimeInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
