import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { ArrowRight, BadgeCheck, Building2, Radio } from "lucide-react-native";

import { useMockAuth } from "@/components/providers";
import { cn } from "@/lib/utils";

export default function PartnerDashboard() {
  const { publisherMemberships } = useMockAuth();

  const channelCount = publisherMemberships.reduce(
    (acc, m) => acc + m.channels.length,
    0,
  );

  return (
    <>
      <Stack.Screen options={{ title: "Partner dashboard" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-5 py-6">
          <View className="flex-row items-center gap-2">
            <Radio size={22} color="#2CD7E3" />
            <Text className="text-2xl font-bold text-foreground">
              Partner dashboard
            </Text>
          </View>
          <Text className="mt-1 text-sm text-muted-foreground">
            Manage your channels, rotate stream keys, and view analytics.
          </Text>

          <View className="mt-5 flex-row gap-3">
            <SummaryCard
              icon={<Building2 size={16} color="#FAFAFA" />}
              label="Publishers"
              value={publisherMemberships.length}
            />
            <SummaryCard
              icon={<Radio size={16} color="#FAFAFA" />}
              label="Channels"
              value={channelCount}
            />
          </View>

          {publisherMemberships.map((m) => (
            <View
              key={m.publisher.id}
              className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-semibold text-foreground">
                    {m.publisher.name}
                  </Text>
                  {m.publisher.isEvotvOwned ? (
                    <BadgeCheck size={14} color="#2CD7E3" />
                  ) : null}
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.role}
                  </Text>
                  <Text
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      m.publisher.kycState === "verified"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : m.publisher.kycState === "rejected"
                          ? "bg-rose-500/15 text-rose-300"
                          : "bg-amber-500/15 text-amber-300",
                    )}
                  >
                    {m.publisher.kycState}
                  </Text>
                </View>
              </View>
              <Text className="mt-1 text-xs text-muted-foreground">
                Revenue share {m.publisher.revenueSharePct}% · {m.channels.length}{" "}
                channel{m.channels.length === 1 ? "" : "s"}
              </Text>

              <View className="mt-3 gap-2">
                {m.channels.map((c) => (
                  <Link
                    key={c.id}
                    href={`/(partner)/channels/${c.id}` as never}
                    asChild
                  >
                    <Pressable className="flex-row items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3 active:opacity-80">
                      <View
                        className="h-9 w-9 items-center justify-center rounded-md"
                        style={{ backgroundColor: "#1f1f1f" }}
                      >
                        <Radio size={16} color="#2CD7E3" />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-sm font-semibold text-foreground"
                          numberOfLines={1}
                        >
                          {c.name}
                        </Text>
                        <Text className="text-[11px] text-muted-foreground">
                          @{c.slug} · {c.followerCount.toLocaleString()} followers
                        </Text>
                      </View>
                      <ArrowRight size={16} color="#737373" />
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <View className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </Text>
      </View>
      <Text className="mt-1 text-2xl font-bold text-foreground">{value}</Text>
    </View>
  );
}
