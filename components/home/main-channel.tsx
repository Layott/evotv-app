import * as React from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Eye, Lock, Play } from "@/components/icons";

import type { MainChannelResponse } from "@/lib/api/channel";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { PressableScale } from "@/components/common/pressable-scale";
import { Skeleton } from "@/components/ui/skeleton";
import { tokens, useTokens } from "@/lib/theme/tokens";

/**
 * The flagship channel, pinned to the top of home.
 *
 * EVO TV is a channel first and a catalogue second, so one broadcast owns the
 * prime position and keeps it. It does not move down when something else goes
 * live, and it does not disappear when the channel goes off air: a hero that
 * vanishes between broadcasts leaves a hole where the identity of the app
 * should be. Off air it shows what is on next, which is what a viewer actually
 * wants at that moment.
 *
 * Renders nothing at all when no stream has been designated. That is a state
 * only an admin can fix, and an empty rail is better than a placeholder that
 * teaches viewers to ignore the top of the screen.
 */

interface Props {
  data: MainChannelResponse | undefined;
  loading: boolean;
}

/** 09:30 in the channel's own wording: local time, 24h, no seconds. */
function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function LiveBadge() {
  return (
    <View
      className="flex-row items-center gap-1 rounded-md px-2 py-0.5"
      style={{ backgroundColor: "rgba(239,68,68,0.12)" }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" }} />
      <Text style={{ fontSize: 10, fontWeight: "600", letterSpacing: 1, color: "#fca5a5" }}>
        LIVE
      </Text>
    </View>
  );
}

export function MainChannel({ data, loading }: Props) {
  const palette = useTokens();
  const router = useRouter();

  if (loading) {
    return (
      <View className="px-4 pb-2 pt-1">
        <Skeleton className="h-52 w-full rounded-xl" />
      </View>
    );
  }

  const channel = data?.channel;
  if (!channel) return null;

  const onNow = data?.onNow ?? null;
  const upNext = data?.upNext ?? [];

  return (
    <View className="px-4 pb-2 pt-1">
      <PressableScale onPress={() => router.push(`/stream/${channel.id}`)}>
        <View className="overflow-hidden rounded-xl" style={{ backgroundColor: palette.surface }}>
          <View style={{ height: 190 }}>
            <ImageWithFallback
              source={channel.posterUrl || channel.thumbnailUrl}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              fallbackLabel={channel.title.slice(0, 1)}
              tintSeed={channel.id}
            />
            {/* Play affordance and status sit on the art rather than under it,
                so the block reads as one thing you can press. */}
            <View className="absolute inset-0 items-center justify-center">
              <View
                className="h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(5,25,27,0.72)" }}
              >
                {channel.requiresAuth ? (
                  <Lock color={palette.fg} size={22} />
                ) : (
                  <Play color={palette.fg} size={24} />
                )}
              </View>
            </View>
            <View className="absolute left-3 top-3 flex-row items-center gap-2">
              {channel.isLive ? <LiveBadge /> : null}
              {channel.isLive && channel.viewerCount > 0 ? (
                <View
                  className="flex-row items-center gap-1 rounded-md px-2 py-0.5"
                  style={{ backgroundColor: "rgba(5,25,27,0.72)" }}
                >
                  <Eye color={palette.muted} size={11} />
                  <Text style={{ fontSize: 10, color: palette.muted }}>
                    {formatViewers(channel.viewerCount)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="gap-1 p-4">
            <Text
              numberOfLines={1}
              style={{ fontSize: 18, fontWeight: "700", color: palette.fg }}
            >
              {channel.title}
            </Text>

            {/* On air: what is playing. Off air: when it comes back. Never a
                bare "offline", which tells a viewer nothing they can act on. */}
            {onNow ? (
              <Text numberOfLines={1} style={{ fontSize: 13, color: palette.brand }}>
                On now, {onNow.title}
                {onNow.subtitle ? `: ${onNow.subtitle}` : ""}
              </Text>
            ) : upNext.length > 0 ? (
              <Text numberOfLines={1} style={{ fontSize: 13, color: palette.brand }}>
                Back at {timeLabel(upNext[0].airsAt)} with {upNext[0].title}
              </Text>
            ) : channel.tagline ? (
              <Text numberOfLines={1} style={{ fontSize: 13, color: palette.muted }}>
                {channel.tagline}
              </Text>
            ) : null}

            {upNext.length > 0 && onNow ? (
              <Text numberOfLines={1} style={{ fontSize: 12, color: palette.muted }}>
                Up next {timeLabel(upNext[0].airsAt)}, {upNext[0].title}
              </Text>
            ) : null}
          </View>
        </View>
      </PressableScale>
    </View>
  );
}
