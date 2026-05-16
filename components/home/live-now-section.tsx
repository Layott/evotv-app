import * as React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Eye } from "lucide-react-native";

import type { Game, Stream } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

interface LiveNowProps {
  streams: Stream[];
  games: Game[];
  loading: boolean;
}

const CARD_WIDTH = 280;

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function LiveBadge() {
  return (
    <View
      className="flex-row items-center gap-1 rounded-md px-2 py-0.5"
      style={{
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.3)",
        backgroundColor: "rgba(239,68,68,0.1)",
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

function SkeletonCard() {
  return (
    <View style={{ width: CARD_WIDTH }} className="gap-2">
      <Skeleton style={{ aspectRatio: 16 / 9, borderRadius: 12 }} />
      <Skeleton style={{ height: 12, width: "75%" }} />
      <Skeleton style={{ height: 12, width: "50%" }} />
    </View>
  );
}

export function LiveNow({ streams, games, loading }: LiveNowProps) {
  const router = useRouter();
  const gameMap = React.useMemo(
    () => new Map(games.map((g) => [g.id, g])),
    [games],
  );

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-4">
        <Text className="text-xl font-semibold text-foreground">Live Now</Text>
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
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[0, 1, 2, 3]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={() => <SkeletonCard />}
        />
      ) : streams.length === 0 ? (
        <View className="mx-4 rounded-xl border border-border bg-card p-6">
          <Text className="text-center text-sm text-muted-foreground">
            No streams live right now. Check back soon.
          </Text>
        </View>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={streams}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={({ item: s }) => {
            const game = gameMap.get(s.gameId);
            return (
              <Pressable
                onPress={() => router.push(`/stream/${s.id}`)}
                style={{ width: CARD_WIDTH }}
                className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
              >
                <View
                  style={{ aspectRatio: 16 / 9 }}
                  className="relative overflow-hidden"
                >
                  <ImageWithFallback
                    source={s.thumbnailUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    fallbackLabel={s.title}
                    tintSeed={s.id}
                  />
                  <View className="absolute left-2 top-2">
                    <LiveBadge />
                  </View>
                  <View
                    className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-md px-1.5 py-0.5"
                    style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                  >
                    <Eye size={12} color="#e5e5e5" />
                    <Text style={{ fontSize: 11, color: "#e5e5e5" }}>
                      {formatViewers(s.viewerCount)}
                    </Text>
                  </View>
                </View>
                <View className="gap-1 p-3">
                  <Text
                    className="text-sm font-semibold text-foreground"
                    numberOfLines={2}
                  >
                    {s.title}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {s.streamerName}
                  </Text>
                  {game ? (
                    <Text style={{ fontSize: 11, color: "#2CD7E3" }}>
                      {game.shortName}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

export default LiveNow;
export { LiveNow as LiveNowSection };
