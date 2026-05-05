import * as React from "react";
import { Text, View } from "react-native";

import { cn } from "@/lib/utils";

type Tone = "emerald" | "amber" | "red" | "blue" | "neutral" | "violet";

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
    bg: "bg-neutral-700/40",
    text: "text-neutral-300",
    ring: "border-neutral-600/50",
    dot: "bg-neutral-400",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-300",
    ring: "border-violet-500/30",
    dot: "bg-violet-400",
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
