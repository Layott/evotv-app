import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { toast } from "sonner-native";
import {
  Grid2x2,
  Layers,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";

import { listLiveStreams } from "@/lib/api/streams";
import type { Stream } from "@/lib/types";
import { HlsPlayer } from "@/components/stream/hls-player";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MAX_STREAMS = 4;
/**
 * Fallback HLS used when a `Stream` row has no `hlsUrl` populated yet
 * (Phase 4 RTMP ingest still landing). Keeps the multi-grid tiles playable
 * during dev + smoke tests so the layout can be exercised. Replace with
 * stream.hlsUrl as soon as the real path is non-empty.
 */
const SAMPLE_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

function SelectableCard({
  stream,
  selected,
  disabled,
  onToggle,
}: {
  stream: Stream;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled && !selected}
      className={cn(
        "overflow-hidden rounded-xl border bg-neutral-900/40",
        selected
          ? "border-brand/60"
          : "border-neutral-800",
        disabled && !selected && "opacity-50",
      )}
    >
      <View
        style={{ aspectRatio: 16 / 9, backgroundColor: "#171717" }}
        className="overflow-hidden"
      >
        <ImageWithFallback
          source={stream.thumbnailUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          fallbackLabel={stream.streamerName}
          tintSeed={stream.id}
        />
        <View className="absolute left-2 top-2 flex-row items-center gap-1 rounded bg-red-600/90 px-1.5 py-0.5">
          <View
            style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" }}
          />
          <Text className="text-[9px] font-bold uppercase text-white">Live</Text>
        </View>
        {selected ? (
          <View className="absolute right-2 top-2 rounded bg-brand px-2 py-0.5">
            <Text className="text-[10px] font-bold text-black">Picked</Text>
          </View>
        ) : null}
      </View>
      <View className="p-3">
        <Text
          className="text-sm font-semibold text-neutral-100"
          numberOfLines={2}
        >
          {stream.title}
        </Text>
        <Text className="mt-0.5 text-[11px] text-neutral-400">
          {stream.streamerName} · {stream.viewerCount.toLocaleString()} watching
        </Text>
      </View>
    </Pressable>
  );
}

function StreamTile({
  stream,
  isAudioActive,
  onActivateAudio,
  onRemove,
}: {
  stream: Stream;
  isAudioActive: boolean;
  onActivateAudio: () => void;
  onRemove: () => void;
}) {
  return (
    <View className="overflow-hidden rounded-xl border border-neutral-800 bg-black">
      <HlsPlayer
        src={stream.hlsUrl || SAMPLE_HLS}
        poster={stream.thumbnailUrl}
        muted={!isAudioActive}
        controls={false}
      />
      <View className="absolute left-2 top-2 flex-row items-center gap-1 rounded bg-red-600/90 px-1.5 py-0.5">
        <View
          style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" }}
        />
        <Text className="text-[9px] font-bold uppercase text-white">Live</Text>
      </View>
      <View className="absolute right-2 top-2 flex-row gap-1">
        <Pressable
          onPress={onActivateAudio}
          className={cn(
            "h-7 w-7 items-center justify-center rounded-full",
            isAudioActive ? "bg-brand" : "bg-black/70",
          )}
        >
          {isAudioActive ? (
            <Volume2 size={14} color="#000" />
          ) : (
            <VolumeX size={14} color="#FAFAFA" />
          )}
        </Pressable>
        <Pressable
          onPress={onRemove}
          className="h-7 w-7 items-center justify-center rounded-full bg-black/70"
        >
          <X size={14} color="#FAFAFA" />
        </Pressable>
      </View>
      <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
        <Text
          className="text-[10px] font-semibold text-white"
          numberOfLines={1}
        >
          {stream.streamerName}
        </Text>
      </View>
    </View>
  );
}

export default function MultiStreamScreen() {
  const [streams, setStreams] = React.useState<Stream[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [audioId, setAudioId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"browse" | "watch">("browse");
  const [gameFilter, setGameFilter] = React.useState<string>("all");

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const refresh = () =>
      listLiveStreams().then((s) => {
        if (cancelled) return;
        setStreams(s);
        setLoading(false);
      });
    void refresh();

    // Refresh every 60s so the grid reflects newly-live channels + drops
    // anything that's ended without forcing a screen re-mount. The user
    // may be parked here picking tiles for a while.
    const timer = setInterval(refresh, 60_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const selected = React.useMemo(
    () =>
      selectedIds
        .map((id) => streams.find((s) => s.id === id))
        .filter((s): s is Stream => Boolean(s)),
    [selectedIds, streams],
  );

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        if (audioId === id) setAudioId(next[0] ?? null);
        return next;
      }
      if (prev.length >= MAX_STREAMS) {
        toast.error(`Stadium caps at ${MAX_STREAMS} streams.`);
        return prev;
      }
      const next = [...prev, id];
      if (prev.length === 0) setAudioId(id);
      return next;
    });
  }

  function removeFromGrid(id: string) {
    setSelectedIds((prev) => {
      const next = prev.filter((x) => x !== id);
      if (audioId === id) setAudioId(next[0] ?? null);
      if (next.length === 0) setView("browse");
      return next;
    });
    toast("Removed from grid");
  }

  function clearAll() {
    if (selectedIds.length === 0) return;
    setSelectedIds([]);
    setAudioId(null);
    setView("browse");
    toast("Stadium cleared");
  }

  function startWatching() {
    if (selectedIds.length === 0) {
      toast.error("Pick at least one stream first");
      return;
    }
    setView("watch");
  }

  const filteredStreams = React.useMemo(() => {
    if (gameFilter === "all") return streams;
    return streams.filter((s) => s.gameId === gameFilter);
  }, [streams, gameFilter]);

  const games = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const s of streams) {
      if (!map.has(s.gameId)) map.set(s.gameId, (s.tags ?? [])[0] ?? s.gameId);
    }
    return Array.from(map.entries());
  }, [streams]);

  if (view === "watch" && selected.length > 0) {
    const audioStream = selected.find((s) => s.id === audioId) ?? null;
    return (
      <>
        <Stack.Screen options={{ title: `Stadium (${selected.length})` }} />
        <ScrollView className="flex-1 bg-background">
          <View className="px-3 py-4">
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1">
                <Volume2 size={13} color="#7DD3FC" />
                <Text className="text-xs text-neutral-300">Audio:</Text>
                <Text className="text-xs font-semibold text-brand">
                  {audioStream?.streamerName ?? "Muted"}
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-neutral-800"
                  onPress={() => setView("browse")}
                  textClassName="text-neutral-200"
                >
                  Pick more
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-neutral-800"
                  onPress={clearAll}
                  textClassName="text-neutral-200"
                >
                  <RefreshCw size={13} color="#FAFAFA" />
                  Reset
                </Button>
              </View>
            </View>

            {/* 2x2 grid (or 1, 2, 3 streams) */}
            <View className="mt-4 flex-row flex-wrap" style={{ gap: 8 }}>
              {selected.map((s) => (
                <View
                  key={s.id}
                  style={{
                    width: selected.length === 1 ? "100%" : "49%",
                  }}
                >
                  <StreamTile
                    stream={s}
                    isAudioActive={audioId === s.id}
                    onActivateAudio={() => {
                      setAudioId(s.id);
                      toast.success(`Audio: ${s.streamerName}`);
                    }}
                    onRemove={() => removeFromGrid(s.id)}
                  />
                </View>
              ))}
              {selected.length < MAX_STREAMS &&
                Array.from({ length: MAX_STREAMS - selected.length }).map(
                  (_, i) => (
                    <Pressable
                      key={`empty_${i}`}
                      onPress={() => setView("browse")}
                      style={{
                        width: selected.length === 1 ? "100%" : "49%",
                        aspectRatio: 16 / 9,
                      }}
                      className="items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30"
                    >
                      <Layers size={18} color="#525252" />
                      <Text className="mt-1 text-xs text-neutral-500">
                        Add stream
                      </Text>
                    </Pressable>
                  ),
                )}
            </View>

            <Text className="mt-4 text-center text-[11px] text-neutral-500">
              Tap the speaker on a tile to switch audio. Only one tile is unmuted
              at a time.
            </Text>
          </View>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Stadium Mode" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-end justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Grid2x2 size={22} color="#7DD3FC" />
                <Text className="text-2xl font-bold text-neutral-50">
                  Stadium mode
                </Text>
              </View>
              <Text className="mt-1 text-sm text-neutral-400">
                Watch up to {MAX_STREAMS} live streams in a grid.
              </Text>
            </View>
            <View className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-800"
                onPress={clearAll}
                disabled={selectedIds.length === 0}
                textClassName="text-neutral-200"
              >
                <RefreshCw size={13} color="#FAFAFA" />
                Clear
              </Button>
              <Button
                size="sm"
                className="bg-brand"
                onPress={startWatching}
                disabled={selectedIds.length === 0}
                textClassName="text-black"
              >
                <Layers size={13} color="#000" />
                Watch ({selectedIds.length}/{MAX_STREAMS})
              </Button>
            </View>
          </View>

          {/* Selected tray */}
          <View className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
            <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
              Selected ({selected.length} / {MAX_STREAMS})
            </Text>
            {selected.length === 0 ? (
              <Text className="mt-1 text-xs text-neutral-500">
                Tap streams below to add them.
              </Text>
            ) : (
              <View className="mt-2 flex-row flex-wrap gap-2">
                {selected.map((s, i) => (
                  <Pressable
                    key={s.id}
                    onPress={() => toggleSelected(s.id)}
                    className="flex-row items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-1"
                  >
                    <View className="h-4 w-4 items-center justify-center rounded-full bg-brand">
                      <Text className="text-[9px] font-bold text-black">
                        {i + 1}
                      </Text>
                    </View>
                    <Text
                      className="text-xs text-neutral-200"
                      numberOfLines={1}
                      style={{ maxWidth: 140 }}
                    >
                      {s.streamerName}
                    </Text>
                    <X size={11} color="#A3A3A3" />
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Game filter */}
          <Text className="mt-4 text-[10px] uppercase tracking-wider text-neutral-500">
            Game
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2"
          >
            <Pressable
              onPress={() => setGameFilter("all")}
              className={cn(
                "mr-2 rounded-full border px-3 py-1.5",
                gameFilter === "all"
                  ? "border-brand/50 bg-brand/10"
                  : "border-neutral-800 bg-neutral-900/60",
              )}
            >
              <Text
                className={cn(
                  "text-xs font-medium",
                  gameFilter === "all" ? "text-brand" : "text-neutral-400",
                )}
              >
                All
              </Text>
            </Pressable>
            {games.map(([gid, label]) => (
              <Pressable
                key={gid}
                onPress={() => setGameFilter(gid)}
                className={cn(
                  "mr-2 rounded-full border px-3 py-1.5",
                  gameFilter === gid
                    ? "border-brand/50 bg-brand/10"
                    : "border-neutral-800 bg-neutral-900/60",
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-medium",
                    gameFilter === gid ? "text-brand" : "text-neutral-400",
                  )}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {loading ? (
            <View className="mt-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </View>
          ) : filteredStreams.length === 0 ? (
            <View className="mt-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10">
              <View className="items-center">
                <Sparkles size={36} color="#525252" />
              </View>
              <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
                No live streams match this filter
              </Text>
            </View>
          ) : (
            <View className="mt-4 gap-3">
              {filteredStreams.map((s) => (
                <SelectableCard
                  key={s.id}
                  stream={s}
                  selected={selectedIds.includes(s.id)}
                  disabled={selectedIds.length >= MAX_STREAMS}
                  onToggle={() => toggleSelected(s.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
