import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { MaturityBadge } from "@/components/common/maturity-badge";
import { PressableScale } from "@/components/common/pressable-scale";
import { useRouter } from "expo-router";
import { Eye, Play } from "@/components/icons";

import type { Stream } from "@/lib/types";

interface HeroCarouselProps {
  streams: Stream[];
  intervalMs?: number;
}

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function HeroCarousel({ streams, intervalMs = 5000 }: HeroCarouselProps) {
  const palette = useTokens();
  const router = useRouter();
  const listRef = React.useRef<FlatList<Stream>>(null);
  const [index, setIndex] = React.useState(0);
  const [width, setWidth] = React.useState(
    () => Dimensions.get("window").width,
  );

  const onViewableItemsChanged = React.useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const first = viewableItems[0];
        if (typeof first?.index === "number") setIndex(first.index);
      }
    },
  ).current;

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // Auto-advance
  React.useEffect(() => {
    if (streams.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % streams.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [streams.length, intervalMs]);

  if (streams.length === 0) {
    return (
      <View
        className="h-48 items-center justify-center rounded-xl border border-border bg-card"
      >
        <Text className="text-sm text-muted-foreground">
          No featured streams right now.
        </Text>
      </View>
    );
  }

  return (
    <View
      className="relative overflow-hidden rounded-xl"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <FlatList
        ref={listRef}
        data={streams}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_data, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        renderItem={({ item: s }) => (
          <PressableScale
            onPress={() => router.push(`/stream/${s.id}`)}
            style={{ width, aspectRatio: 16 / 9 }}
            className="relative"
          >
            <ImageWithFallback
              source={s.thumbnailUrl}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              fallbackLabel={s.title}
              tintSeed={s.id}
            />
            {/* Bottom-fade overlay (no gradient dep - solid view with opacity stacks) */}
            <View
              className="absolute inset-x-0 bottom-0 h-1/2"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            />
            <View className="absolute inset-x-0 bottom-0 gap-1 p-4">
              <View className="flex-row items-center gap-2">
                <View
                  className="flex-row items-center gap-1 rounded-md px-2 py-0.5"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.25)",
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
                <MaturityBadge rating={s.maturityRating} />
                {typeof s.viewerCount === "number" ? (
                  <View className="flex-row items-center gap-1">
                    <Eye size={12} color="#d4d4d4" />
                    <Text className="text-xs text-neutral-300">
                      {formatViewers(s.viewerCount)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                className="text-lg font-bold text-white"
                numberOfLines={2}
              >
                {s.title}
              </Text>
              <Text className="text-xs text-neutral-300" numberOfLines={1}>
                {s.streamerName}
              </Text>
              <View
                className="mt-1 flex-row items-center gap-2 self-start rounded-md px-3 py-1.5"
                style={{ backgroundColor: palette.brand }}
              >
                <Play size={14} color={palette.bg} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: palette.bg,
                  }}
                >
                  Watch now
                </Text>
              </View>
            </View>
          </PressableScale>
        )}
      />

      {/* Page indicators */}
      <View className="absolute bottom-3 right-3 flex-row gap-1.5">
        {streams.map((_, i) => (
          <Pressable
            key={i}
            accessibilityLabel={`Slide ${i + 1}`}
            onPress={() => {
              listRef.current?.scrollToIndex({ index: i, animated: true });
              setIndex(i);
            }}
            style={{
              height: 6,
              width: i === index ? 24 : 6,
              borderRadius: 3,
              backgroundColor:
                i === index ? palette.brand : "rgba(115,115,115,0.6)",
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default HeroCarousel;
