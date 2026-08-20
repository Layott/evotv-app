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
  FileVideo,
  Film,
  HardDrive,
  KeyRound,
  Megaphone,
  Pencil,
  Plus,
  Upload,
  X,
  type Icon,
} from "@/components/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  adminCreateStream,
  adminUpdateStreamSchedule,
  listAdminStreams,
} from "@/lib/api/streams";
import { listGames } from "@/lib/api/games";
import {
  getPlayoutConfig,
  listPlayoutMedia,
  savePlayoutConfig,
  type PlayoutConfig,
  type PlayoutMediaFile,
} from "@/lib/api/playout";
import { pickAndUploadImage, uploadErrorMessage } from "@/lib/api/uploads";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
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
import { HowTo } from "./how-to";
import { StatusBadge } from "./status-badge";
import { timeAgo } from "./utils";

const DEFAULT_STREAMER = "EVO TV Channel";
const DEFAULT_DURATION = "60";
/** Rows rendered before the "search to narrow down" hint kicks in. */
const MEDIA_LIST_CAP = 30;

/**
 * Schedule info recovered from the public EPG. The current backend
 * GET /api/admin/streams select list DOES return scheduledStartAt,
 * scheduledDurationMin, and playoutFilePath, so this is a fallback for
 * older deploys whose select list omitted the schedule fields.
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

  // Form state (Section: New scheduled show).
  const [title, setTitle] = React.useState("");
  const [streamerName, setStreamerName] = React.useState(DEFAULT_STREAMER);
  const [gameId, setGameId] = React.useState("");
  const [startDate, setStartDate] = React.useState(todayIso);
  const [startTime, setStartTime] = React.useState("");
  const [duration, setDuration] = React.useState(DEFAULT_DURATION);
  const [thumbnailUrl, setThumbnailUrl] = React.useState("");
  const [uploadingThumb, setUploadingThumb] = React.useState(false);
  /** Office-PC media file the new show should play out. Optional. */
  const [playoutFilePath, setPlayoutFilePath] = React.useState<string | null>(
    null,
  );

  // Copy day (Section: Scheduled streams). Source defaults to the guide's
  // selected day, target to the day after; both re-seed when the chip changes.
  const [copySource, setCopySource] = React.useState(todayIso);
  const [copyTarget, setCopyTarget] = React.useState(() =>
    addDaysIso(todayIso, 1),
  );
  const [copying, setCopying] = React.useState(false);
  const [copyProgress, setCopyProgress] = React.useState({ done: 0, total: 0 });
  React.useEffect(() => {
    setCopySource(selectedDay);
    setCopyTarget(addDaysIso(selectedDay, 1));
  }, [selectedDay]);

  // Playout-PC media search (Section: Files on the playout PC).
  const [mediaSearch, setMediaSearch] = React.useState("");
  const [debouncedMediaSearch, setDebouncedMediaSearch] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedMediaSearch(mediaSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [mediaSearch]);

  // Filler + ad config (Section: Filler and ad breaks). Hydrated once from
  // the server, then edited locally until saved.
  const [fillerFiles, setFillerFiles] = React.useState<string[]>([]);
  const [adFiles, setAdFiles] = React.useState<string[]>([]);
  const [configHydrated, setConfigHydrated] = React.useState(false);

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

  const mediaQ = useQuery({
    queryKey: ["playout-media", debouncedMediaSearch],
    queryFn: () => listPlayoutMedia(debouncedMediaSearch || undefined),
    staleTime: 30_000,
  });

  const configQ = useQuery({
    queryKey: ["playout-config"],
    queryFn: getPlayoutConfig,
    staleTime: 30_000,
  });

  React.useEffect(() => {
    if (configQ.data && !configHydrated) {
      setFillerFiles(configQ.data.fillerFiles);
      setAdFiles(configQ.data.adFiles);
      setConfigHydrated(true);
    }
  }, [configQ.data, configHydrated]);

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

  /**
   * Copy-day source rows: non-deleted admin streams whose scheduledStartAt
   * lands on the source date in DEVICE-LOCAL time - the same local framing
   * the new-show form uses when it composes `${date}T${time}`.
   */
  const copySourceRows = React.useMemo<Stream[]>(() => {
    const src = parseLocalDay(copySource);
    if (!src) return [];
    const srcIso = isoDay(src);
    const rows = (streamsQ.data?.streams ?? []).filter(
      (s) =>
        !s.deletedAt &&
        !!s.scheduledStartAt &&
        isoDay(new Date(s.scheduledStartAt)) === srcIso,
    );
    rows.sort((a, b) =>
      (a.scheduledStartAt ?? "").localeCompare(b.scheduledStartAt ?? ""),
    );
    return rows;
  }, [streamsQ.data, copySource]);

  const copyDateError = React.useMemo<string | null>(() => {
    const src = parseLocalDay(copySource);
    if (!src) return "Source date must be a valid YYYY-MM-DD.";
    const tgt = parseLocalDay(copyTarget);
    if (!tgt) return "Target date must be a valid YYYY-MM-DD.";
    if (isoDay(src) === isoDay(tgt)) {
      return "Target day must be different from the source day.";
    }
    return null;
  }, [copySource, copyTarget]);

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
    setThumbnailUrl("");
    setPlayoutFilePath(null);
  }, [todayIso]);

  /** "Schedule" on a playout-PC file: prefill the new-show form below. */
  const prefillFromFile = React.useCallback((file: PlayoutMediaFile) => {
    setTitle(titleFromFileName(file.fileName));
    if (file.durationSec && file.durationSec > 0) {
      setDuration(String(Math.max(1, Math.ceil(file.durationSec / 60))));
    }
    setPlayoutFilePath(file.filePath);
    toast.success("File attached to the form", {
      description:
        "Scroll to New scheduled show, set the airtime, then create.",
    });
  }, []);

  async function handleUploadThumbnail() {
    try {
      setUploadingThumb(true);
      const url = await pickAndUploadImage();
      if (url) setThumbnailUrl(url);
    } catch (err) {
      toast.error("Upload failed", { description: uploadErrorMessage(err) });
    } finally {
      setUploadingThumb(false);
    }
  }

  const createMut = useMutation({
    mutationFn: async (args: {
      title: string;
      streamerName: string;
      gameId: string;
      startAtIso: string;
      durationMin: number;
      thumbnailUrl: string | null;
      playoutFilePath: string | null;
    }) => {
      const created = await adminCreateStream({
        title: args.title,
        gameId: args.gameId,
        streamerName: args.streamerName,
      });
      // Schedule (plus thumbnail and playout file, when set) in a second
      // call - POST /api/admin/streams has none of those fields. If this
      // PATCH fails we still surface the one-time key.
      let scheduleError: string | null = null;
      try {
        await adminUpdateStreamSchedule(created.id, {
          scheduledStartAt: args.startAtIso,
          scheduledDurationMin: args.durationMin,
          ...(args.thumbnailUrl ? { thumbnailUrl: args.thumbnailUrl } : {}),
          ...(args.playoutFilePath
            ? { playoutFilePath: args.playoutFilePath }
            : {}),
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
      thumbnailUrl: thumbnailUrl || null,
      playoutFilePath,
    });
  }

  /**
   * Copy day: clone every source-day stream onto the target day at the same
   * local wall-clock time. Sequential on purpose - each copy is a create
   * (fresh stream key) plus a schedule PATCH, and ordering keeps progress
   * honest. Rows that already exist on the target (same title, same minute)
   * are skipped so re-runs never double up. Failures don't stop the loop.
   */
  async function handleCopyDay() {
    if (copying) return;
    if (copyDateError) {
      toast.error(copyDateError);
      return;
    }
    const target = parseLocalDay(copyTarget);
    if (!target) return;
    const sourceRows = copySourceRows;
    if (sourceRows.length === 0) return;

    // Snapshot what already airs on the target day for the skip guard.
    const targetIso = isoDay(target);
    const existingOnTarget = (streamsQ.data?.streams ?? []).filter(
      (s) =>
        !s.deletedAt &&
        !!s.scheduledStartAt &&
        isoDay(new Date(s.scheduledStartAt)) === targetIso,
    );

    setCopying(true);
    setCopyProgress({ done: 0, total: sourceRows.length });
    let copied = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (let i = 0; i < sourceRows.length; i++) {
      const src = sourceRows[i];
      setCopyProgress({ done: i, total: sourceRows.length });
      const srcStart = new Date(src.scheduledStartAt as string);
      // Same local wall-clock time, target calendar day.
      const targetStart = new Date(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
        srcStart.getHours(),
        srcStart.getMinutes(),
        srcStart.getSeconds(),
      );
      const alreadyThere = existingOnTarget.some(
        (e) =>
          e.title.trim() === src.title.trim() &&
          sameMinute(new Date(e.scheduledStartAt as string), targetStart),
      );
      if (alreadyThere) {
        skipped++;
        continue;
      }
      try {
        const created = await adminCreateStream({
          title: src.title,
          gameId: src.gameId,
          streamerName: src.streamerName,
          ...(src.streamerAvatarUrl
            ? { streamerAvatarUrl: src.streamerAvatarUrl }
            : {}),
          ...(src.language ? { language: src.language } : {}),
          ...(src.tags?.length ? { tags: src.tags } : {}),
          isPremium: src.isPremium,
          ...(src.maturityRating
            ? { maturityRating: src.maturityRating }
            : {}),
          ...(src.contentTags?.length
            ? { contentTags: src.contentTags }
            : {}),
        });
        await adminUpdateStreamSchedule(created.id, {
          scheduledStartAt: targetStart.toISOString(),
          scheduledDurationMin: src.scheduledDurationMin ?? 60,
          ...(src.playoutFilePath
            ? { playoutFilePath: src.playoutFilePath }
            : {}),
          ...(src.thumbnailUrl ? { thumbnailUrl: src.thumbnailUrl } : {}),
        });
        copied++;
      } catch (err) {
        failures.push(err instanceof Error ? err.message : "Unknown error");
      }
    }

    setCopying(false);
    invalidateScheduleData();
    if (copied > 0 || skipped > 0) {
      toast.success(
        `Copied ${copied} show${copied === 1 ? "" : "s"} to ${friendlyDay(copyTarget)}` +
          (skipped > 0 ? `, ${skipped} skipped (already there)` : ""),
      );
    }
    if (failures.length > 0) {
      toast.error(
        `${failures.length} of ${sourceRows.length} shows failed to copy`,
        { description: failures[0] },
      );
    }
  }

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    toast.success(`${label} copied`);
  };

  const configMut = useMutation({
    mutationFn: (config: PlayoutConfig) => savePlayoutConfig(config),
    onSuccess: (saved) => {
      // Echoed server state is the new baseline.
      setFillerFiles(saved.fillerFiles);
      setAdFiles(saved.adFiles);
      toast.success("Playout config saved", {
        description: "The office playout box picks it up automatically.",
      });
      void queryClient.invalidateQueries({ queryKey: ["playout-config"] });
    },
    onError: (err) =>
      toast.error("Couldn't save playout config", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const configDirty = React.useMemo(() => {
    if (!configQ.data) return false;
    return (
      !sameStringArray(fillerFiles, configQ.data.fillerFiles) ||
      !sameStringArray(adFiles, configQ.data.adFiles)
    );
  }, [configQ.data, fillerFiles, adFiles]);

  const addConfigFile = React.useCallback(
    (kind: "filler" | "ad", filePath: string) => {
      const [list, set] =
        kind === "filler"
          ? ([fillerFiles, setFillerFiles] as const)
          : ([adFiles, setAdFiles] as const);
      if (list.includes(filePath)) return;
      if (list.length >= 100) {
        toast.error("Limit reached", { description: "Max 100 files per list." });
        return;
      }
      set([...list, filePath]);
    },
    [fillerFiles, adFiles],
  );

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
        <HowTo page="schedule" />

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
            <ActivityIndicator color="#46E3CE" />
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

        {/* Section 2: Files on the playout PC */}
        <SectionTitle
          icon={HardDrive}
          title="Files on the playout PC"
          caption="Media the office playout box has reported. Tap Schedule to prefill the new-show form with a file: at airtime the office PC plays it out automatically."
          className="mt-8"
        />

        <Input
          value={mediaSearch}
          onChangeText={setMediaSearch}
          placeholder="Search files…"
          autoCapitalize="none"
          autoCorrect={false}
          className="mb-3 bg-card"
        />

        {mediaQ.isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#46E3CE" />
          </View>
        ) : mediaQ.isError ? (
          <Text className="py-6 text-center text-sm text-red-400">
            Failed to load playout files.{" "}
            {mediaQ.error instanceof Error ? mediaQ.error.message : ""}
          </Text>
        ) : (mediaQ.data?.files ?? []).length === 0 ? (
          <Text className="py-6 text-center text-sm text-muted-foreground">
            {debouncedMediaSearch
              ? "No files match your search."
              : "No files reported from the playout PC yet. Start the office media agent and they appear here."}
          </Text>
        ) : (
          <>
            {(mediaQ.data?.files ?? []).slice(0, MEDIA_LIST_CAP).map((f) => (
              <View
                key={f.id}
                className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
              >
                <View className="min-w-0 flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-sm font-semibold text-foreground"
                  >
                    {f.fileName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-[11px] text-muted-foreground"
                  >
                    {f.filePath}
                  </Text>
                  <Text
                    className="mt-0.5 text-[11px] text-muted-foreground"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {mediaMetaLine(f)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => prefillFromFile(f)}
                  className="flex-row items-center gap-1.5 rounded-lg bg-cyan-500/20 bg-cyan-500/15 px-3 py-2"
                >
                  <CalendarClock size={12} color="#67e8f9" />
                  <Text className="text-xs font-semibold text-cyan-300">
                    Schedule
                  </Text>
                </Pressable>
              </View>
            ))}
            {(mediaQ.data?.files ?? []).length > MEDIA_LIST_CAP ? (
              <Text className="mb-2 text-center text-[11px] text-muted-foreground">
                {(mediaQ.data?.files ?? []).length - MEDIA_LIST_CAP} more files.
                Search to narrow down.
              </Text>
            ) : null}
          </>
        )}

        {/* Section 3: Scheduled streams */}
        <SectionTitle
          icon={CalendarClock}
          title="Scheduled streams"
          caption="Stream slots with a programmed airtime, matched against the 7-day guide window. Edit the airtime or unschedule."
          className="mt-8"
        />

        {streamsQ.isLoading || weekQ.isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#46E3CE" />
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
              {stream.playoutFilePath ? (
                <View className="mt-1.5 flex-row items-center gap-1 self-start rounded-full border border-border bg-card px-2 py-0.5">
                  <FileVideo size={10} color="#9FBDBD" />
                  <Text
                    numberOfLines={1}
                    className="max-w-[220px] text-[10px] text-muted-foreground"
                  >
                    {basename(stream.playoutFilePath)}
                  </Text>
                </View>
              ) : null}
              <View className="mt-2 flex-row gap-2">
                <Pressable
                  onPress={() => setEditing({ stream, startAt, durationMin })}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg bg-cyan-500/20 bg-cyan-500/15 px-3 py-2"
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

        {/* Copy day: duplicate one day's stream shows onto another day. */}
        <View className="mt-2 rounded-xl border border-border bg-card/40 p-4">
          <View className="flex-row items-center gap-2">
            <Copy size={14} color="#67e8f9" />
            <Text className="text-sm font-semibold text-foreground">
              Copy day
            </Text>
          </View>
          <Text className="mb-3 mt-0.5 text-xs text-muted-foreground">
            Duplicates one day&apos;s stream shows onto another day at the same
            times. Only stream shows are copied: episodes and matches in the
            guide come from shows and events and are not duplicated. Copies get
            their own stream keys.
          </Text>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Source date">
                <Input
                  value={copySource}
                  onChangeText={setCopySource}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="bg-card"
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Target date">
                <Input
                  value={copyTarget}
                  onChangeText={setCopyTarget}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="bg-card"
                />
              </Field>
            </View>
          </View>

          {copyDateError ? (
            <Text className="mb-3 text-xs text-red-400">{copyDateError}</Text>
          ) : copySourceRows.length === 0 ? (
            <Text className="mb-3 text-xs text-muted-foreground">
              Nothing scheduled on that day.
            </Text>
          ) : (
            <Text className="mb-3 text-xs text-cyan-300">
              {copySourceRows.length} scheduled show
              {copySourceRows.length === 1 ? "" : "s"} on{" "}
              {friendlyDay(copySource)}
            </Text>
          )}

          <Button
            disabled={
              copying ||
              !!copyDateError ||
              copySourceRows.length === 0 ||
              streamsQ.isLoading
            }
            className="bg-cyan-500"
            onPress={handleCopyDay}
          >
            {copying ? (
              <ActivityIndicator size="small" color="#05191B" />
            ) : (
              <Copy size={14} color="#05191B" />
            )}
            <Text className="text-sm font-medium text-black">
              {copying
                ? `Copying ${Math.min(copyProgress.done + 1, copyProgress.total)}/${copyProgress.total}…`
                : "Duplicate day"}
            </Text>
          </Button>
        </View>

        {/* Section 4: New scheduled show */}
        <SectionTitle
          icon={Plus}
          title="New scheduled show"
          caption="Creates an offline stream slot with a fresh ingest key and programs its airtime."
          className="mt-8"
        />

        {reveal ? (
          <View className="mb-3 rounded-xl bg-brand/20 p-4">
            <View className="mb-2 flex-row items-center gap-2">
              <KeyRound size={14} color="#46E3CE" />
              <Text className="text-sm font-bold text-brand">
                Copy the stream key now
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">
              &quot;{reveal.title}&quot; is on the guide. This key is shown only
              once: store it securely, then paste it into the encoder.
            </Text>

            <Text className="mt-3 text-[11px] text-muted-foreground">
              Stream key
            </Text>
            <View className="mt-1 rounded-lg border border-border bg-background p-3">
              <Text className="font-mono text-xs text-foreground" selectable>
                {reveal.streamKey}
              </Text>
            </View>

            <Text className="mt-3 text-[11px] text-muted-foreground">
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
                className="flex-1 flex-row items-center justify-center gap-2 rounded-md bg-brand px-3 py-2"
              >
                <Copy size={14} color="#05191B" />
                <Text className="text-sm font-semibold text-black">
                  Copy key
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleCopy(reveal.ingestUrl, "Ingest URL")}
                className="flex-row items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <Copy size={14} color="#EAF6F5" />
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
          {playoutFilePath ? (
            <View className="mb-3">
              <View className="flex-row items-center gap-2 self-start rounded-full bg-cyan-500/25 py-1.5 pl-3 pr-2">
                <FileVideo size={12} color="#67e8f9" />
                <Text
                  numberOfLines={1}
                  className="max-w-[220px] text-xs font-medium text-cyan-300"
                >
                  {basename(playoutFilePath)}
                </Text>
                <Pressable
                  onPress={() => setPlayoutFilePath(null)}
                  hitSlop={8}
                >
                  <X size={12} color="#67e8f9" />
                </Pressable>
              </View>
              <Text className="mt-1 text-[11px] text-muted-foreground">
                The office PC plays this file out at the scheduled time.
              </Text>
            </View>
          ) : null}

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

          <Field label="Thumbnail (optional)">
            {thumbnailUrl ? (
              <View className="mb-2 flex-row items-center gap-3">
                <View
                  className="overflow-hidden rounded-md border border-border bg-card"
                  style={{ height: 72, width: 128 }}
                >
                  <ImageWithFallback
                    source={thumbnailUrl}
                    tintSeed={thumbnailUrl}
                  />
                </View>
                <Pressable
                  onPress={() => setThumbnailUrl("")}
                  hitSlop={8}
                  className="flex-row items-center gap-1"
                >
                  <X size={14} color="#F87171" />
                  <Text className="text-xs font-medium text-red-400">
                    Remove
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <Pressable
              onPress={handleUploadThumbnail}
              disabled={uploadingThumb}
              className={`flex-row items-center justify-center gap-2 rounded-md bg-card px-3 py-2.5 ${
                uploadingThumb ? "opacity-60" : ""
              }`}
            >
              {uploadingThumb ? (
                <ActivityIndicator size="small" color="#46E3CE" />
              ) : (
                <Upload size={14} color="#46E3CE" />
              )}
              <Text className="text-sm text-foreground">
                {uploadingThumb
                  ? "Uploading…"
                  : thumbnailUrl
                    ? "Replace thumbnail"
                    : "Upload thumbnail"}
              </Text>
            </Pressable>
          </Field>

          <Text className="mb-3 text-[11px] text-muted-foreground">
            Times are entered in your device timezone and stored as UTC.
          </Text>

          <Button
            disabled={formIncomplete || createMut.isPending || uploadingThumb}
            className="bg-cyan-500"
            onPress={handleCreate}
          >
            {createMut.isPending ? (
              <ActivityIndicator size="small" color="#05191B" />
            ) : (
              <Plus size={14} color="#05191B" />
            )}
            <Text className="text-sm font-medium text-black">
              {createMut.isPending ? "Scheduling…" : "Create and schedule"}
            </Text>
          </Button>
        </View>

        {/* Section 5: Filler and ad breaks */}
        <SectionTitle
          icon={Film}
          title="Filler and ad breaks"
          caption="Filler files loop in the gaps between scheduled shows. Ad files rotate during ad breaks. The office playout box pulls this config automatically."
          className="mt-8"
        />

        {configQ.isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#46E3CE" />
          </View>
        ) : configQ.isError ? (
          <Text className="py-6 text-center text-sm text-red-400">
            Failed to load the playout config.{" "}
            {configQ.error instanceof Error ? configQ.error.message : ""}
          </Text>
        ) : (
          <>
            <ConfigFileBlock
              icon={Film}
              title="Filler content"
              caption="Loops whenever nothing is scheduled."
              selected={fillerFiles}
              files={mediaQ.data?.files ?? []}
              mediaLoading={mediaQ.isLoading}
              searchActive={debouncedMediaSearch.length > 0}
              onAdd={(p) => addConfigFile("filler", p)}
              onRemove={(p) =>
                setFillerFiles((prev) => prev.filter((x) => x !== p))
              }
            />
            <ConfigFileBlock
              icon={Megaphone}
              title="Ad spots"
              caption="Rotate during ad breaks."
              selected={adFiles}
              files={mediaQ.data?.files ?? []}
              mediaLoading={mediaQ.isLoading}
              searchActive={debouncedMediaSearch.length > 0}
              onAdd={(p) => addConfigFile("ad", p)}
              onRemove={(p) =>
                setAdFiles((prev) => prev.filter((x) => x !== p))
              }
            />

            <Button
              disabled={!configDirty || configMut.isPending}
              className="bg-cyan-500"
              onPress={() => configMut.mutate({ fillerFiles, adFiles })}
            >
              {configMut.isPending ? (
                <ActivityIndicator size="small" color="#05191B" />
              ) : null}
              <Text className="text-sm font-medium text-black">
                {configMut.isPending ? "Saving…" : "Save playout config"}
              </Text>
            </Button>
            {configDirty ? (
              <Text className="mt-2 text-center text-[11px] text-amber-400">
                Unsaved changes.
              </Text>
            ) : null}
          </>
        )}
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
                    <X size={20} color="#9FBDBD" />
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
          <Text className="ml-auto text-[10px] text-cyan-400">
            Programmed
          </Text>
        ) : (
          <Text className="ml-auto text-[10px] text-muted-foreground">
            Unscheduled
          </Text>
        )}
      </View>

      <Text className="mb-1 text-[11px] text-muted-foreground">
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

      <Text className="mb-1 text-[11px] text-muted-foreground">
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
          className="flex-1 items-center rounded-lg bg-cyan-500/20 bg-cyan-500/15 px-3 py-2"
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

/**
 * One half of the "Filler and ad breaks" section: chips of the currently
 * selected file paths plus an inline "Add from PC files" picker fed by the
 * shared playout-media query (so the Section 2 search also filters it).
 */
function ConfigFileBlock({
  icon: Icon,
  title,
  caption,
  selected,
  files,
  mediaLoading,
  searchActive,
  onAdd,
  onRemove,
}: {
  icon: Icon;
  title: string;
  caption: string;
  selected: string[];
  files: PlayoutMediaFile[];
  mediaLoading: boolean;
  searchActive: boolean;
  onAdd: (filePath: string) => void;
  onRemove: (filePath: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const available = files.filter((f) => !selected.includes(f.filePath));

  return (
    <View className="mb-3 rounded-xl border border-border bg-card/40 p-3">
      <View className="flex-row items-center gap-2">
        <Icon size={14} color="#67e8f9" />
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="ml-auto text-[11px] text-muted-foreground">
          {selected.length} selected
        </Text>
      </View>
      <Text className="mt-0.5 text-xs text-muted-foreground">{caption}</Text>

      {selected.length === 0 ? (
        <Text className="mt-3 text-xs text-muted-foreground">
          None selected yet.
        </Text>
      ) : (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {selected.map((p) => (
            <View
              key={p}
              className="flex-row items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5"
            >
              <Text
                numberOfLines={1}
                className="max-w-[180px] text-xs text-foreground"
              >
                {basename(p)}
              </Text>
              <Pressable onPress={() => onRemove(p)} hitSlop={8}>
                <X size={12} color="#9FBDBD" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => setPickerOpen((v) => !v)}
        className="mt-3 flex-row items-center justify-center gap-1.5 rounded-md bg-card px-3 py-2"
      >
        {pickerOpen ? (
          <X size={12} color="#46E3CE" />
        ) : (
          <Plus size={12} color="#46E3CE" />
        )}
        <Text className="text-xs font-medium text-foreground">
          {pickerOpen ? "Close picker" : "Add from PC files"}
        </Text>
      </Pressable>

      {pickerOpen ? (
        <View className="mt-2 rounded-lg border border-border bg-background p-2">
          {searchActive ? (
            <Text className="mb-1 px-1 text-[10px] text-muted-foreground">
              Filtered by the search in Files on the playout PC.
            </Text>
          ) : null}
          {mediaLoading ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#46E3CE" />
            </View>
          ) : available.length === 0 ? (
            <Text className="py-3 text-center text-xs text-muted-foreground">
              {files.length === 0
                ? "No files reported from the playout PC yet."
                : "Every reported file is already selected."}
            </Text>
          ) : (
            available.slice(0, MEDIA_LIST_CAP).map((f) => (
              <Pressable
                key={f.id}
                onPress={() => onAdd(f.filePath)}
                className="flex-row items-center gap-2 rounded-md px-2 py-2"
              >
                <Plus size={12} color="#67e8f9" />
                <View className="min-w-0 flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-xs font-medium text-foreground"
                  >
                    {f.fileName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-[10px] text-muted-foreground"
                  >
                    {mediaMetaLine(f)}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
          {available.length > MEDIA_LIST_CAP ? (
            <Text className="py-1 text-center text-[10px] text-muted-foreground">
              {available.length - MEDIA_LIST_CAP} more files. Search above to
              narrow down.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  caption,
  className,
}: {
  icon: Icon;
  title: string;
  caption?: string;
  className?: string;
}) {
  return (
    <View className={`mb-3 ${className ?? ""}`}>
      <View className="flex-row items-center gap-2">
        <Icon size={14} color="#46E3CE" />
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
    return <StatusBadge tone="neutral">Episode</StatusBadge>;
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

/**
 * "YYYY-MM-DD" -> local-midnight Date, or null when malformed. The "T00:00"
 * join parses device-local, matching the new-show form's datetime composing.
 */
function parseLocalDay(day: string): Date | null {
  const trimmed = day.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "2026-06-12" + 1 -> "2026-06-13" (local calendar; DST-safe via setDate). */
function addDaysIso(day: string, days: number): string {
  const d = parseLocalDay(day);
  if (!d) return day;
  d.setDate(d.getDate() + days);
  return isoDay(d);
}

/** "2026-06-13" -> "Sat, Jun 13" in the device locale. */
function friendlyDay(day: string): string {
  const d = parseLocalDay(day);
  if (!d) return day;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Minute-precision instant equality for the copy-day skip guard. */
function sameMinute(a: Date, b: Date): boolean {
  return Math.floor(a.getTime() / 60_000) === Math.floor(b.getTime() / 60_000);
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

/** Path tail: "D:\\media\\shows\\ep1.mp4" or "/srv/media/ep1.mp4" -> "ep1.mp4". */
function basename(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
}

/** "evo_prime-time.S01E02.mp4" -> "evo prime time S01E02". */
function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[A-Za-z0-9]{1,5}$/, "");
  const cleaned = base.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || fileName;
}

/** Seconds -> "m:ss" or "h:mm:ss". */
function formatDurationSec(sec: number): string {
  const total = Math.max(0, Math.round(sec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** "12:34 · 812.5 MB · seen 3m ago" - skips parts the agent didn't report. */
function mediaMetaLine(f: PlayoutMediaFile): string {
  const parts: string[] = [];
  if (f.durationSec !== null && f.durationSec > 0) {
    parts.push(formatDurationSec(f.durationSec));
  }
  if (f.sizeMb !== null && f.sizeMb > 0) {
    parts.push(`${f.sizeMb.toFixed(1)} MB`);
  }
  parts.push(`seen ${timeAgo(f.lastSeenAt)}`);
  return parts.join(" · ");
}

function sameStringArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** ISO string to "YYYY-MM-DDTHH:mm" in local time for the input. */
function toLocalDatetimeInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
