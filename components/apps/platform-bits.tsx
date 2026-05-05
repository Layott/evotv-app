import * as React from "react";
import { Text, View } from "react-native";
import {
  Apple,
  Laptop,
  Monitor,
  Smartphone,
  Terminal,
  Tv,
} from "lucide-react-native";

import type { AppKind, AppStatus } from "@/lib/mock/apps";

interface IconProps {
  kind: AppKind;
  size?: number;
  color?: string;
}

export function PlatformIcon({
  kind,
  size = 22,
  color = "#FAFAFA",
}: IconProps) {
  switch (kind) {
    case "tv":
      return <Tv size={size} color={color} />;
    case "android":
      return <Smartphone size={size} color={color} />;
    case "ios":
      return <Apple size={size} color={color} />;
    case "windows":
      return <Monitor size={size} color={color} />;
    case "macos":
      return <Laptop size={size} color={color} />;
    case "linux":
      return <Terminal size={size} color={color} />;
  }
}

export function StatusPill({ status }: { status: AppStatus }) {
  const map: Record<AppStatus, { label: string; bg: string; fg: string }> = {
    available: {
      label: "Available",
      bg: "rgba(16,185,129,0.15)",
      fg: "#34d399",
    },
    beta: { label: "Beta", bg: "rgba(56,189,248,0.15)", fg: "#7dd3fc" },
    "coming-soon": {
      label: "Coming soon",
      bg: "rgba(245,158,11,0.15)",
      fg: "#fbbf24",
    },
  };
  const m = map[status];
  return (
    <View
      className="rounded-full px-2 py-0.5"
      style={{ backgroundColor: m.bg }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          color: m.fg,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {m.label}
      </Text>
    </View>
  );
}
