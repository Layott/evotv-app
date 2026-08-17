import * as React from "react";
import { Text, View } from "react-native";
import { Crown, Medal, Trophy } from "lucide-react-native";

export function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full bg-amber-500/25">
        <Crown size={14} color="#FCD34D" />
      </View>
    );
  }
  if (rank === 2) {
    return (
      <View className="h-7 w-7 items-center justify-center rounded-full bg-neutral-500/25">
        <Medal size={14} color="#E5E5E5" />
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
    <View className="h-7 w-7 items-center justify-center rounded-full bg-neutral-900/60">
      <Text className="text-xs font-medium text-neutral-400">{rank}</Text>
    </View>
  );
}
