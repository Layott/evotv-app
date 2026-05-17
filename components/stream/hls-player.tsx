import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";
import { Play } from "lucide-react-native";

import { cn } from "@/lib/utils";

export interface HlsPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: (error: unknown) => void;
  /** Fires every `progressIntervalMs` while playing with the player's current
   *  position in seconds. Used to persist VOD watch progress. */
  onProgress?: (positionSec: number) => void;
  /** Defaults to 15000ms. Cap on how often onProgress fires. */
  progressIntervalMs?: number;
}

export function HlsPlayer({
  src,
  poster,
  autoPlay = true,
  muted = true,
  controls = true,
  className,
  onLoad,
  onError,
  onProgress,
  progressIntervalMs = 15_000,
}: HlsPlayerProps) {
  const [hasStarted, setHasStarted] = React.useState(autoPlay);
  const [errored, setErrored] = React.useState(false);

  const source = React.useMemo<VideoSource>(() => ({ uri: src }), [src]);

  const player = useVideoPlayer(source, (p) => {
    p.muted = muted;
    p.loop = false;
    if (autoPlay) p.play();
  });

  // Listen for status changes to surface load/error.
  React.useEffect(() => {
    const sub = player.addListener("statusChange", (event) => {
      if (event.status === "readyToPlay") {
        onLoad?.();
      } else if (event.status === "error") {
        setErrored(true);
        onError?.(event.error ?? new Error("Playback error"));
      }
    });
    return () => {
      sub.remove();
    };
  }, [player, onLoad, onError]);

  React.useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  // Progress beacon — fires `onProgress(positionSec)` on a fixed cadence
  // while the player is mounted. We intentionally poll instead of listening
  // to a high-frequency event so the parent can write to a remote endpoint
  // without throttling.
  React.useEffect(() => {
    if (!onProgress) return;
    const id = setInterval(() => {
      const t = player.currentTime;
      if (typeof t === "number" && Number.isFinite(t) && t > 0) {
        onProgress(Math.floor(t));
      }
    }, progressIntervalMs);
    return () => {
      clearInterval(id);
    };
  }, [player, onProgress, progressIntervalMs]);

  const handleTap = React.useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true);
      player.play();
      return;
    }
    if (player.playing) player.pause();
    else player.play();
  }, [hasStarted, player]);

  return (
    <View
      className={cn("relative overflow-hidden bg-black aspect-video", className)}
    >
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        nativeControls={controls && hasStarted}
        allowsFullscreen
        allowsPictureInPicture
      />

      {/* Poster overlay (covers until first play) */}
      {!hasStarted && poster ? (
        <Pressable
          onPress={handleTap}
          accessibilityRole="button"
          accessibilityLabel="Play video"
          className="absolute inset-0"
        >
          <Image
            source={poster}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <View className="absolute inset-0 items-center justify-center">
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: 64,
                height: 64,
                backgroundColor: "rgba(44,215,227,0.9)",
              }}
            >
              <Play size={28} color="#0A0A0A" fill="#0A0A0A" />
            </View>
          </View>
        </Pressable>
      ) : null}

      {errored ? (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        >
          <Text className="text-sm text-neutral-300">Stream unavailable</Text>
        </View>
      ) : null}
    </View>
  );
}

export default HlsPlayer;
export { HlsPlayer as HLSPlayer };
