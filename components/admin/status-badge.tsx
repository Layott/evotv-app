import * as React from "react";
import { Text, View } from "react-native";

import { cn } from "@/lib/utils";

/**
 * `violet` is gone on purpose.
 *
 * Its four call sites were labelling a kind rather than a state: an ad's type,
 * a content type, "Episode", a streamer type. Colour on this platform is meant
 * to carry meaning - live, paid, failed, blocked - and a kind has no state to
 * report, so it takes `neutral` and the word does the work. Violet on dark is
 * also the exact palette the no-vibecoded-look rule names.
 */
type Tone = "emerald" | "amber" | "red" | "blue" | "neutral";

const toneClasses: Record<Tone, { bg: string; text: string; ring: string; dot: string }> = {
  emerald: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-300",
    ring: "border-cyan-500/30",
    dot: "bg-cyan-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    ring: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-300",
    ring: "border-red-500/30",
    dot: "bg-red-400",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-300",
    ring: "border-blue-500/30",
    dot: "bg-blue-400",
  },
  neutral: {
    bg: "bg-muted/40",
    text: "text-neutral-300",
    ring: "border-neutral-600/50",
    dot: "bg-neutral-400",
  },
};

export interface StatusBadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  dot,
}: StatusBadgeProps) {
  const t = toneClasses[tone];
  return (
    <View
      className={cn(
        "flex-row items-center self-start rounded-md border px-2 py-0.5",
        t.bg,
        t.ring,
        className,
      )}
    >
      {dot ? (
        <View className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", t.dot)} />
      ) : null}
      <Text className={cn("text-xs font-medium", t.text)}>
        {children as React.ReactNode}
      </Text>
    </View>
  );
}
