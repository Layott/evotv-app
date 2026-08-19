import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";
import { Maximize, Pause, Play, Volume2, VolumeX } from "@/components/icons";

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
  /** Resume playback at this position (seconds) once the player is ready.
   *  Pass `null` / undefined / 0 to start from the beginning. */
  startAtSec?: number | null;
  /** Fires once when playback reaches the end of media. Used to mark a
   *  VOD/episode as completed in watch progress. */
  onEnded?: () => void;
  /**
   * A live broadcast rather than a recording.
   *
   * Swaps the platform's control bar for the three controls a broadcast
   * actually has. The website's live player dropped its scrub bar and skip
   * buttons for a reason: every second scrubbed back is latency the viewer
   * cannot see the value of, and landing near the live edge re-buffers on
   * arrival.
   *
   * `requiresLinearPlayback` alone was not enough. It takes the skip buttons
   * away and stops the bar responding to a drag, but ExoPlayer still draws the
   * bar - pinned full-width at the live edge, which is what it means, and what
   * nobody reads it as. A control that cannot be operated should not be on
   * screen, so live gets its own controls instead of the platform's.
   */
  isLive?: boolean;
}

/** How long the live controls stay up after a tap. */
const CONTROLS_HIDE_MS = 3500;

export function HlsPlayer({
  src,
  poster,
  autoPlay = true,
  // Sound on. A browser will not autoplay with audio, so the web player has to
  // start muted and offer a way back; a phone has no such rule, and this
  // default had every screen in the app playing silently with no control to
  // undo it - ExoPlayer's bar has no volume button.
  muted = false,
  controls = true,
  className,
  onLoad,
  onError,
  onProgress,
  progressIntervalMs = 15_000,
  startAtSec,
  onEnded,
  isLive = false,
}: HlsPlayerProps) {
  const palette = useTokens();
  const [hasStarted, setHasStarted] = React.useState(autoPlay);
  const [errored, setErrored] = React.useState(false);

  // Live-only control state. `fullscreenChrome` hands the platform its control
  // bar back for the fullscreen activity, which is a separate Activity that our
  // overlay cannot reach - without it the viewer lands in fullscreen with no
  // visible way out. It goes off again on exit so the inline player stays bare.
  const videoRef = React.useRef<VideoView>(null);
  const [playing, setPlaying] = React.useState(autoPlay);
  const [isMuted, setIsMuted] = React.useState(muted);
  const [controlsShown, setControlsShown] = React.useState(false);
  const [fullscreenChrome, setFullscreenChrome] = React.useState(false);

  const source = React.useMemo<VideoSource>(() => ({ uri: src }), [src]);

  const player = useVideoPlayer(source, (p) => {
    p.muted = muted;
    p.loop = false;
    if (autoPlay) p.play();
  });

  // Listen for status changes to surface load/error. On readyToPlay we
  // also apply the optional startAtSec seek (one-shot per mount via the
  // seekedRef latch - never re-seek if the user has manually scrubbed).
  const seekedRef = React.useRef(false);
  React.useEffect(() => {
    const sub = player.addListener("statusChange", (event) => {
      if (event.status === "readyToPlay") {
        if (
          !seekedRef.current &&
          typeof startAtSec === "number" &&
          startAtSec > 0
        ) {
          seekedRef.current = true;
          try {
            player.currentTime = startAtSec;
          } catch {
            /* ignore */
          }
        }
        onLoad?.();
      } else if (event.status === "error") {
        setErrored(true);
        onError?.(event.error ?? new Error("Playback error"));
      }
    });
    return () => {
      sub.remove();
    };
  }, [player, onLoad, onError, startAtSec]);

  React.useEffect(() => {
    player.muted = muted;
    setIsMuted(muted);
  }, [player, muted]);

  // Mirror the player's own play/mute state rather than assuming our button
  // presses are the only thing that moves it: a notification, a headset button
  // or the fullscreen activity's controls all change it behind our back.
  React.useEffect(() => {
    if (!isLive) return;
    const playSub = player.addListener("playingChange", (e) => {
      setPlaying(e.isPlaying);
    });
    const muteSub = player.addListener("mutedChange", (e) => {
      setIsMuted(e.muted);
    });
    return () => {
      playSub.remove();
      muteSub.remove();
    };
  }, [player, isLive]);

  // Controls come up on a tap and go away on their own, but only while
  // playing - leaving them up over a paused frame is what every player does,
  // because a paused player with no controls looks broken.
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearHideTimer = React.useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);
  const revealControls = React.useCallback(() => {
    setControlsShown(true);
    clearHideTimer();
    if (player.playing) {
      hideTimer.current = setTimeout(() => setControlsShown(false), CONTROLS_HIDE_MS);
    }
  }, [clearHideTimer, player]);
  React.useEffect(() => clearHideTimer, [clearHideTimer]);

  const togglePlay = React.useCallback(() => {
    if (player.playing) player.pause();
    else player.play();
    revealControls();
  }, [player, revealControls]);

  const toggleMuted = React.useCallback(() => {
    player.muted = !player.muted;
    setIsMuted(player.muted);
    revealControls();
  }, [player, revealControls]);

  // Enabling the platform chrome and opening fullscreen cannot happen in the
  // same tick: the Activity reads `useNativeControls` off the view as it
  // starts, so the prop has to have reached the native side first. The effect
  // runs after that commit, which is exactly the ordering we need.
  const pendingFullscreen = React.useRef(false);
  const enterFullscreen = React.useCallback(() => {
    clearHideTimer();
    if (!isLive) {
      void videoRef.current?.enterFullscreen().catch(() => {});
      return;
    }
    pendingFullscreen.current = true;
    setFullscreenChrome(true);
  }, [clearHideTimer, isLive]);

  React.useEffect(() => {
    if (!fullscreenChrome || !pendingFullscreen.current) return;
    pendingFullscreen.current = false;
    void videoRef.current?.enterFullscreen().catch(() => {
      setFullscreenChrome(false);
    });
  }, [fullscreenChrome]);

  // Progress beacon - fires `onProgress(positionSec)` on a fixed cadence
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

  // playbackStatusChange / playToEnd → fire onEnded once per mount.
  const endedFiredRef = React.useRef(false);
  React.useEffect(() => {
    if (!onEnded) return;
    const sub = player.addListener("playToEnd", () => {
      if (endedFiredRef.current) return;
      endedFiredRef.current = true;
      onEnded();
    });
    return () => {
      sub.remove();
    };
  }, [player, onEnded]);

  const handleTap = React.useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true);
      player.play();
      setPlaying(true);
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
        ref={videoRef}
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
        /*
         * A recording keeps the platform's controls, because scrubbing a
         * recording is the point. A broadcast has none of them: the bar it
         * draws cannot be dragged and does not measure anything, so live gets
         * the overlay below instead. The one exception is fullscreen, which
         * runs in an Activity the overlay cannot reach.
         */
        nativeControls={controls && hasStarted && (!isLive || fullscreenChrome)}
        /*
         * Belt and braces on live: even with the platform bar showing in
         * fullscreen, there is nothing to seek to.
         * `requiresLinearPlayback` removes skipping on both iOS and Android;
         * `showsTimecodes` hides the position readout on iOS, where a clock
         * against a stream with no beginning means nothing.
         */
        requiresLinearPlayback={isLive}
        showsTimecodes={!isLive}
        allowsFullscreen
        allowsPictureInPicture
        startsPictureInPictureAutomatically
        onFullscreenExit={() => {
          setFullscreenChrome(false);
        }}
      />

      {/* Live controls: what a broadcast actually has. Play, sound, size. */}
      {isLive && hasStarted && !fullscreenChrome ? (
        <Pressable
          onPress={() => (controlsShown ? setControlsShown(false) : revealControls())}
          accessibilityRole="button"
          accessibilityLabel={controlsShown ? "Hide controls" : "Show controls"}
          className="absolute inset-0"
        >
          {controlsShown ? (
            <View
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.28)" }}
            >
              <View className="absolute inset-0 items-center justify-center">
                <Pressable
                  onPress={togglePlay}
                  accessibilityRole="button"
                  accessibilityLabel={playing ? "Pause" : "Play"}
                  hitSlop={8}
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                >
                  {playing ? (
                    <Pause size={24} color="#FFFFFF" />
                  ) : (
                    <Play size={24} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>

              <View className="absolute bottom-3 right-3 flex-row items-center gap-2">
                <Pressable
                  onPress={toggleMuted}
                  accessibilityRole="button"
                  accessibilityLabel={isMuted ? "Unmute" : "Mute"}
                  hitSlop={8}
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                >
                  {isMuted ? (
                    <VolumeX size={17} color="#FFFFFF" />
                  ) : (
                    <Volume2 size={17} color="#FFFFFF" />
                  )}
                </Pressable>
                <Pressable
                  onPress={enterFullscreen}
                  accessibilityRole="button"
                  accessibilityLabel="Fullscreen"
                  hitSlop={8}
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                >
                  <Maximize size={17} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ) : null}
        </Pressable>
      ) : null}

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
                backgroundColor: "rgba(70,227,206,0.9)",
              }}
            >
              <Play size={28} color={palette.bg} />
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
