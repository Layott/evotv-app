import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";

import { Button } from "@/components/ui/button";

export type ApiTab = "landing" | "keys" | "docs" | "usage";

const TABS: { id: ApiTab; label: string; path: string }[] = [
  { id: "landing", label: "Overview", path: "/api-access" },
  { id: "keys", label: "Keys", path: "/api-access/keys" },
  { id: "docs", label: "Docs", path: "/api-access/docs" },
  { id: "usage", label: "Usage", path: "/api-access/usage" },
];

export function ApiAccessTabs({ active }: { active: ApiTab }) {
  const router = useRouter();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {TABS.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => router.push(t.path as never)}
          className={`rounded-full border px-3 py-1.5 ${
            active === t.id ? "border-brand" : "border-border bg-card"
          }`}
          style={
            active === t.id
              ? { backgroundColor: "rgba(44,215,227,0.10)" }
              : undefined
          }
        >
          <Text
            className="text-xs font-medium"
            style={{ color: active === t.id ? "#2CD7E3" : "#a3a3a3" }}
          >
            {t.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function ApiPaywallCard() {
  const router = useRouter();
  return (
    <View className="rounded-2xl border border-amber-500/40 bg-card p-6 gap-3">
      <View className="flex-row items-center gap-2">
        <Sparkles size={16} color="#fbbf24" />
        <Text className="text-base font-semibold text-foreground">
          API access is Premium
        </Text>
      </View>
      <Text className="text-sm text-muted-foreground">
        Upgrade to unlock 50,000 requests/month across all v1 endpoints + SSE
        streaming.
      </Text>
      <Button
        className="bg-amber-500"
        textClassName="text-black font-semibold"
        onPress={() => router.push("/upgrade")}
      >
        <Sparkles size={14} color="#000" />
        Upgrade now
      </Button>
    </View>
  );
}
