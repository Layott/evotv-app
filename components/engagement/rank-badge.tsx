import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { Text, View } from "react-native";
import { Medal, Trophy } from "@/components/icons";

export function RankBadge({ rank }: { rank: number }) {
  const palette = useTokens();
  if (rank === 1) {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full bg-amber-500/25">
        <Medal size={14} color="#FCD34D" />
      </View>
    );
  }
  if (rank === 2) {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full bg-neutral-500/25">
        <Medal size={14} color={palette.fg} />
      </View>
    );
  }
  if (rank === 3) {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full border border-orange-700/40 bg-orange-700/10">
        <Trophy size={14} color="#FB923C" />
      </View>
    );
  }
  return (
    <View className="h-7 w-7 items-center justify-center rounded-full bg-card/60">
      <Text className="text-xs font-medium text-muted-foreground">{rank}</Text>
    </View>
  );
}
