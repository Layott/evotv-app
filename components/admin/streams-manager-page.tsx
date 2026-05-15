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
import { Search, X, Square, Trash2 } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  adminDeleteStream,
  adminForceEndStream,
  listAdminStreams,
} from "@/lib/api/streams";
import { listGames } from "@/lib/api/games";
import { listEvents } from "@/lib/api/events";
import type { Stream } from "@/lib/types";

import { Input } from "@/components/ui/input";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatCompact, timeAgo } from "./utils";

export function StreamsManagerPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [gameFilter, setGameFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "live" | "offline"
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
      `Soft-deletes "${stream.title}" — it disappears from all public lists. Recoverable within 30 days.`,
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
          description="Read-only browse — stream keys + create + rotate via dedicated screens later."
        />

        <View className="mb-3 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
            <Search size={14} color="#A3A3A3" />
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
            <ActivityIndicator color="#2CD7E3" />
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
                    <X size={20} color="#A3A3A3" />
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

                <View className="mt-5 flex-row gap-2">
                  {selected.isLive ? (
                    <Pressable
                      onPress={() => handleForceEnd(selected)}
                      disabled={forceEndMut.isPending}
                      className="flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-3"
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
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-3"
                  >
                    <Trash2 size={14} color="#EF4444" />
                    <Text className="text-sm font-semibold text-destructive">
                      {deleteMut.isPending ? "Deleting…" : "Delete"}
                    </Text>
                  </Pressable>
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
