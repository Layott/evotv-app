import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import type { Vod } from "@/lib/types";

function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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

export function VodRelated({ vods }: { vods: Vod[] }) {
  const router = useRouter();
  if (!vods || vods.length === 0) return null;
  return (
    <View>
      <Text className="text-lg font-semibold text-foreground mb-3">
        Related VODs
      </Text>
      <View className="gap-3">
        {vods.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => router.push(`/vod/${v.id}`)}
            className="overflow-hidden rounded-lg border border-border bg-card active:opacity-80"
          >
            <View className="relative" style={{ aspectRatio: 16 / 9 }}>
              <Image
                source={v.thumbnailUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <View
                className="absolute right-1.5 bottom-1.5 rounded px-1.5 py-0.5"
                style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: "#fff",
                    fontFamily: "monospace",
                  }}
                >
                  {fmtDuration(v.durationSec)}
                </Text>
              </View>
              {v.isPremium ? (
                <View
                  className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5"
                  style={{ backgroundColor: "#f59e0b" }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      color: "#000",
                      fontWeight: "700",
                      letterSpacing: 0.4,
                    }}
                  >
                    PREMIUM
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="px-3 py-2">
              <Text
                className="text-sm font-medium text-foreground"
                numberOfLines={2}
              >
                {v.title}
              </Text>
              <Text
                className="mt-1 text-xs text-muted-foreground"
                numberOfLines={1}
              >
                {compact(v.viewCount)} views · {relTime(v.publishedAt)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default VodRelated;
