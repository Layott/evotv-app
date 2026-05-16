import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Sparkles, Star } from "lucide-react-native";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { listShows, listContinueWatching } from "@/lib/api/shows";
import type { ContentPillar, Show } from "@/lib/types";
import { PILLAR_LABELS } from "@/lib/types";

const BRAND = "#2CD7E3";
const BRAND_RGBA = (a: number) => `rgba(44,215,227,${a})`;

const PILLAR_TINT: Record<ContentPillar, string> = {
  esports: "#a78bfa",
  anime: "#f472b6",
  lifestyle: "#facc15",
};

function HeroCard({ show }: { show: Show }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/show/${show.slug}` as never)}
      className="overflow-hidden rounded-2xl border border-border bg-card active:opacity-90"
    >
      <View style={{ aspectRatio: 16 / 9, position: "relative" }}>
        <ImageWithFallback
          source={show.heroUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          fallbackLabel={show.title}
          tintSeed={show.id}
        />
        <View
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        />
        <View className="absolute inset-x-0 bottom-0 p-4 gap-2">
          <View className="flex-row items-center gap-1.5">
            <View
              className="rounded-md px-1.5 py-0.5"
              style={{
                backgroundColor: BRAND_RGBA(0.15),
                borderWidth: 1,
                borderColor: BRAND_RGBA(0.4),
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 1.5,
                  color: BRAND,
                  textTransform: "uppercase",
                }}
              >
                {show.originType === "evo_original"
                  ? "EVO Original"
                  : show.originType === "licensed"
                    ? "Licensed"
                    : "Syndicated"}
              </Text>
            </View>
            <View
              className="rounded-md px-1.5 py-0.5"
              style={{
                backgroundColor: `${PILLAR_TINT[show.pillar]}20`,
                borderWidth: 1,
                borderColor: `${PILLAR_TINT[show.pillar]}50`,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 1.5,
                  color: PILLAR_TINT[show.pillar],
                  textTransform: "uppercase",
                }}
              >
                {PILLAR_LABELS[show.pillar]}
              </Text>
            </View>
          </View>
          <Text className="text-xl font-bold text-white" numberOfLines={2}>
            {show.title}
          </Text>
          <Text
            className="text-xs"
            numberOfLines={2}
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            {show.synopsis}
          </Text>
          <View className="mt-1 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Star size={11} color="#fbbf24" fill="#fbbf24" />
              <Text className="text-[11px] font-semibold" style={{ color: "#fbbf24" }}>
                {show.rating.toFixed(1)}
              </Text>
            </View>
            <Text className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
              {show.totalSeasons} season{show.totalSeasons === 1 ? "" : "s"} ·{" "}
              {show.totalEpisodes} episodes
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function ShowPosterCard({ show }: { show: Show }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/show/${show.slug}` as never)}
      className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
      style={{ width: 160 }}
    >
      <View style={{ aspectRatio: 3 / 4 }}>
        <ImageWithFallback
          source={show.posterUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          fallbackLabel={show.title}
          tintSeed={show.id}
        />
      </View>
      <View className="p-2.5">
        <View
          className="self-start rounded px-1 py-0.5"
          style={{
            backgroundColor: `${PILLAR_TINT[show.pillar]}15`,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontWeight: "700",
              letterSpacing: 1,
              color: PILLAR_TINT[show.pillar],
              textTransform: "uppercase",
            }}
          >
            {PILLAR_LABELS[show.pillar]}
          </Text>
        </View>
        <Text
          className="mt-1.5 text-xs font-semibold text-foreground"
          numberOfLines={2}
        >
          {show.title}
        </Text>
        <View className="mt-1 flex-row items-center gap-1">
          <Star size={9} color="#fbbf24" fill="#fbbf24" />
          <Text className="text-[10px] text-muted-foreground">
            {show.rating.toFixed(1)} · S{show.totalSeasons}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function Rail({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2 px-4">
        {icon}
        <Text className="text-base font-semibold text-foreground">{title}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export default function OriginalsScreen() {
  const router = useRouter();
  const showsQ = useQuery({
    queryKey: ["originals", "shows"],
    queryFn: () => listShows(),
  });

  const continueQ = useQuery({
    queryKey: ["originals", "continue"],
    queryFn: () => listContinueWatching(6),
  });

  const allShows = showsQ.data ?? [];
  const featuredShow = allShows[0];
  const byPillar = (pillar: ContentPillar) =>
    allShows.filter((s) => s.pillar === pillar);

  return (
    <>
      <Stack.Screen options={{ title: "EVO Originals" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 48, gap: 24 }}
      >
        {/* HERO */}
        <View className="px-4 pt-4 gap-3">
          <Badge
            variant="outline"
            className="border-brand"
            textClassName="text-brand"
          >
            <Crown size={11} color={BRAND} /> EVO Originals + Licensed
          </Badge>
          <Text className="text-2xl font-bold leading-tight text-foreground">
            Shows, seasons, and episode drops — built for African audiences.
          </Text>
          <Text className="text-sm text-muted-foreground">
            Esports docuseries, anime debate shows, lifestyle audio-docs, tech
            interviews. Premium-positioned. Watch in order or jump around.
          </Text>
        </View>

        {/* FEATURED */}
        {showsQ.isPending ? (
          <View className="px-4">
            <Skeleton className="rounded-2xl" style={{ aspectRatio: 16 / 9 }} />
          </View>
        ) : featuredShow ? (
          <View className="px-4">
            <HeroCard show={featuredShow} />
          </View>
        ) : null}

        {/* CONTINUE WATCHING */}
        {continueQ.data && continueQ.data.length > 0 ? (
          <Rail
            title="Continue watching"
            icon={<Sparkles size={16} color={BRAND} />}
          >
            {continueQ.data.map((row) => (
              <Pressable
                key={row.episode.id}
                onPress={() =>
                  router.push(
                    `/show/${row.show.slug}/${row.episode.seasonNumber}/${row.episode.episodeNumber}` as never,
                  )
                }
                className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
                style={{ width: 260 }}
              >
                <View style={{ aspectRatio: 16 / 9, position: "relative" }}>
                  <ImageWithFallback
                    source={row.episode.thumbnailUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    fallbackLabel={row.episode.title}
                    tintSeed={row.episode.id}
                  />
                  {/* Progress bar */}
                  <View
                    className="absolute inset-x-0 bottom-0 h-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${Math.min(100, Math.round((row.positionSec / row.episode.runtimeSec) * 100))}%`,
                        backgroundColor: BRAND,
                      }}
                    />
                  </View>
                </View>
                <View className="p-3">
                  <Text
                    className="text-xs font-semibold text-foreground"
                    numberOfLines={1}
                  >
                    {row.show.title}
                  </Text>
                  <Text
                    className="mt-0.5 text-[11px] text-muted-foreground"
                    numberOfLines={1}
                  >
                    S{row.episode.seasonNumber}·E{row.episode.episodeNumber}{" "}
                    {row.episode.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </Rail>
        ) : null}

        {/* ESPORTS PILLAR */}
        {byPillar("esports").length > 0 ? (
          <Rail
            title="Esports — behind the scenes"
            icon={
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: PILLAR_TINT.esports,
                }}
              />
            }
          >
            {byPillar("esports").map((s) => (
              <ShowPosterCard key={s.id} show={s} />
            ))}
          </Rail>
        ) : null}

        {/* ANIME PILLAR */}
        {byPillar("anime").length > 0 ? (
          <Rail
            title="Anime — debate + build-along"
            icon={
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: PILLAR_TINT.anime,
                }}
              />
            }
          >
            {byPillar("anime").map((s) => (
              <ShowPosterCard key={s.id} show={s} />
            ))}
          </Rail>
        ) : null}

        {/* LIFESTYLE PILLAR */}
        {byPillar("lifestyle").length > 0 ? (
          <Rail
            title="Lifestyle — long-form audio + interviews"
            icon={
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: PILLAR_TINT.lifestyle,
                }}
              />
            }
          >
            {byPillar("lifestyle").map((s) => (
              <ShowPosterCard key={s.id} show={s} />
            ))}
          </Rail>
        ) : null}

        {/* FOOTER */}
        <View className="mx-4 mt-4 rounded-2xl border border-border bg-card p-5">
          <Text className="text-sm font-semibold text-foreground">
            What's coming next
          </Text>
          <Text className="mt-2 text-xs text-muted-foreground">
            New episodes drop weekly. EVO Originals + select licensed
            programming. Premium subscribers get early access — the first
            48 hours after release are subs-only.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
