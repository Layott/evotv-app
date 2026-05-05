import * as React from "react";
import { Text, View } from "react-native";

import { cn } from "@/lib/utils";

interface BotIconProps {
  /** Single character or short token rendered inside the icon. */
  label: string;
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Lightweight bot-icon stand-in for RN. Web ships SVG brand marks; on mobile
 * we approximate with a colored monogram badge so we don't depend on extra svg deps.
 */
export function BotIcon({ label, className, size = 24, color = "#FAFAFA" }: BotIconProps) {
  return (
    <View
      className={cn("items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <Text
        style={{
          color,
          fontSize: Math.round(size * 0.6),
          fontWeight: "900",
          letterSpacing: -1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
