import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { Text, View, type ViewProps } from "react-native";
import { Coins } from "lucide-react-native";

import { cn } from "@/lib/utils";

export type CoinTone = "amber" | "muted" | "sky";

export interface CoinPillProps extends ViewProps {
  coins: number;
  tone?: CoinTone;
  iconSize?: number;
  className?: string;
  textClassName?: string;
}

export function formatCoins(n: number): string {
  if (n >= 10_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString();
}

export function CoinPill({
  coins,
  tone = "amber",
  iconSize = 12,
  className,
  textClassName,
  ...props
}: CoinPillProps) {
  const palette = useTokens();
  // Renamed: this is the per-tone class set, not the theme palette.
  const toneStyles =
    tone === "amber"
      ? { wrap: "border-amber-500/30 bg-amber-500/10", text: "text-amber-300", icon: "#FCD34D" }
      : tone === "sky"
        ? { wrap: "border-sky-500/30 bg-sky-500/10", text: "text-sky-300", icon: "#7DD3FC" }
        : { wrap: "bg-card/60", text: "text-foreground", icon: palette.muted };

  return (
    <View
      className={cn(
        "flex-row items-center gap-1 rounded-full border px-2 py-0.5",
        toneStyles.wrap,
        className,
      )}
      {...props}
    >
      <Coins size={iconSize} color={toneStyles.icon} />
      <Text
        className={cn(
          "text-[11px] font-semibold tabular-nums",
          toneStyles.text,
          textClassName,
        )}
      >
        {formatCoins(coins)}
      </Text>
    </View>
  );
}
