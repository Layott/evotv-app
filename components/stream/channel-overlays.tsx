import * as React from "react";
import { Animated, Easing, Image, Text, View, useWindowDimensions } from "react-native";

/**
 * The channel's on-air furniture, on a phone.
 *
 * The website draws a lower third while a programme runs and a full-screen card
 * between programmes, in ten layouts the owner chose from a preview built over
 * real footage. The app showed none of it, so the same broadcast was announced
 * on a laptop and silent on the device most people watch on.
 *
 * Same ten layouts, same words, same accents. What differs is the toolkit: no
 * CSS keyframes here, so entrances run on `Animated` and the layouts that lean
 * on a viewport-wide grid are laid out with flex instead.
 *
 * Nothing is written per show. The words arrive as props from the schedule, so
 * a programme added this afternoon is announced tonight with nothing redrawn.
 */

export type OverlayStyle = "bar" | "slab" | "ticker" | "plate" | "stack";
export type UpNextStyle = "centre" | "band" | "split" | "countdown" | "lineup";

export interface OverlayCopy {
  /** The programme being announced. */
  title: string;
  /** The slot's own second line: which game, whose session. May be empty. */
  subtitle?: string;
  /** `HH:MM` in the channel's clock. */
  startLabel: string;
  /** What is on right now, when the design says both. */
  nowTitle?: string;
  /** Minutes the programme runs, when the design has room for it. */
  durationMin?: number;
  /** Poster for the designs that carry artwork. */
  posterUrl?: string;
  /** esports | anime | lifestyle, deciding the accent. */
  pillar?: string;
  /** The rest of the evening, for the line-up card. */
  lineup?: { startLabel: string; title: string }[];
  /** Optional artwork behind the card, uploaded by the operator. */
  templateUrl?: string;
}

const BRAND = "#46e3ce";
const GOLD = "#ffd84d";

const PILLAR_COLOR: Record<string, string> = {
  esports: BRAND,
  anime: "#ff5c8a",
  lifestyle: "#ffb43d",
};

