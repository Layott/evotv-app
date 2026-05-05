import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import type { PaymentProvider } from "@/lib/mock/payment-methods";
import { cn } from "@/lib/utils";

const COUNTRY_NAMES: Record<string, string> = {
  NG: "Nigeria",
  KE: "Kenya",
  TZ: "Tanzania",
  UG: "Uganda",
  GH: "Ghana",
  CI: "Côte d'Ivoire",
  CM: "Cameroon",
  RW: "Rwanda",
  MW: "Malawi",
  ZA: "South Africa",
};

const ACCENT_BG: Record<string, string> = {
  mpesa: "rgba(16,185,129,0.15)",
  "mtn-momo": "rgba(245,158,11,0.15)",
  "airtel-money": "rgba(239,68,68,0.15)",
  "paystack-card": "rgba(44,215,227,0.15)",
};

const ACCENT_TEXT: Record<string, string> = {
  mpesa: "#6ee7b7",
  "mtn-momo": "#fcd34d",
  "airtel-money": "#fca5a5",
  "paystack-card": "#67e8f9",
};

interface ProviderTileProps {
  provider: PaymentProvider;
  selected: boolean;
  onPress: () => void;
}

export function ProviderTile({ provider, selected, onPress }: ProviderTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        "rounded-2xl border bg-card p-4",
        selected ? "border-brand bg-brand/10" : "border-border",
      )}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: ACCENT_BG[provider.id] ?? "#262626" }}
        >
          <Text
            className="text-base font-extrabold"
            style={{ color: ACCENT_TEXT[provider.id] ?? "#fafafa" }}
          >
            {provider.logo}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text
              className="text-sm font-semibold text-foreground"
              numberOfLines={1}
            >
              {provider.name}
            </Text>
            {selected ? (
              <View
                className="h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: "#2CD7E3" }}
              >
                <Check size={12} color="#0A0A0A" />
              </View>
            ) : null}
          </View>
          <Text
            className="mt-0.5 text-xs text-muted-foreground"
            numberOfLines={2}
          >
            {provider.description}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row flex-wrap gap-1">
        {provider.countries.map((c) => (
          <View
            key={c}
            className="rounded-full border border-border bg-background px-2 py-0.5"
          >
            <Text
              className="text-[10px] font-medium uppercase text-muted-foreground"
              accessibilityLabel={COUNTRY_NAMES[c] ?? c}
            >
              {c}
            </Text>
          </View>
        ))}
      </View>

      <View
        className="mt-2 flex-row items-center gap-2 border-t border-border/60 pt-2"
      >
        <Text className="text-[11px] text-muted-foreground">
          Fee ₦{provider.feeNgn.toLocaleString()}
        </Text>
        <Text className="text-[11px] text-muted-foreground">·</Text>
        <Text className="text-[11px] text-muted-foreground">
          ~{provider.etaSeconds}s confirm
        </Text>
      </View>
    </Pressable>
  );
}

export default ProviderTile;
