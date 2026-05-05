import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  Activity,
  Code,
  Gauge,
  KeyRound,
  Layers,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { useMockAuth } from "@/components/providers";
import { ApiAccessTabs, ApiPaywallCard } from "@/components/api-access/shell";

const FEATURES = [
  {
    title: "All v1 endpoints",
    body: "Streams, events, teams, players, VODs, clips, odds — same shape as the EVO TV app.",
    Icon: Layers,
  },
  {
    title: "Real-time SSE",
    body: "Subscribe to chat, viewer counts, score events, and bracket updates without polling.",
    Icon: Activity,
  },
  {
    title: "50,000 req / month",
    body: "Per Premium account. Burst-friendly, soft-limited. Higher tiers via direct contact.",
    Icon: Gauge,
  },
  {
    title: "Stable & versioned",
    body: "Deprecation policy: 90-day notice. Breaking changes only with major version bump.",
    Icon: ShieldCheck,
  },
];

export default function ApiAccessScreen() {
  const router = useRouter();
  const { role } = useMockAuth();
  const isPremium = role === "premium" || role === "admin";

  return (
    <>
      <Stack.Screen options={{ title: "API Access" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="pt-4 pb-3">
          <ApiAccessTabs active="landing" />
        </View>

        <View className="px-4 gap-4">
          <View className="rounded-2xl border border-border bg-card p-5 gap-4">
            <Text className="text-xl font-bold text-foreground">
              Build on Africa's biggest esports dataset.
            </Text>
            <Text className="text-sm text-muted-foreground">
              The same data feeding the EVO TV app, exposed as a clean REST + SSE
              API. Track 50+ teams across Free Fire, CoD Mobile, PUBG Mobile, and
              EA FC Mobile.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {isPremium ? (
                <>
                  <Button
                    className="bg-brand"
                    textClassName="text-black font-semibold"
                    onPress={() => router.push("/api-access/keys")}
                  >
                    <KeyRound size={14} color="#000" />
                    Generate a key
                  </Button>
                  <Button
                    variant="outline"
                    onPress={() => router.push("/api-access/docs")}
                  >
                    <Code size={14} color="#FAFAFA" />
                    Read the docs
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-amber-500"
                  textClassName="text-black font-semibold"
                  onPress={() => router.push("/upgrade")}
                >
                  <Sparkles size={14} color="#000" />
                  Upgrade to unlock
                </Button>
              )}
            </View>
            <View
              className="rounded-xl border border-border p-3"
              style={{ backgroundColor: "#0a0a0a" }}
            >
              <Text
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: "#d4d4d4",
                  lineHeight: 16,
                }}
              >
                {`curl https://api.evo.tv/v1/streams \\
  -H "Authorization: Bearer evo_live_***"

# Response (truncated)
[
  {
    "id": "stream_lagos_final",
    "title": "EVO Lagos Invitational — Semi 1",
    "viewerCount": 18420,
    "isLive": true
  }
]`}
              </Text>
            </View>
          </View>

          <Text
            className="text-xs font-semibold uppercase text-muted-foreground"
            style={{ letterSpacing: 0.5 }}
          >
            What you get
          </Text>
          <View className="gap-3">
            {FEATURES.map((f) => (
              <View
                key={f.title}
                className="rounded-xl border border-border bg-card p-4 gap-2"
              >
                <View className="flex-row items-center gap-2">
                  <f.Icon size={14} color="#7dd3fc" />
                  <Text
                    className="text-xs font-semibold uppercase text-foreground"
                    style={{ letterSpacing: 0.5 }}
                  >
                    {f.title}
                  </Text>
                </View>
                <Text className="text-sm text-muted-foreground">{f.body}</Text>
              </View>
            ))}
          </View>

          {!isPremium ? (
            <View className="mt-4">
              <ApiPaywallCard />
            </View>
          ) : (
            <View className="mt-4 rounded-2xl border border-border bg-card p-5 gap-3">
              <Text className="text-base font-semibold text-foreground">
                You're all set.
              </Text>
              <Text className="text-sm text-muted-foreground">
                Premium is active. Generate your first key and start hitting
                /v1/streams.
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Button
                  className="bg-brand"
                  textClassName="text-black font-semibold"
                  onPress={() => router.push("/api-access/keys")}
                >
                  <Zap size={14} color="#000" />
                  Manage keys
                </Button>
                <Button
                  variant="outline"
                  onPress={() => router.push("/api-access/usage")}
                >
                  <Gauge size={14} color="#FAFAFA" />
                  Usage
                </Button>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
