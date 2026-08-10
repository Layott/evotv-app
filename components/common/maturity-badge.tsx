import * as React from "react";
import { Text, View } from "react-native";

import type { MaturityRating } from "@/lib/types";
import { MATURITY_LABELS } from "@/lib/types";

/**
 * Small inline maturity pill (e.g. "PG") sized + shaped to sit beside the
 * LiveBadge overlay on content cards. Color-coded lightly per rating but kept
 * subtle for the dark UI. Renders nothing when `rating` is undefined.
 */
const TONE: Record<
  MaturityRating,
  { border: string; bg: string; text: string }
> = {
  kids: {
    border: "rgba(34,197,94,0.35)",
    bg: "rgba(34,197,94,0.12)",
    text: "#86efac",
  },
  pg: {
    border: "rgba(70,227,206,0.35)",
    bg: "rgba(70,227,206,0.12)",
    text: "#67e8f9",
  },
  teen: {
    border: "rgba(245,158,11,0.35)",
    bg: "rgba(245,158,11,0.12)",
    text: "#fcd34d",
  },
  mature: {
    border: "rgba(239,68,68,0.35)",
    bg: "rgba(239,68,68,0.12)",
    text: "#fca5a5",
  },
};

interface MaturityBadgeProps {
  rating?: MaturityRating;
  className?: string;
}

export function MaturityBadge({ rating, className }: MaturityBadgeProps) {
  if (!rating) return null;
  const tone = TONE[rating];
  return (
    <View
      className={`rounded-md px-2 py-0.5 ${className ?? ""}`}
      style={{
        borderWidth: 1,
        borderColor: tone.border,
        backgroundColor: tone.bg,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.5,
          color: tone.text,
        }}
      >
        {MATURITY_LABELS[rating]}
      </Text>
    </View>
  );
}

export default MaturityBadge;
