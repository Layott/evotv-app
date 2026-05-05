import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";

import { cn } from "@/lib/utils";

export interface QtyStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: QtyStepperProps) {
  const decDisabled = value <= min;
  const incDisabled = value >= max;
  return (
    <View
      className="flex-row items-center self-start rounded-lg border border-border bg-card"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={decDisabled}
        onPress={() => onChange(Math.max(min, value - 1))}
        className={cn(
          "h-8 w-8 items-center justify-center active:opacity-70",
          decDisabled && "opacity-40",
        )}
      >
        <Minus size={16} color="#e5e5e5" />
      </Pressable>
      <View
        style={{ minWidth: 40, alignItems: "center" }}
      >
        <Text className="text-sm font-semibold text-foreground">{value}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={incDisabled}
        onPress={() => onChange(Math.min(max, value + 1))}
        className={cn(
          "h-8 w-8 items-center justify-center active:opacity-70",
          incDisabled && "opacity-40",
        )}
      >
        <Plus size={16} color="#e5e5e5" />
      </Pressable>
    </View>
  );
}

export default QtyStepper;
