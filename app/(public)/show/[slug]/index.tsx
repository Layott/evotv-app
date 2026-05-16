import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, BookmarkCheck, Play, Star } from "lucide-react-native";
import { toast } from "sonner-native";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import {
  getShowWithSeasonsBySlug,
  getWatchlistEntry,
  listEpisodesForSeason,
  setWatchlistStatus,
} from "@/lib/api/shows";
import type { Episode, Season, Show, WatchlistStatus } from "@/lib/types";
import { PILLAR_LABELS } from "@/lib/types";
import { formatDateOnly } from "@/lib/utils";

const BRAND = "#2CD7E3";
const BRAND_RGBA = (a: number) => `rgba(44,215,227,${a})`;

function formatRuntime(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h ${remM}m`;
}

function EpisodeRow({
  episode,
  showSlug,
  isLast,
}: {
  episode: Episode;
  showSlug: string;
  isLast: boolean;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() =>
        router.push(
          `/show/${showSlug}/${episode.seasonNumber}/${episode.episodeNumber}` as never,
        )
      }
      className={
        "flex-row items-center gap-3 px-4 py-3 active:opacity-80" +
        (isLast ? "" : " border-b border-border")
      }
    >
      <View
        className="overflow-hidden rounded-md"
        style={{ width: 140, aspectRatio: 16 / 9 }}
      >
        <ImageWithFallback
          source={episode.thumbnailUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          fallbackLabel={episode.title}
          tintSeed={episode.id}
        />
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[10px] uppercase tracking-widest text-muted-foreground">
            E{episode.episodeNumber}
          </Text>
          <Text
            className="text-[10px] tracking-wide text-muted-foreground"
          >
            · {formatRuntime(episode.runtimeSec)}
          </Text>
        </View>
        <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
          {episode.title}
        </Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={2}>
          {episode.synopsis}
        </Text>
      </View>
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: BRAND_RGBA(0.12) }}
      >
        <Play size={16} color={BRAND} fill={BRAND} />
      </View>
    </Pressable>
  );
}

export default function ShowLandingScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const qc = useQueryClient();

  // Backend returns show + seasons in a single payload to avoid round-trips.
  const showQ = useQuery({
    queryKey: ["show", slug],
    queryFn: () => getShowWithSeasonsBySlug(slug ?? ""),
    enabled: !!slug,
  });
  const seasonsQ = {
    data: showQ.data?.seasons,
    isLoading: showQ.isLoading,
  };

  const [activeSeasonId, setActiveSeasonId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (seasonsQ.data && seasonsQ.data.length > 0 && !activeSeasonId) {
      setActiveSeasonId(seasonsQ.data[seasonsQ.data.length - 1]!.id);
    }
  }, [seasonsQ.data, activeSeasonId]);

  const episodesQ = useQuery({
    queryKey: ["show", slug, "episodes", activeSeasonId],
    queryFn: () => listEpisodesForSeason(activeSeasonId!),
    enabled: !!activeSeasonId,
  });

  const watchlistQ = useQuery({
    queryKey: ["watchlist", showQ.data?.show.id],
    queryFn: () => getWatchlistEntry(showQ.data!.show.id),
    enabled: !!showQ.data,
  });

  const watchlistMutation = useMutation({
    mutationFn: async (next: WatchlistStatus | null) => {
      if (!showQ.data) return;
      await setWatchlistStatus(showQ.data.show.id, next);
      return next;
    },
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ["watchlist", showQ.data?.show.id] });
      toast.success(
        next == null
          ? "Removed from watchlist"
          : next === "watching"
            ? "Added to watching"
            : `Marked as ${next.replace(/_/g, " ")}`,
      );
    },
  });

  if (showQ.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <Skeleton style={{ aspectRatio: 16 / 9 }} className="rounded-none" />
        <View className="px-4 pt-4 gap-3">
          <Skeleton className="h-6 w-2/3 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-3/4 rounded" />
        </View>
      </View>
    );
  }

  const show = showQ.data?.show;
  if (!show) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-lg font-bold text-foreground">Show not found</Text>
        <Text className="mt-1 text-center text-sm text-muted-foreground">
          Couldn't find that title. It may have been removed.
        </Text>
        <Pressable
          onPress={() => router.replace("/originals" as never)}
          className="mt-6 rounded-xl px-4 py-2.5"
          style={{ backgroundColor: BRAND }}
        >
          <Text style={{ color: "#0a0a0a", fontWeight: "700", fontSize: 13 }}>
            Back to Originals
          </Text>
        </Pressable>
      </View>
    );
  }

  const onWatchlist = watchlistQ.data?.status === "watching";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* HERO */}
        <View style={{ aspectRatio: 16 / 9, position: "relative" }}>
          <ImageWithFallback
            source={show.heroUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            fallbackLabel={show.title}
            tintSeed={show.id}
          />
          <Pressable
            onPress={() => router.back()}
            className="absolute left-3 top-12 h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <ArrowLeft color="#fff" size={20} />
          </Pressable>
          <View
            className="absolute inset-x-0 bottom-0 h-2/3"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          />
        </View>

        {/* META */}
        <View className="px-4 pt-4 gap-3">
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className="border-brand"
              textClassName="text-brand"
            >
              {show.originType === "evo_original"
                ? "EVO Original"
                : show.originType === "licensed"
                  ? "Licensed"
                  : "Syndicated"}
            </Badge>
            <Badge
              variant="outline"
              className="border-border"
              textClassName="capitalize text-foreground"
            >
              {PILLAR_LABELS[show.pillar]}
            </Badge>
            <Badge
              variant="outline"
              className="border-border"
              textClassName={
                show.status === "airing"
                  ? "text-emerald-400"
                  : show.status === "completed"
                    ? "text-muted-foreground"
                    : show.status === "upcoming"
                      ? "text-amber-300"
                      : "text-muted-foreground"
              }
            >
              {show.status}
            </Badge>
          </View>

          <Text className="text-2xl font-bold text-foreground">{show.title}</Text>

          <View className="flex-row items-center gap-3 flex-wrap">
            <View className="flex-row items-center gap-1">
              <Star size={12} color="#fbbf24" fill="#fbbf24" />
              <Text className="text-xs font-semibold" style={{ color: "#fbbf24" }}>
                {show.rating.toFixed(1)}
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">
              {show.totalSeasons} season{show.totalSeasons === 1 ? "" : "s"} ·{" "}
              {show.totalEpisodes} episodes
            </Text>
            <Text className="text-xs text-muted-foreground">
              · Released {formatDateOnly(show.releasedAt)}
            </Text>
          </View>

          <Text className="text-sm text-foreground/85">{show.synopsis}</Text>

          {show.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5">
              {show.tags.map((t) => (
                <View
                  key={t}
                  className="rounded-md border border-border bg-card px-2 py-0.5"
                >
                  <Text className="text-[10px] text-muted-foreground">{t}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ACTIONS */}
          <View className="flex-row gap-2 pt-1">
            <Pressable
              onPress={() => {
                const firstEp = episodesQ.data?.[0];
                if (!firstEp) return;
                router.push(
                  `/show/${show.slug}/${firstEp.seasonNumber}/${firstEp.episodeNumber}` as never,
                );
              }}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-3 active:opacity-80"
              style={{ backgroundColor: BRAND }}
            >
              <Play size={16} color="#0a0a0a" fill="#0a0a0a" />
              <Text style={{ color: "#0a0a0a", fontWeight: "700", fontSize: 14 }}>
                Watch S{(episodesQ.data?.[0]?.seasonNumber ?? 1)}·E
                {episodesQ.data?.[0]?.episodeNumber ?? 1}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                watchlistMutation.mutate(onWatchlist ? null : "watching")
              }
              className="flex-row items-center gap-1.5 rounded-xl border border-border bg-card px-4 active:opacity-70"
            >
              {onWatchlist ? (
                <BookmarkCheck size={16} color={BRAND} />
              ) : (
                <Bookmark size={16} color="#a3a3a3" />
              )}
              <Text className="text-sm font-medium text-foreground">
                {onWatchlist ? "On watchlist" : "Watchlist"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* SEASON PICKER */}
        {seasonsQ.data && seasonsQ.data.length > 0 ? (
          <View className="pt-8 gap-3">
            <Text className="px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Seasons
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {seasonsQ.data.map((s: Season) => {
                const active = s.id === activeSeasonId;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setActiveSeasonId(s.id)}
                    className="rounded-full border px-3 py-1.5"
                    style={{
                      borderColor: active ? BRAND_RGBA(0.5) : "#262626",
                      backgroundColor: active
                        ? BRAND_RGBA(0.1)
                        : "rgba(15,15,15,0.6)",
                    }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: active ? BRAND : "#a3a3a3" }}
                    >
                      Season {s.seasonNumber} · {s.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* EPISODE LIST */}
        {episodesQ.isLoading ? (
          <View className="px-4 pt-4 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </View>
        ) : episodesQ.data && episodesQ.data.length > 0 ? (
          <View className="mt-4 overflow-hidden rounded-2xl border border-border bg-card/40 mx-4">
            {episodesQ.data.map((e, idx, arr) => (
              <EpisodeRow
                key={e.id}
                episode={e}
                showSlug={show.slug}
                isLast={idx === arr.length - 1}
              />
            ))}
          </View>
        ) : (
          <View className="mx-4 mt-4 rounded-2xl border border-dashed border-border bg-card p-8">
            <Text className="text-center text-sm text-muted-foreground">
              No episodes released yet for this season.
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
