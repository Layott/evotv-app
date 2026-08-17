import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import {
  CalendarClock,
  Film,
  Image as ImageIcon,
  Radio,
  RotateCcw,
  Search,
  Upload,
  X,
  Square,
  Trash2,
} from "@/components/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  adminDeleteStream,
  adminForceEndStream,
  adminRestoreStream,
  adminUpdateStreamSchedule,
  listAdminStreams,
} from "@/lib/api/streams";
import { listGames } from "@/lib/api/games";
import { listEvents } from "@/lib/api/events";
import { listPlayoutMedia } from "@/lib/api/playout";
import { pickAndUploadImage, uploadErrorMessage } from "@/lib/api/uploads";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import type { Stream } from "@/lib/types";

import { Input } from "@/components/ui/input";

import type { MaturityRating } from "@/lib/types";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { ContentTagsEditor, MaturityEditor } from "./content-meta-editors";
import { formatCompact, timeAgo } from "./utils";

export function StreamsManagerPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [gameFilter, setGameFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "live" | "offline" | "deleted"
  >("all");
  const [selected, setSelected] = React.useState<Stream | null>(null);

  const forceEndMut = useMutation({
    mutationFn: (stream: Stream) =>
      adminForceEndStream(stream.id, "Admin force-end from console"),
    onSuccess: () => {
      toast.success("Stream ended");
      queryClient.invalidateQueries({ queryKey: ["admin-streams"] });
      setSelected(null);
    },
    onError: (err) =>
      toast.error("Couldn't end stream", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const deleteMut = useMutation({
    mutationFn: (stream: Stream) => adminDeleteStream(stream.id),
    onSuccess: () => {
      toast.success("Stream deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-streams"] });
      setSelected(null);
    },
    onError: (err) =>
      toast.error("Couldn't delete stream", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const restoreMut = useMutation({
    mutationFn: (stream: Stream) => adminRestoreStream(stream.id),
    onSuccess: () => {
      toast.success("Stream restored");
      queryClient.invalidateQueries({ queryKey: ["admin-streams"] });
      setSelected(null);
    },
    onError: (err) =>
      toast.error("Couldn't restore stream", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

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
    onSuccess: () => {
      toast.success("Schedule updated");
      queryClient.invalidateQueries({ queryKey: ["admin-streams"] });
    },
    onError: (err) =>
      toast.error("Couldn't update schedule", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const hlsMut = useMutation({
    mutationFn: (args: { id: string; hlsUrl: string | null }) =>
      adminUpdateStreamSchedule(args.id, { hlsUrl: args.hlsUrl }),
    onSuccess: () => {
      toast.success("Playback URL updated");
      queryClient.invalidateQueries({ queryKey: ["admin-streams"] });
    },
    onError: (err) =>
      toast.error("Couldn't update playback URL", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const thumbnailMut = useMutation({
    mutationFn: (args: { id: string; thumbnailUrl: string }) =>
      adminUpdateStreamSchedule(args.id, { thumbnailUrl: args.thumbnailUrl }),
    onSuccess: (_res, args) => {
      toast.success("Thumbnail updated");
      queryClient.invalidateQueries({ queryKey: ["admin-streams"] });
      setSelected((prev) =>
        prev && prev.id === args.id
          ? { ...prev, thumbnailUrl: args.thumbnailUrl }
          : prev,
      );
    },
    onError: (err) =>
      toast.error("Couldn't update thumbnail", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const playoutMut = useMutation({
    mutationFn: (args: { id: string; playoutFilePath: string | null }) =>
      adminUpdateStreamSchedule(args.id, {
        playoutFilePath: args.playoutFilePath,
      }),
    onSuccess: () => {
      toast.success("Playout file updated");
      queryClient.invalidateQueries({ queryKey: ["admin-streams"] });
    },
    onError: (err) =>
      toast.error("Couldn't set playout file", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const maturityMut = useMutation({
    mutationFn: (args: { id: string; maturityRating: MaturityRating | null }) =>
      adminUpdateStreamSchedule(args.id, {
        maturityRating: args.maturityRating,
      }),
    onSuccess: (_res, args) => {
      toast.success("Maturity rating updated");
      queryClient.invalidateQueries({ queryKey: ["admin-streams"] });
      setSelected((prev) =>
        prev && prev.id === args.id
          ? { ...prev, maturityRating: args.maturityRating ?? undefined }
          : prev,
      );
    },
    onError: (err) =>
      toast.error("Couldn't set maturity rating", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const tagsMut = useMutation({
    mutationFn: (args: { id: string; contentTags: string[] }) =>
      adminUpdateStreamSchedule(args.id, { contentTags: args.contentTags }),
    onSuccess: (_res, args) => {
      toast.success("Content tags updated");
      queryClient.invalidateQueries({ queryKey: ["admin-streams"] });
      setSelected((prev) =>
        prev && prev.id === args.id
          ? { ...prev, contentTags: args.contentTags }
          : prev,
      );
    },
    onError: (err) =>
      toast.error("Couldn't set content tags", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const handleForceEnd = React.useCallback((stream: Stream) => {
    Alert.alert(
      "End live stream?",
      `This will immediately disconnect "${stream.title}" and notify viewers.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End now",
          style: "destructive",
          onPress: () => forceEndMut.mutate(stream),
        },
      ],
    );
  }, [forceEndMut]);

  const handleDelete = React.useCallback((stream: Stream) => {
    Alert.alert(
      "Delete stream?",
      `Soft-deletes "${stream.title}" - it disappears from all public lists. Recoverable within 30 days.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMut.mutate(stream),
        },
      ],
    );
  }, [deleteMut]);

  const gamesQ = useQuery({
    queryKey: ["admin", "games"],
    queryFn: listGames,
    staleTime: 60_000,
  });
  const eventsQ = useQuery({
    queryKey: ["admin", "events"],
    queryFn: () => listEvents(),
    staleTime: 60_000,
  });
  const streamsQ = useQuery({
    queryKey: ["admin-streams", gameFilter, statusFilter],
    queryFn: () =>
      listAdminStreams({
        gameId: gameFilter === "all" ? undefined : gameFilter,
        isLive:
          statusFilter === "live"
            ? true
            : statusFilter === "offline"
              ? false
              : undefined,
        deleted: statusFilter === "deleted" ? "only" : undefined,
        limit: 200,
      }),
    staleTime: 30_000,
  });

  const games = gamesQ.data ?? [];
  const events = eventsQ.data ?? [];
  const streams = streamsQ.data?.streams ?? [];

  const filtered = React.useMemo(() => {
    if (!search.trim()) return streams;
    const q = search.toLowerCase();
    return streams.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.streamerName.toLowerCase().includes(q),
    );
  }, [streams, search]);

  function resolveGameName(id: string) {
    return games.find((g) => g.id === id)?.shortName ?? id;
  }
  function resolveEventTitle(id: string | null) {
    if (!id) return null;
    return events.find((e) => e.id === id)?.title ?? null;
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Streams"
          description="Read-only browse - stream keys + create + rotate via dedicated screens later."
        />

        <View className="mb-3 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
            <Search size={14} color="#9FBDBD" />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search title or streamer"
              className="h-9 flex-1 border-0 bg-transparent px-0"
            />
          </View>
        </View>

        <View className="mb-3 flex-row items-center gap-2">
          <FilterPill
            label="All"
            active={statusFilter === "all"}
            onPress={() => setStatusFilter("all")}
          />
          <FilterPill
            label="Live"
            active={statusFilter === "live"}
            onPress={() => setStatusFilter("live")}
          />
          <FilterPill
            label="Offline"
            active={statusFilter === "offline"}
            onPress={() => setStatusFilter("offline")}
          />
          <FilterPill
            label="Deleted"
            active={statusFilter === "deleted"}
            onPress={() => setStatusFilter("deleted")}
          />
          <Text className="ml-auto text-xs text-muted-foreground">
            {filtered.length}
            {streamsQ.data?.total && filtered.length !== streamsQ.data.total
              ? ` of ${streamsQ.data.total}`
              : ""}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row gap-2">
            <FilterPill
              label="All games"
              active={gameFilter === "all"}
              onPress={() => setGameFilter("all")}
            />
            {games.map((g) => (
              <FilterPill
                key={g.id}
                label={g.shortName}
                active={gameFilter === g.id}
                onPress={() => setGameFilter(g.id)}
              />
            ))}
          </View>
        </ScrollView>

        {streamsQ.isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#46E3CE" />
          </View>
        ) : streamsQ.isError ? (
          <Text className="py-6 text-center text-sm text-red-400">
            Failed to load streams.{" "}
            {streamsQ.error instanceof Error ? streamsQ.error.message : ""}
          </Text>
        ) : filtered.length === 0 ? (
          <Text className="py-6 text-center text-sm text-muted-foreground">
            No streams match this filter.
          </Text>
        ) : (
          filtered.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => setSelected(row)}
              className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
            >
              <View className="h-12 w-20 overflow-hidden rounded bg-muted">
                <Image
                  source={row.thumbnailUrl}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-medium text-foreground"
                >
                  {row.title}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-xs text-muted-foreground"
                >
                  {row.streamerName} · {resolveGameName(row.gameId)}
                </Text>
                <View className="mt-1 flex-row items-center gap-2">
                  {row.isLive ? (
                    <StatusBadge tone="red" dot>
                      LIVE
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Offline</StatusBadge>
                  )}
                  {row.isPremium ? (
                    <StatusBadge tone="amber">Premium</StatusBadge>
                  ) : null}
                  <Text className="text-xs text-muted-foreground">
                    {formatCompact(row.viewerCount)} viewers
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable
          onPress={() => setSelected(null)}
          className="flex-1 justify-end bg-black/50"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="max-h-[90%] rounded-t-2xl border border-border bg-background"
          >
            {selected ? (
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View className="mb-4 flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-semibold text-foreground">
                      {selected.title}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {selected.streamerName} ·{" "}
                      {resolveGameName(selected.gameId)}
                      {resolveEventTitle(selected.eventId)
                        ? ` · ${resolveEventTitle(selected.eventId)}`
                        : ""}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                    <X size={20} color="#9FBDBD" />
                  </Pressable>
                </View>

                <View className="mb-3 overflow-hidden rounded-lg border border-border bg-card">
                  <Image
                    source={selected.thumbnailUrl}
                    style={{ width: "100%", aspectRatio: 16 / 9 }}
                    contentFit="cover"
                  />
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {selected.isLive ? (
                    <StatusBadge tone="red" dot>
                      LIVE
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Offline</StatusBadge>
                  )}
                  {selected.isPremium ? (
                    <StatusBadge tone="amber">Premium</StatusBadge>
                  ) : null}
                  <StatusBadge tone="violet">{selected.streamerType}</StatusBadge>
                  <StatusBadge tone="neutral">{selected.language}</StatusBadge>
                </View>

                <View className="mt-3 flex-row flex-wrap gap-3">
                  <InfoCell label="Viewers" value={formatCompact(selected.viewerCount)} />
                  <InfoCell label="Peak" value={formatCompact(selected.peakViewerCount)} />
                  {selected.startedAt ? (
                    <InfoCell label="Started" value={timeAgo(selected.startedAt)} />
                  ) : null}
                  {selected.endedAt ? (
                    <InfoCell label="Ended" value={timeAgo(selected.endedAt)} />
                  ) : null}
                </View>

                {selected.description ? (
                  <View className="mt-3 rounded-lg border border-border bg-card/40 p-3">
                    <Text className="text-xs text-foreground">
                      {selected.description}
                    </Text>
                  </View>
                ) : null}

                <ScheduleEditor
                  stream={selected}
                  isPending={scheduleMut.isPending}
                  onSave={(startAt, durationMin) =>
                    scheduleMut.mutate({
                      id: selected.id,
                      scheduledStartAt: startAt,
                      scheduledDurationMin: durationMin,
                    })
                  }
                  onClear={() =>
                    scheduleMut.mutate({
                      id: selected.id,
                      scheduledStartAt: null,
                      scheduledDurationMin: null,
                    })
                  }
                />

                <HlsUrlEditor
                  stream={selected}
                  isPending={hlsMut.isPending}
                  onSave={(hlsUrl) =>
                    hlsMut.mutate({ id: selected.id, hlsUrl })
                  }
                  onClear={() =>
                    hlsMut.mutate({ id: selected.id, hlsUrl: null })
                  }
                />

                <ThumbnailEditor
                  stream={selected}
                  isPending={thumbnailMut.isPending}
                  onSave={(thumbnailUrl) =>
                    thumbnailMut.mutate({ id: selected.id, thumbnailUrl })
                  }
                />

                <PlayoutFileEditor
                  stream={selected}
                  isPending={playoutMut.isPending}
                  onPick={(filePath) =>
                    playoutMut.mutate({ id: selected.id, playoutFilePath: filePath })
                  }
                  onClear={() =>
                    playoutMut.mutate({ id: selected.id, playoutFilePath: null })
                  }
                />

                <MaturityEditor
                  current={selected.maturityRating}
                  isPending={maturityMut.isPending}
                  onPick={(rating) =>
                    maturityMut.mutate({ id: selected.id, maturityRating: rating })
                  }
                  onClear={() =>
                    maturityMut.mutate({ id: selected.id, maturityRating: null })
                  }
                />

                <ContentTagsEditor
                  current={selected.contentTags}
                  isPending={tagsMut.isPending}
                  onSave={(contentTags) =>
                    tagsMut.mutate({ id: selected.id, contentTags })
                  }
                />

                <View className="mt-5 flex-row gap-2">
                  {selected.deletedAt ? (
                    <Pressable
                      onPress={() => restoreMut.mutate(selected)}
                      disabled={restoreMut.isPending}
                      className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-emerald-500/20 bg-emerald-500/15 px-3 py-3"
                    >
                      <RotateCcw size={14} color="#10B981" />
                      <Text className="text-sm font-semibold text-emerald-400">
                        {restoreMut.isPending ? "Restoring…" : "Restore"}
                      </Text>
                    </Pressable>
                  ) : (
                    <>
                      {selected.isLive ? (
                        <Pressable
                          onPress={() => handleForceEnd(selected)}
                          disabled={forceEndMut.isPending}
                          className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-amber-500/20 bg-amber-500/15 px-3 py-3"
                        >
                          <Square size={14} color="#F59E0B" />
                          <Text className="text-sm font-semibold text-amber-400">
                            {forceEndMut.isPending ? "Ending…" : "Force-end"}
                          </Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        onPress={() => handleDelete(selected)}
                        disabled={deleteMut.isPending}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-destructive/20 bg-destructive/15 px-3 py-3"
                      >
                        <Trash2 size={14} color="#EF4444" />
                        <Text className="text-sm font-semibold text-destructive">
                          {deleteMut.isPending ? "Deleting…" : "Delete"}
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>

                {selected.tags?.length ? (
                  <View className="mt-3 flex-row flex-wrap gap-1.5">
                    {selected.tags.map((t) => (
                      <View
                        key={t}
                        className="rounded-full border border-border bg-card px-2 py-0.5"
                      >
                        <Text className="text-[10px] text-muted-foreground">
                          {t}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1 ${
        active ? "border-cyan-500 bg-cyan-500/10" : "border-border bg-card"
      }`}
    >
      <Text
        className={`text-xs ${
          active ? "text-cyan-300" : "text-muted-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ScheduleEditor({
  stream,
  isPending,
  onSave,
  onClear,
}: {
  stream: Stream;
  isPending: boolean;
  onSave: (startAt: string, durationMin: number) => void;
  onClear: () => void;
}) {
  const initial = stream.scheduledStartAt
    ? toLocalDatetimeInputValue(stream.scheduledStartAt)
    : "";
  const initialDuration = stream.scheduledDurationMin ?? 60;
  const [startAt, setStartAt] = React.useState(initial);
  const [duration, setDuration] = React.useState(String(initialDuration));

  React.useEffect(() => {
    setStartAt(
      stream.scheduledStartAt
        ? toLocalDatetimeInputValue(stream.scheduledStartAt)
        : "",
    );
    setDuration(String(stream.scheduledDurationMin ?? 60));
  }, [stream.id, stream.scheduledStartAt, stream.scheduledDurationMin]);

  const dirty =
    startAt !== initial || duration !== String(initialDuration);
  const canSave = startAt.trim().length > 0 && Number(duration) > 0;

  return (
    <View className="mt-4 rounded-lg border border-border bg-card/40 p-3">
      <View className="mb-3 flex-row items-center gap-2">
        <CalendarClock size={14} color="#67e8f9" />
        <Text className="text-sm font-semibold text-foreground">
          EPG schedule
        </Text>
        {stream.scheduledStartAt ? (
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
          className="flex-1 items-center rounded-lg bg-cyan-500/20 bg-cyan-500/15 px-3 py-2"
          style={{ opacity: !canSave || !dirty || isPending ? 0.5 : 1 }}
        >
          <Text className="text-xs font-semibold text-cyan-300">
            {isPending ? "Saving…" : "Save schedule"}
          </Text>
        </Pressable>
        {stream.scheduledStartAt ? (
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
 * Paste the HLS playback URL the app should play for this stream. For a linear
 * channel served by an external origin (Cloudflare Stream), paste the `.m3u8`
 * manifest; the app plays it directly. Accepts a full http(s) URL or a relative
 * /path. Clearing reverts to the auto origin path set when an encoder connects.
 */
function HlsUrlEditor({
  stream,
  isPending,
  onSave,
  onClear,
}: {
  stream: Stream;
  isPending: boolean;
  onSave: (hlsUrl: string) => void;
  onClear: () => void;
}) {
  const initial = stream.hlsUrl ?? "";
  const [url, setUrl] = React.useState(initial);

  React.useEffect(() => {
    setUrl(stream.hlsUrl ?? "");
  }, [stream.id, stream.hlsUrl]);

  const trimmed = url.trim();
  const dirty = trimmed !== initial.trim();
  const valid =
    trimmed === "" ||
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("/");

  return (
    <View className="mt-4 rounded-lg border border-border bg-card/40 p-3">
      <View className="mb-3 flex-row items-center gap-2">
        <Radio size={14} color="#67e8f9" />
        <Text className="text-sm font-semibold text-foreground">
          Playback URL (HLS)
        </Text>
        {stream.hlsUrl ? (
          <Text className="ml-auto text-[10px] uppercase tracking-wider text-cyan-400">
            Set
          </Text>
        ) : (
          <Text className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
            Auto
          </Text>
        )}
      </View>

      <Text className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        .m3u8 manifest URL
      </Text>
      <Input
        value={url}
        onChangeText={setUrl}
        placeholder="https://customer-xxx.cloudflarestream.com/<uid>/manifest/video.m3u8"
        autoCapitalize="none"
        autoCorrect={false}
        className="mb-3 h-9"
      />

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => {
            if (!valid) {
              toast.error("Enter an http(s) URL or a /path");
              return;
            }
            onSave(trimmed);
          }}
          disabled={!dirty || !valid || isPending}
          className="flex-1 items-center rounded-lg bg-cyan-500/20 bg-cyan-500/15 px-3 py-2"
          style={{ opacity: !dirty || !valid || isPending ? 0.5 : 1 }}
        >
          <Text className="text-xs font-semibold text-cyan-300">
            {isPending ? "Saving…" : "Save URL"}
          </Text>
        </Pressable>
        {stream.hlsUrl ? (
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
 * Upload a new cover image for this stream. Media is upload-only (no URL
 * pasting): the picked image goes through /api/admin/uploads, then the public
 * blob URL is persisted via PATCH /api/admin/streams/[id] { thumbnailUrl }.
 */
function ThumbnailEditor({
  stream,
  isPending,
  onSave,
}: {
  stream: Stream;
  isPending: boolean;
  onSave: (thumbnailUrl: string) => void;
}) {
  const [uploading, setUploading] = React.useState(false);

  async function handlePick() {
    try {
      setUploading(true);
      const url = await pickAndUploadImage();
      if (url) onSave(url);
    } catch (err) {
      toast.error("Upload failed", { description: uploadErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  }

  const busy = uploading || isPending;

  return (
    <View className="mt-4 rounded-lg border border-border bg-card/40 p-3">
      <View className="mb-3 flex-row items-center gap-2">
        <ImageIcon size={14} color="#67e8f9" />
        <Text className="text-sm font-semibold text-foreground">
          Thumbnail
        </Text>
        {stream.thumbnailUrl ? (
          <Text className="ml-auto text-[10px] uppercase tracking-wider text-cyan-400">
            Set
          </Text>
        ) : (
          <Text className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
            None
          </Text>
        )}
      </View>

      <View className="mb-3 overflow-hidden rounded-md border border-border bg-card">
        <ImageWithFallback
          source={stream.thumbnailUrl}
          style={{ width: "100%", aspectRatio: 16 / 9 }}
          contentFit="cover"
          fallbackLabel={stream.title}
          tintSeed={stream.id}
        />
      </View>

      <Pressable
        onPress={handlePick}
        disabled={busy}
        className={`flex-row items-center justify-center gap-2 rounded-md bg-card px-3 py-2.5 ${
          busy ? "opacity-60" : ""
        }`}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#46E3CE" />
        ) : (
          <Upload size={14} color="#46E3CE" />
        )}
        <Text className="text-sm text-foreground">
          {busy ? "Uploading…" : "Upload thumbnail"}
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Pick which media file (reported by the office playout box) airs for this
 * scheduled program. The office media-agent populates the list; choosing here
 * sets streams.playoutFilePath, which the playout adapter resolves over its
 * local media-map.json. No file chosen = the slot plays filler.
 */
function PlayoutFileEditor({
  stream,
  isPending,
  onPick,
  onClear,
}: {
  stream: Stream;
  isPending: boolean;
  onPick: (filePath: string) => void;
  onClear: () => void;
}) {
  const [filter, setFilter] = React.useState("");
  const mediaQ = useQuery({
    queryKey: ["playout-media"],
    queryFn: () => listPlayoutMedia(),
    staleTime: 30_000,
  });
  const files = mediaQ.data?.files ?? [];
  const current = stream.playoutFilePath ?? null;

  const shown = React.useMemo(() => {
    const f = filter.trim().toLowerCase();
    const list = f
      ? files.filter(
          (x) =>
            x.fileName.toLowerCase().includes(f) ||
            x.filePath.toLowerCase().includes(f),
        )
      : files;
    return list.slice(0, 50);
  }, [files, filter]);

  return (
    <View className="mt-4 rounded-lg border border-border bg-card/40 p-3">
      <View className="mb-3 flex-row items-center gap-2">
        <Film size={14} color="#67e8f9" />
        <Text className="text-sm font-semibold text-foreground">
          Playout file
        </Text>
        {current ? (
          <Text className="ml-auto text-[10px] uppercase tracking-wider text-cyan-400">
            Chosen
          </Text>
        ) : (
          <Text className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
            None
          </Text>
        )}
      </View>

      {current ? (
        <View className="mb-3 flex-row items-center gap-2 rounded-md bg-cyan-500/25 px-2 py-1.5">
          <Text className="flex-1 text-xs text-cyan-200" numberOfLines={1}>
            {current}
          </Text>
          <Pressable onPress={onClear} disabled={isPending}>
            <Text className="text-[11px] font-medium text-muted-foreground">
              Clear
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text className="mb-2 text-[11px] text-muted-foreground">
          No file chosen - this slot plays filler until you pick one.
        </Text>
      )}

      <Input
        value={filter}
        onChangeText={setFilter}
        placeholder="Filter files…"
        autoCapitalize="none"
        autoCorrect={false}
        className="mb-2 h-9"
      />

      {mediaQ.isLoading ? (
        <Text className="py-2 text-xs text-muted-foreground">
          Loading library…
        </Text>
      ) : files.length === 0 ? (
        <Text className="py-2 text-xs text-muted-foreground">
          No files reported yet. The office media-agent populates this list.
        </Text>
      ) : (
        <View className="gap-1">
          {shown.map((f) => {
            const active = f.filePath === current;
            return (
              <Pressable
                key={f.id}
                onPress={() => onPick(f.filePath)}
                disabled={isPending || active}
                className={`flex-row items-center gap-2 rounded-md border px-2 py-2 ${
                  active
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-border bg-card"
                }`}
              >
                <Film size={12} color={active ? "#67e8f9" : "#6b7280"} />
                <View className="flex-1">
                  <Text
                    className={`text-xs ${active ? "text-cyan-200" : "text-foreground"}`}
                    numberOfLines={1}
                  >
                    {f.fileName}
                  </Text>
                  <Text
                    className="text-[10px] text-muted-foreground"
                    numberOfLines={1}
                  >
                    {f.sizeMb ? `${f.sizeMb} MB` : ""}
                    {f.durationSec ? ` · ${Math.round(f.durationSec / 60)} min` : ""}
                  </Text>
                </View>
                {active ? (
                  <Text className="text-[10px] text-cyan-400">current</Text>
                ) : null}
              </Pressable>
            );
          })}
          {shown.length < files.length ? (
            <Text className="px-1 py-1 text-[10px] text-muted-foreground">
              Showing {shown.length} of {files.length} - filter to narrow.
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

/** ISO string → "YYYY-MM-DDTHH:mm" in local time for the input. */
function toLocalDatetimeInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[44%]">
      <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <Text
        className="text-sm text-foreground"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
    </View>
  );
}
