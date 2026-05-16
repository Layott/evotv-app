import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Clock, Sparkles } from "lucide-react-native";

import type { Game, Vod } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

interface RecommendationsProps {
  vods: Vod[];
  games: Game[];
  loading: boolean;
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function SkeletonCard() {
  return (
    <View className="flex-1 gap-2">
      <Skeleton style={{ aspectRatio: 16 / 9, borderRadius: 12 }} />
      <Skeleton style={{ height: 12, width: "75%" }} />
    </View>
  );
}

export function Recommendations({
  vods,
  games,
  loading,
}: RecommendationsProps) {
  const router = useRouter();
  const gameMap = React.useMemo(
    () => new Map(games.map((g) => [g.id, g])),
    [games],
  );

  // 2-column grid using flex-wrap (FlatList numColumns has friction with header rows;
  // a wrap grid is simpler and the lists here are short).
  const renderRow = (rowVods: Vod[], rowKey: number) => (
    <View key={rowKey} className="flex-row gap-3 px-4">
      {rowVods.map((v) => {
        const game = gameMap.get(v.gameId);
        return (
          <Pressable
            key={v.id}
            onPress={() => router.push(`/vod/${v.id}`)}
            className="flex-1 overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
          >
            <View
              style={{ aspectRatio: 16 / 9 }}
              className="relative overflow-hidden"
            >
              <ImageWithFallback
                source={v.thumbnailUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                fallbackLabel={v.title}
                tintSeed={v.id}
              />
              <View
                className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-md px-1.5 py-0.5"
                style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
              >
                <Clock size={12} color="#e5e5e5" />
                <Text style={{ fontSize: 11, color: "#e5e5e5" }}>
                  {formatDuration(v.durationSec)}
                </Text>
              </View>
            </View>
            <View className="gap-1 p-3">
              <Text
                className="text-sm font-semibold text-foreground"
                numberOfLines={2}
              >
                {v.title}
              </Text>
              {game ? (
                <Text style={{ fontSize: 11, color: "#2CD7E3" }}>
                  {game.shortName}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
      {/* Fill empty slot if odd count */}
      {rowVods.length === 1 ? <View className="flex-1" /> : null}
    </View>
  );

  // Chunk into rows of 2
  const rows: Vod[][] = [];
  for (let i = 0; i < vods.length; i += 2) {
    rows.push(vods.slice(i, i + 2));
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-4">
        <View className="flex-row items-center gap-2">
          <Sparkles size={16} color="#2CD7E3" />
          <Text className="text-xl font-semibold text-foreground">
            Recommended for you
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/discover")}
          className="active:opacity-70"
        >
          <Text className="text-xs font-medium" style={{ color: "#2CD7E3" }}>
            See all
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="gap-3">
          <View className="flex-row gap-3 px-4">
            <SkeletonCard />
            <SkeletonCard />
          </View>
          <View className="flex-row gap-3 px-4">
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </View>
      ) : vods.length === 0 ? (
        <View className="mx-4 rounded-xl border border-border bg-card p-6">
          <Text className="text-center text-sm text-muted-foreground">
            We&apos;ll tailor recommendations as you watch more.
          </Text>
        </View>
      ) : (
        <View className="gap-3">{rows.map((r, i) => renderRow(r, i))}</View>
      )}
    </View>
  );
}

export default Recommendations;
