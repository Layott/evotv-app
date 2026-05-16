import * as React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Eye, Play } from "lucide-react-native";

import type { Clip } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

interface TrendingClipsProps {
  clips: Clip[];
  loading: boolean;
}

const CARD_WIDTH = 160;

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function SkeletonCard() {
  return (
    <Skeleton
      style={{
        width: CARD_WIDTH,
        aspectRatio: 9 / 16,
        borderRadius: 12,
      }}
    />
  );
}

export function TrendingClips({ clips, loading }: TrendingClipsProps) {
  const router = useRouter();

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-4">
        <Text className="text-xl font-semibold text-foreground">
          Trending Clips
        </Text>
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
          data={[0, 1, 2, 3, 4]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={() => <SkeletonCard />}
        />
      ) : clips.length === 0 ? (
        <View className="mx-4 rounded-xl border border-border bg-card p-6">
          <Text className="text-center text-sm text-muted-foreground">
            No clips are trending yet.
          </Text>
        </View>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={clips}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={({ item: c }) => (
            <Pressable
              onPress={() => router.push(`/clips/${c.id}`)}
              style={{ width: CARD_WIDTH, aspectRatio: 9 / 16 }}
              className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
            >
              <View className="relative h-full w-full">
                <ImageWithFallback
                  source={c.thumbnailUrl}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  fallbackLabel={c.title}
                  tintSeed={c.id}
                  fallbackChildren={<Play size={28} color="rgba(255,255,255,0.35)" />}
                />
                {/* Bottom shadow */}
                <View
                  className="absolute inset-x-0 bottom-0 h-1/2"
                  style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                />

                {/* Creator avatar overlay top-right */}
                {c.creatorAvatarUrl ? (
                  <View
                    className="absolute right-2 top-2 overflow-hidden rounded-full"
                    style={{
                      width: 28,
                      height: 28,
                      borderWidth: 2,
                      borderColor: "rgba(255,255,255,0.4)",
                    }}
                  >
                    <ImageWithFallback
                      source={c.creatorAvatarUrl}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      fallbackLabel={c.creatorHandle}
                      tintSeed={c.creatorHandle}
                    />
                  </View>
                ) : null}

                {/* Play badge centered */}
                <View
                  className="absolute inset-0 items-center justify-center"
                  pointerEvents="none"
                >
                  <View
                    className="items-center justify-center rounded-full"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: "rgba(44,215,227,0.85)",
                    }}
                  >
                    <Play size={18} color="#0A0A0A" fill="#0A0A0A" />
                  </View>
                </View>

                {/* Title + views */}
                <View className="absolute inset-x-2 bottom-2 gap-1">
                  <Text
                    className="text-xs font-semibold text-white"
                    numberOfLines={2}
                  >
                    {c.title}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Eye size={11} color="#d4d4d4" />
                    <Text style={{ fontSize: 10, color: "#d4d4d4" }}>
                      {formatViewers(c.viewCount)}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

export default TrendingClips;
export { TrendingClips as TrendingClipsSection };
