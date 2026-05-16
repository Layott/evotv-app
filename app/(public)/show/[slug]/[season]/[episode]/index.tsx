import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Forward } from "lucide-react-native";

import { Skeleton } from "@/components/ui/skeleton";
import { HLSPlayer } from "@/components/stream/hls-player";
import {
  getShowWithSeasonsBySlug,
  listEpisodesForSeason,
  setEpisodeProgress,
} from "@/lib/api/shows";

const BRAND = "#2CD7E3";
const BRAND_RGBA = (a: number) => `rgba(44,215,227,${a})`;

function formatRuntime(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default function EpisodePlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    slug: string;
    season: string;
    episode: string;
  }>();
  const seasonNum = Number(params.season ?? "1");
  const epNum = Number(params.episode ?? "1");

  const showQ = useQuery({
    queryKey: ["show", params.slug],
    queryFn: () => getShowWithSeasonsBySlug(params.slug ?? ""),
    enabled: !!params.slug,
  });

  // Resolve season by number, then load + cache its episodes once.
  const targetSeasonId = React.useMemo(() => {
    const seasons = showQ.data?.seasons ?? [];
    return seasons.find((s) => s.seasonNumber === seasonNum)?.id ?? null;
  }, [showQ.data, seasonNum]);

  const seasonEpisodesQ = useQuery({
    queryKey: ["show", params.slug, "season-episodes", targetSeasonId],
    queryFn: () => listEpisodesForSeason(targetSeasonId!),
    enabled: !!targetSeasonId,
  });

  const episode = React.useMemo(() => {
    if (!seasonEpisodesQ.data) return null;
    return (
      seasonEpisodesQ.data.find((e) => e.episodeNumber === epNum) ?? null
    );
  }, [seasonEpisodesQ.data, epNum]);

  const nextEpisode = React.useMemo(() => {
    if (!seasonEpisodesQ.data || !episode) return null;
    const idx = seasonEpisodesQ.data.findIndex((e) => e.id === episode.id);
    if (idx < 0 || idx === seasonEpisodesQ.data.length - 1) return null;
    return seasonEpisodesQ.data[idx + 1]!;
  }, [seasonEpisodesQ.data, episode]);

  // Save progress at mount + periodically while watching. For the mock player,
  // simulate a mid-episode position so the Continue-Watching rail has data.
  React.useEffect(() => {
    if (!episode) return;
    void setEpisodeProgress(episode.id, Math.round(episode.runtimeSec * 0.35));
  }, [episode]);

  const [skipDismissed, setSkipDismissed] = React.useState(false);
  const showSkipIntro =
    !!episode?.introStartSec &&
    !!episode?.introEndSec &&
    !skipDismissed;

  if (showQ.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <Skeleton style={{ aspectRatio: 16 / 9 }} className="rounded-none" />
      </View>
    );
  }

  if (!showQ.data?.show || !episode) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-lg font-bold text-foreground">
          Episode not found
        </Text>
        <Text className="mt-1 text-center text-sm text-muted-foreground">
          S{seasonNum}·E{epNum} of {params.slug} doesn't exist.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 rounded-xl px-4 py-2.5"
          style={{ backgroundColor: BRAND }}
        >
          <Text style={{ color: "#0a0a0a", fontWeight: "700", fontSize: 13 }}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  const show = showQ.data.show;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        {/* PLAYER */}
        <View className="relative bg-black">
          <HLSPlayer src={episode.hlsUrl} poster={episode.thumbnailUrl} />
          <Pressable
            onPress={() => router.back()}
            className="absolute left-3 top-12 h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <ArrowLeft color="#fff" size={20} />
          </Pressable>
          {/* SKIP INTRO */}
          {showSkipIntro ? (
            <Pressable
              onPress={() => setSkipDismissed(true)}
              className="absolute bottom-12 right-4 flex-row items-center gap-1.5 rounded-md px-3 py-2 active:opacity-80"
              style={{
                backgroundColor: "rgba(0,0,0,0.7)",
                borderWidth: 1,
                borderColor: BRAND_RGBA(0.5),
              }}
            >
              <Forward size={14} color={BRAND} />
              <Text style={{ color: BRAND, fontSize: 12, fontWeight: "600" }}>
                Skip intro
              </Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="px-4 pt-4 gap-3">
            <Pressable
              onPress={() => router.push(`/show/${show.slug}` as never)}
              className="flex-row items-center gap-1.5"
            >
              <Text className="text-xs font-semibold text-brand">{show.title}</Text>
              <ChevronRight size={12} color={BRAND} />
            </Pressable>

            <View className="flex-row items-center gap-2">
              <Text className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Season {episode.seasonNumber} · Episode {episode.episodeNumber}
              </Text>
              <Text className="text-[10px] text-muted-foreground">
                · {formatRuntime(episode.runtimeSec)}
              </Text>
            </View>

            <Text className="text-xl font-bold leading-tight text-foreground">
              {episode.title}
            </Text>

            <Text className="text-sm text-foreground/85">
              {episode.synopsis}
            </Text>
          </View>

          {/* UP NEXT */}
          {nextEpisode ? (
            <View className="mt-6 mx-4 overflow-hidden rounded-2xl border border-border bg-card">
              <View className="px-4 py-3 border-b border-border">
                <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Up next
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  router.replace(
                    `/show/${show.slug}/${nextEpisode.seasonNumber}/${nextEpisode.episodeNumber}` as never,
                  )
                }
                className="flex-row items-center gap-3 p-3 active:opacity-80"
              >
                <View
                  className="overflow-hidden rounded-md bg-muted"
                  style={{ width: 120, aspectRatio: 16 / 9 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    E{nextEpisode.episodeNumber} · {formatRuntime(nextEpisode.runtimeSec)}
                  </Text>
                  <Text
                    className="mt-1 text-sm font-semibold text-foreground"
                    numberOfLines={2}
                  >
                    {nextEpisode.title}
                  </Text>
                  <Text
                    className="mt-0.5 text-xs text-muted-foreground"
                    numberOfLines={2}
                  >
                    {nextEpisode.synopsis}
                  </Text>
                </View>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </>
  );
}
