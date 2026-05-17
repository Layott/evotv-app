import * as React from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { Play } from "lucide-react-native";
import Hls from "hls.js";

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
  /** Resume playback at this position (seconds) once the video is loaded.
   *  Pass `null` / undefined / 0 to start from the beginning. */
  startAtSec?: number | null;
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
  startAtSec,
}: HlsPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [hasStarted, setHasStarted] = React.useState(autoPlay);
  const [errored, setErrored] = React.useState(false);
  // One-shot seek latch — never re-seek if user has manually scrubbed.
  const seekedRef = React.useRef(false);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    let cancelled = false;

    const handleLoaded = () => {
      if (
        !seekedRef.current &&
        typeof startAtSec === "number" &&
        startAtSec > 0
      ) {
        seekedRef.current = true;
        try {
          video.currentTime = startAtSec;
        } catch {
          /* ignore */
        }
      }
      onLoad?.();
    };
    const handleError = (event: Event) => {
      if (cancelled) return;
      setErrored(true);
      onError?.(event);
    };

    const nativeHlsSupported =
      video.canPlayType("application/vnd.apple.mpegurl") !== "" ||
      video.canPlayType("application/x-mpegURL") !== "";

    if (nativeHlsSupported) {
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          setErrored(true);
          onError?.(data);
        }
      });
    } else {
      video.src = src;
    }

    video.addEventListener("loadeddata", handleLoaded);
    video.addEventListener("error", handleError);

    if (autoPlay) {
      video.muted = muted;
      void video.play().catch(() => {
        /* autoplay blocked — user must tap */
      });
    }

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", handleLoaded);
      video.removeEventListener("error", handleError);
      if (hls) {
        hls.destroy();
        hls = null;
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [src, autoPlay, muted, onLoad, onError, startAtSec]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

  // Progress beacon — polls video.currentTime on a fixed cadence. We avoid
  // 'timeupdate' here because it fires multiple times per second and would
  // hammer the network if the parent persists every emit.
  React.useEffect(() => {
    if (!onProgress) return;
    const id = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused) return;
      const t = video.currentTime;
      if (typeof t === "number" && Number.isFinite(t) && t > 0) {
        onProgress(Math.floor(t));
      }
    }, progressIntervalMs);
    return () => {
      clearInterval(id);
    };
  }, [onProgress, progressIntervalMs]);

  const handleTap = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!hasStarted) {
      setHasStarted(true);
      void video.play().catch(() => {});
      return;
    }
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  }, [hasStarted]);

  return (
    <View
      className={cn("relative overflow-hidden bg-black aspect-video", className)}
    >
      {React.createElement("video", {
        ref: videoRef,
        playsInline: true,
        controls: controls && hasStarted,
        muted,
        autoPlay,
        poster,
        style: { width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000" },
      })}

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
          <View>
            {React.createElement(
              "span",
              { style: { color: "#D4D4D4", fontSize: 14 } },
              "Stream unavailable",
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default HlsPlayer;
export { HlsPlayer as HLSPlayer };