function accentFor(pillar?: string): string {
  return PILLAR_COLOR[pillar ?? ""] ?? BRAND;
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "2 hours", "90 min". Broadcast reads hours; anything under one reads minutes. */
export function formatRuntime(minutes: number): string {
  if (minutes >= 120 && minutes % 60 === 0) return `${minutes / 60} hours`;
  if (minutes === 60) return "1 hour";
  return `${minutes} min`;
}

function formatCountdown(seconds?: number): string {
  const safe = Math.max(0, Math.round(seconds ?? 0));
  const m = String(Math.floor(safe / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * The entrance.
 *
 * One hook rather than a library: a card that slides in from the edge it sits
 * on and holds still is the whole vocabulary, and anything more elaborate on a
 * broadcast overlay reads as decoration over somebody's football match.
 */
function useEntrance(from: "bottom" | "left" | "fade", distance = 24) {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  if (from === "fade") return { opacity: progress };

  const axis = from === "bottom" ? "translateY" : "translateX";
  return {
    opacity: progress,
    transform: [
      {
        [axis]: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      } as never,
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Lower third                                                         */
/* ------------------------------------------------------------------ */

export function LowerThird({
  style,
  copy,
}: {
  style: OverlayStyle;
  copy: OverlayCopy;
}) {
  const accent = accentFor(copy.pillar);
  const label = copy.nowTitle ? "Up next" : "On now";
  const enter = useEntrance(style === "ticker" || style === "bar" ? "bottom" : "left");

  if (style === "ticker") {
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: accent,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
          },
          enter,
        ]}
      >
        <Text className="text-[10px] font-bold uppercase text-black">{label}</Text>
        <Dot />
        <Text className="text-[10px] font-bold text-black">{copy.startLabel}</Text>
        <Dot />
        <Text numberOfLines={1} className="flex-1 text-[13px] font-black text-black">
          {copy.title}
        </Text>
      </Animated.View>
    );
  }

  if (style === "slab") {
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: 12,
            bottom: 12,
            maxWidth: "82%",
            flexDirection: "row",
            overflow: "hidden",
            borderRadius: 12,
          },
          enter,
        ]}
      >
        <View
          className="items-center justify-center px-3"
          style={{ backgroundColor: GOLD }}
        >
          <Text className="text-sm font-semibold text-black">{copy.startLabel}</Text>
        </View>
        <View className="bg-black/90 px-3 py-2">
          <Text className="text-[9px] uppercase tracking-widest text-white/60">
            {label}
          </Text>
          <Text numberOfLines={1} className="text-base font-black text-white">
            {copy.title}
          </Text>
          {copy.subtitle ? (
            <Text numberOfLines={1} className="text-[11px]" style={{ color: accent }}>
              {copy.subtitle}
              {copy.durationMin ? ` · ${formatRuntime(copy.durationMin)}` : ""}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    );
  }

  if (style === "plate") {
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: 12,
            bottom: 12,
            maxWidth: "84%",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderRadius: 16,
            backgroundColor: "rgba(0,0,0,.9)",
            padding: 8,
          },
          enter,
        ]}
      >
        <View
          style={{ width: 38, height: 57, backgroundColor: accent }}
          className="items-center justify-center overflow-hidden rounded-lg"
        >
          {copy.posterUrl ? (
            <Image
              source={{ uri: copy.posterUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Text className="text-[10px] font-bold text-black">EVO</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-[9px] uppercase tracking-widest" style={{ color: accent }}>
            {label}
          </Text>
          <Text numberOfLines={1} className="text-base font-black text-white">
            {copy.title}
          </Text>
          <Text className="text-[10px] text-white/60">
            {copy.startLabel}
            {copy.durationMin ? ` · ${formatRuntime(copy.durationMin)}` : ""}
            {copy.pillar ? ` · ${capitalise(copy.pillar)}` : ""}
          </Text>
        </View>
      </Animated.View>
    );
  }

  if (style === "stack") {
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: 12,
            bottom: 12,
            maxWidth: "86%",
            alignItems: "flex-start",
            gap: 6,
          },
          enter,
        ]}
      >
        {copy.nowTitle ? (
          <View className="flex-row items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1">
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" }} />
            <Text numberOfLines={1} className="text-[9px] font-bold uppercase tracking-widest text-white">
              {`On now · ${copy.nowTitle}`}
            </Text>
          </View>
        ) : null}
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: accent }}>
          <Text className="text-[9px] font-bold uppercase tracking-widest text-black">
            {`Up next ${copy.startLabel}`}
          </Text>
        </View>
        <View className="rounded-xl bg-black/90 px-3 py-2">
          <Text numberOfLines={1} className="text-base font-black text-white">
            {copy.title}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // bar, the default
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,.9)",
          flexDirection: "row",
          alignItems: "stretch",
        },
        enter,
      ]}
    >
      <View className="justify-center px-3" style={{ backgroundColor: accent }}>
        <Text className="text-[9px] font-bold uppercase tracking-widest text-black">
          {label}
        </Text>
      </View>
      <View className="flex-1 flex-row items-center gap-3 px-3 py-2">
        <Text className="text-xs" style={{ color: accent }}>
          {copy.startLabel}
        </Text>
        <Text numberOfLines={1} className="flex-1 text-lg font-black text-white">
          {copy.title}
        </Text>
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Full screen                                                         */
/* ------------------------------------------------------------------ */

