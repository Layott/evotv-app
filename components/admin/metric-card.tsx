import * as React from "react";
import { Text, View } from "react-native";
import { ArrowDownRight, ArrowUpRight } from "@/components/icons";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon?: import("@/components/icons").Icon;
  hint?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  hint,
  className,
}: MetricCardProps) {
  const isPositive = typeof delta === "number" ? delta >= 0 : true;
  const showDelta = typeof delta === "number";

  return (
    <View
      className={cn(
        "rounded-xl border border-border bg-card/50 p-4",
        className,
      )}
    >
      <View className="flex-row items-start justify-between">
        <Text className="text-[10px] font-medium r text-muted-foreground">
          {title}
        </Text>
        {Icon ? (
          <View className="rounded-md bg-muted p-1.5">
            <Icon size={14} color="#9FBDBD" />
          </View>
        ) : null}
      </View>
      <Text
        className="mt-2 text-2xl font-semibold text-foreground"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
      <View className="mt-1 flex-row items-center gap-1.5">
        {showDelta ? (
          <View className="flex-row items-center gap-0.5">
            {isPositive ? (
              <ArrowUpRight size={12} color="#46E3CE" />
            ) : (
              <ArrowDownRight size={12} color="#F87171" />
            )}
            <Text
              className={cn(
                "text-xs font-medium",
                isPositive ? "text-cyan-300" : "text-red-400",
              )}
            >
              {Math.abs(delta!).toFixed(1)}%
            </Text>
          </View>
        ) : null}
        {deltaLabel ? (
          <Text className="text-xs text-muted-foreground">{deltaLabel}</Text>
        ) : null}
        {hint && !deltaLabel ? (
          <Text className="text-xs text-muted-foreground">{hint}</Text>
        ) : null}
      </View>
    </View>
  );
}
