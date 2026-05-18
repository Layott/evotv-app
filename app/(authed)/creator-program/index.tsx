import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Mic2,
  Sparkles,
} from "lucide-react-native";

import { useMockAuth } from "@/components/providers";
import { getMyApplication } from "@/lib/api/creator-program";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ProgramPitch } from "@/components/creators/program-pitch";

const ELIGIBILITY = [
  { label: "1,000+ followers across any platform", met: true },
  { label: "100+ hours streamed in the past 90 days", met: true },
  { label: "No active community guidelines strikes", met: true },
  { label: "Government-issued ID for payouts", met: false },
];

export default function CreatorProgramScreen() {
  const router = useRouter();
  const { user } = useMockAuth();

  const appQ = useQuery({
    queryKey: ["creator-program", "application", user?.id ?? ""],
    queryFn: () => getMyApplication(),
    enabled: !!user,
  });

  if (!user || appQ.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Creator Program" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  const application = appQ.data ?? null;

  return (
    <>
      <Stack.Screen options={{ title: "Creator Program" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-4 py-6 pb-24"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="overflow-hidden rounded-3xl border border-border bg-amber-500/5 p-6">
          <View className="flex-row">
            <Badge
              className="border-amber-500/40 bg-amber-500/15"
              textClassName="text-amber-300"
            >
              <Sparkles size={12} color="#FCD34D" />
              <Text className="ml-1 text-[11px] font-semibold text-amber-300">
                EVO Creator Program
              </Text>
            </Badge>
          </View>
          <Text className="mt-4 text-3xl font-bold leading-tight text-foreground">
            Stream to Africa.
          </Text>
          <Text className="mt-1 text-3xl font-bold leading-tight text-amber-300">
            Get paid for it.
          </Text>
          <Text className="mt-4 text-sm text-muted-foreground">
            Join the official EVO TV creator program — keep 70% of your tips and subs, get auto-clipped highlights, and stream natively from your laptop or mobile.
          </Text>

          <View className="mt-5 gap-3">
            {application ? (
              <Button
                onPress={() => router.push("/(authed)/creator-program/thanks")}
                className="h-11 bg-sky-500"
                textClassName="font-semibold text-neutral-950"
              >
                <CheckCircle2 size={16} color="#0A0A0A" />
                <Text className="text-sm font-semibold text-neutral-950">
                  View application status
                </Text>
              </Button>
            ) : (
              <Button
                onPress={() => router.push("/(authed)/creator-program/apply")}
                className="h-11 bg-amber-500"
                textClassName="font-semibold text-amber-950"
              >
                <Mic2 size={16} color="#451A03" />
                <Text className="text-sm font-semibold text-amber-950">
                  Apply now
                </Text>
                <ArrowRight size={16} color="#451A03" />
              </Button>
            )}
            <Button
              variant="outline"
              onPress={() => router.push("/(authed)/creator-dashboard")}
              className="h-11"
            >
              <Text className="text-sm font-medium text-foreground">
                Preview dashboard
              </Text>
            </Button>
          </View>

          <View className="mt-5 flex-row flex-wrap gap-3">
            <View className="flex-row items-center gap-1">
              <Coins size={12} color="#FCD34D" />
              <Text className="text-[11px] text-muted-foreground">
                70/30 revenue split
              </Text>
            </View>
            <Text className="text-[11px] text-muted-foreground">
              5,300+ creators across Africa
            </Text>
            <Text className="text-[11px] text-muted-foreground">
              Free verification badge
            </Text>
          </View>
        </View>

        {/* What's offered */}
        <View className="mt-8">
          <Text className="text-base font-bold text-foreground">What you get</Text>
          <View className="mt-4">
            <ProgramPitch />
          </View>
        </View>

        {/* Splits */}
        <View className="mt-8 gap-4">
          <View className="rounded-2xl border border-border bg-card/40 p-5">
            <Text className="text-base font-semibold text-foreground">
              How splits work
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              Every tip and sub is split between you and EVO TV.
            </Text>
            <View className="mt-4 overflow-hidden rounded-xl border border-border">
              <View className="flex-row">
                <View className="flex-1 border-r border-border bg-emerald-500/15 px-4 py-3">
                  <Text className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
                    Creator
                  </Text>
                  <Text className="mt-0.5 text-2xl font-bold text-emerald-100">
                    70%
                  </Text>
                </View>
                <View className="w-24 bg-card px-4 py-3">
                  <Text className="text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    EVO TV
                  </Text>
                  <Text className="mt-0.5 text-right text-2xl font-bold text-foreground">
                    30%
                  </Text>
                </View>
              </View>
              <View className="border-t border-border bg-background px-4 py-3">
                <Text className="text-xs text-muted-foreground">
                  EVO's 30% covers hosting, CDN, payment fees, support, and creator marketing.
                </Text>
              </View>
            </View>
          </View>

          <View className="rounded-2xl border border-border bg-card/40 p-5">
            <Text className="text-base font-semibold text-foreground">
              Eligibility
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              You meet the bar if all of the below check out.
            </Text>
            <View className="mt-4 gap-2.5">
              {ELIGIBILITY.map((e) => (
                <View key={e.label} className="flex-row items-start gap-2.5">
                  <CheckCircle2
                    size={16}
                    color={e.met ? "#34D399" : "#525252"}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    className={
                      e.met
                        ? "flex-1 text-sm text-foreground"
                        : "flex-1 text-sm text-muted-foreground"
                    }
                  >
                    {e.label}
                  </Text>
                </View>
              ))}
            </View>
            <Text className="mt-4 text-[11px] text-muted-foreground">
              ID verification happens after you submit your application. We never charge to apply.
            </Text>
          </View>
        </View>

        {/* CTA */}
        <View className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
          <Text className="text-center text-xl font-bold text-foreground">
            Ready to make EVO your home?
          </Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Applications are reviewed within 5 working days. Approved creators are onboarded by a regional manager.
          </Text>
          <View className="mt-5">
            {application ? (
              <Button
                onPress={() => router.push("/(authed)/creator-program/thanks")}
                className="h-11 bg-sky-500"
                textClassName="font-semibold text-neutral-950"
              >
                <Text className="text-sm font-semibold text-neutral-950">
                  View status
                </Text>
              </Button>
            ) : (
              <Button
                onPress={() => router.push("/(authed)/creator-program/apply")}
                className="h-11 bg-amber-500"
                textClassName="font-semibold text-amber-950"
              >
                <Text className="text-sm font-semibold text-amber-950">
                  Apply to the creator program
                </Text>
                <ArrowRight size={16} color="#451A03" />
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
