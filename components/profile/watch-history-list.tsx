import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MoreVertical } from "lucide-react-native";

import type { Vod } from "@/lib/types";

interface WatchHistoryItem extends Vod {
  // Optional progress 0–100. If set, renders a progress bar at bottom of thumb.
  progressPct?: number;
  // Optional override for "watched at" timestamp; defaults to publishedAt.
  watchedAt?: string;
}

interface WatchHistoryListProps {
  vods: WatchHistoryItem[];
  onItemMore?: (vod: WatchHistoryItem) => void;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

export function WatchHistoryList({
  vods,
  onItemMore,
}: WatchHistoryListProps) {
  const router = useRouter();

  if (vods.length === 0) {
    return (
      <View
        className="rounded-xl border border-dashed border-border bg-card p-8"
      >
        <Text className="text-center text-sm text-muted-foreground">
          Nothing watched yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      {vods.map((v, i) => {
        const stamp = v.watchedAt ?? v.publishedAt;
        return (
          <View key={v.id}>
            {i > 0 ? (
              <View
                style={{
                  height: 1,
                  backgroundColor: "#262626",
                }}
              />
            ) : null}
            <Pressable
              onPress={() => router.push(`/vod/${v.id}`)}
              className="flex-row items-center gap-3 p-3 active:opacity-80"
            >
              <View
                className="overflow-hidden rounded-md"
                style={{
                  width: 112,
                  aspectRatio: 16 / 9,
                  backgroundColor: "#262626",
                }}
              >
                <Image
                  source={v.thumbnailUrl}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
                {typeof v.progressPct === "number" ? (
                  <View
                    className="absolute inset-x-0 bottom-0"
                    style={{ height: 3, backgroundColor: "#262626" }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${Math.max(0, Math.min(100, v.progressPct))}%`,
                        backgroundColor: "#2CD7E3",
                      }}
                    />
                  </View>
                ) : null}
              </View>

              <View className="min-w-0 flex-1">
                <Text
                  className="text-sm font-semibold text-foreground"
                  numberOfLines={2}
                >
                  {v.title}
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">
                  Viewed {relativeTime(stamp)} &middot;{" "}
                  {Math.floor(v.durationSec / 60)} min
                </Text>
              </View>

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onItemMore?.(v);
                }}
                accessibilityLabel="More actions"
                hitSlop={8}
                className="rounded p-1 active:opacity-60"
              >
                <MoreVertical size={18} color="#737373" />
              </Pressable>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export default WatchHistoryList;
