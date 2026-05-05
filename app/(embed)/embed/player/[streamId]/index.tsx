import * as React from "react";
import { Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

import { HLSPlayer } from "@/components/stream/hls-player";
import { streams } from "@/lib/mock/streams";
import { vods } from "@/lib/mock/vods";

const SAMPLE_HLS = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

/**
 * Minimal full-bleed embed player.
 *
 * On the web build, this is what gets rendered inside an external site's
 * iframe — no chrome, just a player + a faint EVO TV brand tag overlay.
 *
 * On native, this route is incidental (native users won't normally land
 * here), but it must still render correctly when deep-linked.
 */
export default function EmbedPlayerScreen() {
  const params = useLocalSearchParams<{
    streamId: string;
    autoplay?: string;
    muted?: string;
  }>();
  const id = params.streamId ?? "";
  const autoplay = params.autoplay === "1";
  const muted = params.muted === "1";

  const stream = streams.find((s) => s.id === id);
  const vod = !stream ? vods.find((v) => v.id === id) : null;

  if (!stream && !vod) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-black">
          <View className="items-center">
            <Text className="text-base font-semibold text-neutral-200">
              Source not found
            </Text>
            <Text className="mt-1 text-xs text-neutral-400">
              This stream or VOD is unavailable.
            </Text>
          </View>
        </View>
      </>
    );
  }

  const title = stream?.title ?? vod?.title ?? "EVO TV";
  const poster = stream?.thumbnailUrl ?? vod?.thumbnailUrl;
  const isLive = !!stream;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center bg-black">
        <HLSPlayer
          src={SAMPLE_HLS}
          poster={poster}
          autoPlay={autoplay}
          muted={muted}
          controls
          className="w-full"
        />
        <BrandTag label={title} live={isLive} />
      </View>
    </>
  );
}

function BrandTag({ label, live }: { label: string; live?: boolean }) {
  return (
    <View
      pointerEvents="none"
      className="absolute flex-row items-center gap-2 rounded-md px-2 py-1"
      style={{
        top: 12,
        left: 12,
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
    >
      <Text
        className="text-[11px] font-bold"
        style={{ color: "#2CD7E3" }}
      >
        EVO TV
      </Text>
      {live ? (
        <View className="flex-row items-center gap-1">
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#EF4444",
            }}
          />
          <Text
            className="text-[11px] font-semibold"
            style={{ color: "#F87171" }}
          >
            LIVE
          </Text>
        </View>
      ) : null}
      <Text
        className="text-[11px] text-neutral-300"
        numberOfLines={1}
        style={{ maxWidth: 200 }}
      >
        · {label}
      </Text>
    </View>
  );
}