export function UpNextCard({
  style,
  copy,
  secondsToStart,
}: {
  style: UpNextStyle;
  copy: OverlayCopy;
  /** Only the countdown uses it; the others ignore it. */
  secondsToStart?: number;
}) {
  const accent = accentFor(copy.pillar);
  const art = copy.templateUrl || copy.posterUrl;
  const enter = useEntrance("fade");
  const { width } = useWindowDimensions();
  // The split card gives its left half to the words. Below a certain width
  // that leaves room for about four characters, so it stacks instead.
  const narrow = width < 480;

  if (style === "band") {
    return (
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", inset: 0, backgroundColor: "#000" }, enter]}
      >
        {art ? (
          <Image
            source={{ uri: art }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : null}
        <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-between gap-3 bg-black/90 px-5 py-4">
          <View className="flex-1">
            <Text className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>
              Up next
            </Text>
            <Text numberOfLines={1} className="text-2xl font-black text-white">
              {copy.title}
            </Text>
            {copy.subtitle ? (
              <Text numberOfLines={1} className="text-xs text-white/60">
                {copy.subtitle}
              </Text>
            ) : null}
          </View>
          <Text className="text-xl font-semibold" style={{ color: GOLD }}>
            {copy.startLabel}
          </Text>
        </View>
      </Animated.View>
    );
  }

  if (style === "split") {
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", inset: 0, backgroundColor: "#000", flexDirection: "row" },
          enter,
        ]}
      >
        <View style={{ width: 6, backgroundColor: accent }} />
        <View
          className="justify-center gap-1 px-5"
          style={{ width: narrow ? "100%" : "46%" }}
        >
          <Text className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>
            Up next
          </Text>
          <Text className="text-2xl font-black text-white">{copy.title}</Text>
          <Text className="text-base font-semibold" style={{ color: GOLD }}>
            {copy.startLabel}
            {copy.durationMin ? ` · ${formatRuntime(copy.durationMin)}` : ""}
          </Text>
        </View>
        {narrow ? null : (
          <View className="flex-1 overflow-hidden">
            {art ? (
              <Image
                source={{ uri: art }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : null}
          </View>
        )}
      </Animated.View>
    );
  }

  if (style === "countdown") {
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            inset: 0,
            backgroundColor: "#000",
            justifyContent: "center",
            gap: 4,
            paddingHorizontal: 24,
          },
          enter,
        ]}
      >
        <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, backgroundColor: GOLD }} />
        <Text className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>
          Starts in
        </Text>
        <Text className="text-5xl font-semibold" style={{ color: accent }}>
          {formatCountdown(secondsToStart)}
        </Text>
        <Text className="mt-2 text-2xl font-black text-white">{copy.title}</Text>
        <View
          className="mt-2 self-start rounded-full px-2.5 py-1"
          style={{ backgroundColor: accent }}
        >
          <Text className="text-[9px] font-bold uppercase tracking-widest text-black">
            {`${capitalise(copy.pillar ?? "esports")} · ${copy.startLabel}`}
          </Text>
        </View>
      </Animated.View>
    );
  }

  if (style === "lineup") {
    const rows = copy.lineup?.length
      ? copy.lineup
      : [{ startLabel: copy.startLabel, title: copy.title }];
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            inset: 0,
            backgroundColor: "#000",
            justifyContent: "center",
            gap: 8,
            paddingHorizontal: 24,
          },
          enter,
        ]}
      >
        <Text className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>
          Coming up on EVO TV
        </Text>
        {rows.slice(0, 4).map((row, i) => (
          <View key={`${row.startLabel}-${row.title}`} className="flex-row items-baseline gap-4">
            <Text
              style={{ width: 52, color: i === 0 ? GOLD : "rgba(255,255,255,.5)" }}
            >
              {row.startLabel}
            </Text>
            <Text
              numberOfLines={1}
              className={
                i === 0
                  ? "flex-1 text-2xl font-black text-white"
                  : "flex-1 text-base font-bold text-white/50"
              }
            >
              {row.title}
            </Text>
          </View>
        ))}
      </Animated.View>
    );
  }

  // centre, the default
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          inset: 0,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingHorizontal: 24,
        },
        enter,
      ]}
    >
      <Text className="text-[10px] uppercase tracking-widest" style={{ color: accent }}>
        Up next
      </Text>
      <Text className="text-center text-4xl font-black text-white">{copy.title}</Text>
      <Text className="text-lg font-semibold" style={{ color: GOLD }}>
        {copy.startLabel}
        {copy.durationMin ? ` · ${formatRuntime(copy.durationMin)}` : ""}
      </Text>
      {copy.lineup && copy.lineup.length > 1 ? (
        <Text className="mt-3 text-center text-[11px] text-white/50">
          {`Then ${copy.lineup
            .slice(1, 3)
            .map((row) => `${row.startLabel} ${row.title}`)
            .join(" · ")}`}
        </Text>
      ) : null}
    </Animated.View>
  );
}

function Dot() {
  return (
    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,.7)" }} />
  );
}
