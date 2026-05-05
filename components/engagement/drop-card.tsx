import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Coins, Sparkles } from "lucide-react-native";

import type { Drop } from "@/lib/mock/rewards";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RARITY_COLOR: Record<Drop["rarity"], string> = {
  common: "border-neutral-700 bg-neutral-900",
  rare: "border-sky-500/40 bg-sky-500/10",
  epic: "border-violet-500/40 bg-violet-500/10",
  legendary: "border-amber-500/40 bg-amber-500/10",
};

const RARITY_TEXT: Record<Drop["rarity"], string> = {
  common: "text-neutral-300",
  rare: "text-sky-300",
  epic: "text-violet-300",
  legendary: "text-amber-300",
};

const KIND_LABEL: Record<Drop["kind"], string> = {
  cosmetic: "In-game",
  "premium-trial": "Premium",
  "merch-voucher": "Voucher",
};

export function DropCard({
  drop,
  balance,
  onRedeem,
}: {
  drop: Drop;
  balance: number;
  onRedeem: (d: Drop) => void;
}) {
  const affordable = balance >= drop.cost;
  const outOfStock = drop.stock <= 0;
  const disabled = !affordable || outOfStock;

  return (
    <View className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60">
      <View
        style={{ aspectRatio: 4 / 3, backgroundColor: "#171717" }}
        className="overflow-hidden"
      >
        <Image
          source={drop.imageUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View
          className={cn(
            "absolute right-2 top-2 rounded border px-2 py-0.5",
            RARITY_COLOR[drop.rarity],
          )}
        >
          <Text
            className={cn(
              "text-[9px] font-bold uppercase tracking-wider",
              RARITY_TEXT[drop.rarity],
            )}
          >
            {drop.rarity}
          </Text>
        </View>
        <View className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5">
          <Text className="text-[9px] uppercase tracking-wider text-white">
            {KIND_LABEL[drop.kind]}
          </Text>
        </View>
      </View>
      <View className="gap-1.5 p-3">
        <Text
          className="text-sm font-semibold text-neutral-100"
          numberOfLines={1}
        >
          {drop.name}
        </Text>
        <Text className="text-[11px] text-neutral-400" numberOfLines={2}>
          {drop.description}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] text-neutral-500">
            {drop.partner} · {drop.stock} left
          </Text>
          <View className="flex-row items-center gap-1">
            <Coins size={12} color="#FCD34D" />
            <Text className="text-sm font-bold text-amber-300">
              {drop.cost.toLocaleString()}
            </Text>
          </View>
        </View>
        <Button
          size="sm"
          className={
            disabled
              ? "mt-1 bg-neutral-800"
              : "mt-1 bg-amber-500"
          }
          disabled={disabled}
          onPress={() => onRedeem(drop)}
          textClassName={disabled ? "text-neutral-400" : "text-amber-950"}
        >
          {outOfStock ? (
            "Out of stock"
          ) : !affordable ? (
            `Need ${(drop.cost - balance).toLocaleString()} more`
          ) : (
            <>
              <Sparkles size={12} color="#451A03" />
              {`Redeem`}
            </>
          )}
        </Button>
      </View>
    </View>
  );
}

export function TierBadge({
  tier,
  size = "default",
}: {
  tier: string;
  size?: "default" | "sm";
}) {
  const palette: Record<string, string> = {
    Bronze: "border-amber-700/50 bg-amber-700/10 text-amber-200",
    Silver: "border-neutral-400/50 bg-neutral-400/10 text-neutral-100",
    Gold: "border-amber-500/50 bg-amber-500/10 text-amber-300",
    Platinum: "border-cyan-400/50 bg-cyan-400/10 text-cyan-100",
    Diamond: "border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-100",
  };
  const cls = palette[tier] ?? palette.Bronze!;
  return (
    <View
      className={cn(
        "flex-row items-center gap-1 rounded-full border px-2 py-0.5",
        cls,
        size === "sm" && "px-1.5 py-0",
      )}
    >
      <Text className={cn("font-bold", size === "sm" ? "text-[10px]" : "text-xs")}>
        {tier}
      </Text>
    </View>
  );
}
