import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Heart, Play } from "lucide-react-native";

import { listTrendingClips } from "@/lib/mock/vods";
import type { Clip } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function ClipCard({ clip }: { clip: Clip }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/clips/${clip.id}`)}
      style={{ flex: 1, aspectRatio: 9 / 16 }}
      className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
    >
      <View className="relative h-full w-full">
        <Image
          source={clip.thumbnailUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          pointerEvents="none"
        />

        {/* Play indicator */}
        <View
          className="absolute left-2 top-2 flex-row items-center gap-1 rounded px-1.5 py-0.5"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <Play size={11} color="#fff" />
          <Text style={{ fontSize: 10, color: "#fff" }}>
            {compact(clip.viewCount)}
          </Text>
        </View>
        <View
          className="absolute right-2 top-2 flex-row items-center gap-1 rounded px-1.5 py-0.5"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <Heart size={11} color="#fff" />
          <Text style={{ fontSize: 10, color: "#fff" }}>
            {compact(clip.likeCount)}
          </Text>
        </View>

        <View className="absolute inset-x-2 bottom-2 gap-0.5">
          <Text
            className="text-xs font-semibold text-white"
            numberOfLines={2}
          >
            {clip.title}
          </Text>
          <View className="flex-row items-center justify-between">
            <Text style={{ fontSize: 10, color: "#d4d4d4" }} numberOfLines={1}>
              @{clip.creatorHandle}
            </Text>
            <Text style={{ fontSize: 10, color: "#a3a3a3" }}>
              {relTime(clip.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function ClipsScreen() {
  const { data: clips, isLoading } = useQuery({
    queryKey: ["clips", "trending"],
    queryFn: () => listTrendingClips(24),
  });

  // Build pairs of clips for two-column rendering.
  const rows = React.useMemo(() => {
    const list = clips ?? [];
    const out: Clip[][] = [];
    for (let i = 0; i < list.length; i += 2) {
      out.push(list.slice(i, i + 2));
    }
    return out;
  }, [clips]);

  return (
    <>
      <Stack.Screen options={{ title: "Clips" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Flame size={22} color="#fbbf24" />
              <Text className="text-2xl font-bold text-foreground">
                Trending Clips
              </Text>
            </View>
            <Badge variant="outline">
              {(clips?.length ?? 0).toString()} clips
            </Badge>
          </View>
          <Text className="mt-1 text-sm text-muted-foreground">
            Bite-sized highlights from tonight's biggest matches.
          </Text>
        </View>

        {isLoading ? (
          <View className="px-4">
            <View className="flex-row gap-3">
              {[0, 1].map((i) => (
                <Skeleton
                  key={i}
                  style={{ flex: 1, aspectRatio: 9 / 16, borderRadius: 12 }}
                />
              ))}
            </View>
            <View className="mt-3 flex-row gap-3">
              {[2, 3].map((i) => (
                <Skeleton
                  key={i}
                  style={{ flex: 1, aspectRatio: 9 / 16, borderRadius: 12 }}
                />
              ))}
            </View>
          </View>
        ) : !clips || clips.length === 0 ? (
          <View className="px-4 py-10">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No clips right now</EmptyTitle>
                <EmptyDescription>
                  Check back after tonight's matches for fresh highlights.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </View>
        ) : (
          <View className="px-4 gap-3">
            {rows.map((row, i) => (
              <View key={`row-${i}`} className="flex-row gap-3">
                {row.map((c) => (
                  <ClipCard key={c.id} clip={c} />
                ))}
                {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}
