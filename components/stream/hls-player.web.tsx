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
}: HlsPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [hasStarted, setHasStarted] = React.useState(autoPlay);
  const [errored, setErrored] = React.useState(false);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    let cancelled = false;

    const handleLoaded = () => onLoad?.();
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
  }, [src, autoPlay, muted, onLoad, onError]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

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
