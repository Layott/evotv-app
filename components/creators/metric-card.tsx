import * as React from "react";
import { Text, View } from "react-native";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react-native";

import { cn } from "@/lib/utils";

export type MetricAccent = "sky" | "amber" | "emerald" | "fuchsia" | "rose" | "brand";

const ACCENT: Record<MetricAccent, string> = {
  sky: "text-sky-300 bg-sky-500/15 border border-sky-500/30",
  amber: "text-amber-300 bg-amber-500/15 border border-amber-500/30",
  emerald: "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30",
  fuchsia: "text-fuchsia-300 bg-fuchsia-500/15 border border-fuchsia-500/30",
  rose: "text-rose-300 bg-rose-500/15 border border-rose-500/30",
  brand: "text-brand bg-brand/15 border border-brand/30",
};

const ACCENT_COLORS: Record<MetricAccent, string> = {
  sky: "#7DD3FC",
  amber: "#FCD34D",
  emerald: "#6EE7B7",
  fuchsia: "#F0ABFC",
  rose: "#FDA4AF",
  brand: "#2CD7E3",
};

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  delta?: number;
  icon?: LucideIcon;
  accent?: MetricAccent;
}

export function MetricCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  accent = "sky",
}: MetricCardProps) {
  const positive = delta !== undefined && delta >= 0;
  return (
    <View className="rounded-2xl border border-border bg-card/40 p-4">
      <View className="flex-row items-start justify-between">
        <Text className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </Text>
        {Icon ? (
          <View
            className={cn(
              "h-7 w-7 items-center justify-center rounded-lg",
              ACCENT[accent],
            )}
          >
            <Icon size={14} color={ACCENT_COLORS[accent]} />
          </View>
        ) : null}
      </View>
      <View className="mt-2 flex-row items-end gap-2">
        <Text className="text-2xl font-bold text-foreground">{String(value)}</Text>
        {delta !== undefined ? (
          <View
            className={cn(
              "mb-0.5 flex-row items-center gap-0.5 rounded-full px-1.5 py-0.5",
              positive ? "bg-emerald-500/15" : "bg-rose-500/15",
            )}
          >
            {positive ? (
              <ArrowUpRight size={10} color="#6EE7B7" />
            ) : (
              <ArrowDownRight size={10} color="#FDA4AF" />
            )}
            <Text
              className={cn(
                "text-[10px] font-bold",
                positive ? "text-emerald-300" : "text-rose-300",
              )}
            >
              {Math.abs(delta).toFixed(1)}%
            </Text>
          </View>
        ) : null}
      </View>
      {hint ? (
        <Text className="mt-1 text-[11px] text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}
