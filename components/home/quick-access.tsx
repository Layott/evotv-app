import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  CalendarRange,
  Crown,
  Gift,
  Layers,
  LineChart,
  PiggyBank,
  Star,
  Target,
  Tv,
  Users as UsersIcon,
  type LucideIcon,
} from "lucide-react-native";

interface QuickTile {
  label: string;
  href: string;
  Icon: LucideIcon;
  tint: string;
}

const TILES: QuickTile[] = [
  { label: "Pick'em", href: "/pickem", Icon: Target, tint: "#2CD7E3" },
  { label: "Fantasy", href: "/fantasy", Icon: Star, tint: "#EAB308" },
  { label: "Predictions", href: "/predictions", Icon: LineChart, tint: "#A855F7" },
  { label: "Rewards", href: "/rewards", Icon: Gift, tint: "#F97316" },
  { label: "Watch parties", href: "/watch-parties", Icon: UsersIcon, tint: "#22C55E" },
  { label: "Multi-stream", href: "/multi-stream", Icon: Layers, tint: "#06B6D4" },
  { label: "Tips", href: "/tips", Icon: PiggyBank, tint: "#EC4899" },
  { label: "Calendar", href: "/calendar", Icon: CalendarRange, tint: "#3B82F6" },
  { label: "Apps", href: "/apps", Icon: Tv, tint: "#8B5CF6" },
  { label: "Upgrade", href: "/upgrade", Icon: Crown, tint: "#F59E0B" },
];

export function QuickAccess() {
  const router = useRouter();

  return (
    <View className="px-4">
      <View className="mb-3 flex-row items-baseline justify-between">
        <Text className="text-base font-bold text-foreground">Your hub</Text>
        <Text className="text-xs text-muted-foreground">
          Tap to jump in
        </Text>
      </View>
      <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
        {TILES.map((tile) => {
          const Icon = tile.Icon;
          return (
            <View key={tile.label} style={{ width: "20%", padding: 4 }}>
              <Pressable
                onPress={() => router.push(tile.href as never)}
                className="items-center justify-center rounded-xl border border-border bg-card/40 px-2 py-3 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={tile.label}
              >
                <View
                  className="h-9 w-9 rounded-lg items-center justify-center mb-1.5"
                  style={{ backgroundColor: `${tile.tint}26` }}
                >
                  <Icon size={18} color={tile.tint} />
                </View>
                <Text
                  className="text-[10px] font-medium text-foreground text-center"
                  numberOfLines={1}
                >
                  {tile.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default QuickAccess;
