import * as React from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/_client";
import {
  LowerThird,
  UpNextCard,
  type OverlayCopy,
  type OverlayStyle,
  type UpNextStyle,
} from "@/components/stream/channel-overlays";

/**
 * The channel's rhythm, over the app's player.
 *
 * The website reads `/api/channel/breaks` for the timings an operator set on
 * the Ads page and draws the on-air cards on that schedule. The app drew
 * nothing, so the same broadcast announced itself on a laptop and said nothing
 * on the device most people watch on.
 *
 * Timings, rotation and the on/off switches all come from that one endpoint,
 * so changing them on the dashboard changes both surfaces with no app release.
 *
 * Ad breaks are deliberately not here. Cutting away to an ad needs the player
 * to swap sources and come back to the live edge, which is a different job from
 * drawing a card over it, and half an implementation of that is worse than
 * none.
 */

interface BreaksConfig {
  enabled: boolean;
  overlayIntervalMin: number;
  overlayDurationSec: number;
  lowerThirdStyles?: OverlayStyle[];
  lowerThirdStyle?: OverlayStyle;
  lowerThirdUrl?: string;
  upNextStyles?: UpNextStyle[];
  upNextStyle?: UpNextStyle;
  upNextUrl?: string;
  upNextLeadMin?: number;
  upNextSec?: number;
}

export interface NowNext {
  now: { title: string; subtitle?: string } | null;
  next: {
    title: string;
    startLabel: string;
    /** ISO instant, so the full-screen card knows when to arrive. */
    airsAt?: string;
    subtitle?: string;
    durationMin?: number;
    pillar?: string;
    posterUrl?: string;
  } | null;
  lineup?: { startLabel: string; title: string }[];
}

/**
 * The layout for this appearance.
 *
 * An empty list means the operator switched that card off, and the caller has
 * already decided whether to render at all, so the fallback keeps it honest
 * rather than silently reviving a disabled card.
 */
function pickStyle<T extends string>(list: T[] | undefined, fallback: T, shown: number): T {
  if (!list || list.length === 0) return fallback;
  return list[shown % list.length]!;
}

export function ChannelOverlayHost({ nowNext }: { nowNext?: NowNext | null }) {
  const configQ = useQuery({
    queryKey: ["channel", "breaks"],
    queryFn: () => api<BreaksConfig>("/api/channel/breaks"),
    staleTime: 60_000,
  });
  const config = configQ.data ?? null;

  const [cardVisible, setCardVisible] = React.useState(false);
  const [upNextVisible, setUpNextVisible] = React.useState(false);
  const [secondsToNext, setSecondsToNext] = React.useState(0);
  /*
   * Which layout this appearance uses.
   *
   * Counting appearances rather than picking at random means the sequence is
   * predictable, which matters when somebody is checking that a particular card
   * looks right on air.
   */
  const lowerThirdShown = React.useRef(0);
  const upNextShown = React.useRef(0);
  /** The programme the full-screen card has already announced. */
  const announced = React.useRef<string | null>(null);

  // ------------------------------------------------------------ on-air card
  React.useEffect(() => {
    if (!config?.enabled || config.overlayIntervalMin <= 0 || !nowNext?.now) return;
    if (config.lowerThirdStyles && config.lowerThirdStyles.length === 0) return;
    const every = config.overlayIntervalMin * 60_000;
    const id = setInterval(() => {
      lowerThirdShown.current += 1;
      setCardVisible(true);
      setTimeout(() => setCardVisible(false), config.overlayDurationSec * 1000);
    }, every);
    return () => clearInterval(id);
  }, [config, nowNext]);

  /*
   * The full-screen card, in the last minutes before a programme starts.
   *
   * Once per programme, not on a cycle: an announcement that repeats every few
   * minutes stops being an announcement and becomes an interruption. The
   * programme's own start time is the key, so a schedule change re-arms it and
   * a screen left open overnight does not replay last night's card.
   */
  React.useEffect(() => {
    if (config?.upNextStyles && config.upNextStyles.length === 0) return;
    const lead = config?.upNextLeadMin ?? 0;
    const airsAt = nowNext?.next?.airsAt;
    if (!lead || !airsAt) return;

    const tick = () => {
      const seconds = Math.round((new Date(airsAt).getTime() - Date.now()) / 1000);
      setSecondsToNext(Math.max(0, seconds));
      if (seconds <= 0 || seconds > lead * 60) return;
      if (announced.current === airsAt) return;
      announced.current = airsAt;
      upNextShown.current += 1;
      setUpNextVisible(true);
      setTimeout(() => setUpNextVisible(false), (config?.upNextSec ?? 10) * 1000);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [config, nowNext]);

  if (!config) return null;

  const next = nowNext?.next ?? null;
  const now = nowNext?.now ?? null;

  const lowerCopy: OverlayCopy | null = now
    ? {
        title: now.title,
        subtitle: now.subtitle,
        startLabel: next?.startLabel ?? "",
        nowTitle: undefined,
        pillar: next?.pillar,
        posterUrl: next?.posterUrl,
        templateUrl: config.lowerThirdUrl || undefined,
      }
    : null;

  const upNextCopy: OverlayCopy | null = next
    ? {
        title: next.title,
        subtitle: next.subtitle,
        startLabel: next.startLabel,
        durationMin: next.durationMin,
        pillar: next.pillar,
        posterUrl: next.posterUrl,
        nowTitle: now?.title,
        lineup: nowNext?.lineup,
        templateUrl: config.upNextUrl || undefined,
      }
    : null;

  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
      {cardVisible && lowerCopy ? (
        <LowerThird
          // Remounting on every appearance is what replays the entrance.
          key={`lt-${lowerThirdShown.current}`}
          style={pickStyle(
            config.lowerThirdStyles,
            config.lowerThirdStyle ?? "bar",
            lowerThirdShown.current,
          )}
          copy={lowerCopy}
        />
      ) : null}
      {upNextVisible && upNextCopy ? (
        <UpNextCard
          key={`un-${upNextShown.current}`}
          style={pickStyle(
            config.upNextStyles,
            config.upNextStyle ?? "centre",
            upNextShown.current,
          )}
          copy={upNextCopy}
          secondsToStart={secondsToNext}
        />
      ) : null}
    </View>
  );
}

export default ChannelOverlayHost;
