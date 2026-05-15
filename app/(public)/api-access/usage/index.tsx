import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import {
  getApiUsage,
  type ApiUsageBreakdown,
  type ApiUsageDay,
} from "@/lib/mock/api-keys";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMockAuth } from "@/components/providers";
import { ApiAccessTabs, ApiPaywallCard } from "@/components/api-access/shell";

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface SparklineProps {
  data: ApiUsageDay[];
  width: number;
  height: number;
}

function Sparkline({ data, width, height }: SparklineProps) {
  if (data.length === 0) {
    return <View style={{ width, height }} />;
  }
  const max = Math.max(...data.map((d) => d.requests), 1);
  const barW = Math.max(2, (width - (data.length - 1) * 2) / data.length);

  return (
    <View
      className="flex-row items-end gap-[2px]"
      style={{ width, height }}
    >
      {data.map((d, i) => {
        const h = Math.max(2, (d.requests / max) * height);
        return (
          <View
            key={`${d.date}-${i}`}
            style={{
              width: barW,
              height: h,
              backgroundColor: "#2CD7E3",
              borderRadius: 2,
              opacity: 0.85,
            }}
          />
        );
      })}
    </View>
  );
}

interface RangeButtonProps {
  active: boolean;
  label: string;
  onPress: () => void;
}

function RangeButton({ active, label, onPress }: RangeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1 ${
        active ? "border-brand" : "border-border"
      }`}
      style={
        active ? { backgroundColor: "rgba(44,215,227,0.10)" } : undefined
      }
    >
      <Text
        className="text-xs font-medium"
        style={{ color: active ? "#2CD7E3" : "#a3a3a3" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ApiUsageScreen() {
  const { role, user } = useMockAuth();
  const isPremium = role === "premium" || role === "admin";
  const userId = user?.id ?? "user_premium";

  const [days, setDays] = React.useState<7 | 30 | 90>(30);

  const { data: usage, isLoading } = useQuery({
    queryKey: ["api-usage", userId, days],
    queryFn: () => getApiUsage(userId, days),
    enabled: isPremium,
  });

  const sortedBreakdown = React.useMemo<ApiUsageBreakdown[]>(() => {
    if (!usage) return [];
    return [...usage.breakdown].sort((a, b) => b.requests - a.requests);
  }, [usage]);

  if (!isPremium) {
    return (
      <>
        <Stack.Screen options={{ title: "API Usage" }} />
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="pt-4 pb-3">
            <ApiAccessTabs active="usage" />
          </View>
          <View className="px-4">
            <ApiPaywallCard />
          </View>
        </ScrollView>
      </>
    );
  }

  const pct = usage ? Math.min(100, Math.round((usage.used / usage.quota) * 100)) : 0;
  const avgDaily = usage
    ? Math.round(
        usage.daily.reduce((acc, d) => acc + d.requests, 0) /
          Math.max(1, usage.daily.length),
      )
    : 0;
  return (
    <>
      <Stack.Screen options={{ title: "API Usage" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="pt-4 pb-3">
          <ApiAccessTabs active="usage" />
        </View>

        <View className="px-4 gap-3">
          {/* Summary cards */}
          <View className="rounded-xl border border-border bg-card p-4 gap-2">
            <Text
              className="text-xs uppercase text-muted-foreground"
              style={{ letterSpacing: 0.5 }}
            >
              Quota usage
            </Text>
            {isLoading || !usage ? (
              <Skeleton className="h-7 w-1/2" />
            ) : (
              <View className="flex-row items-baseline gap-2">
                <Text className="text-2xl font-semibold text-foreground">
                  {formatNumber(usage.used)}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  / {formatNumber(usage.quota)} req
                </Text>
              </View>
            )}
            <View className="mt-2">
              <Progress value={pct} />
              <View className="mt-1 flex-row items-center justify-between">
                <Text style={{ fontSize: 11, color: "#737373" }}>
                  {pct}% used
                </Text>
                <Text style={{ fontSize: 11, color: "#737373" }}>
                  {usage ? formatNumber(usage.quota - usage.used) : "—"} remaining
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 rounded-xl border border-border bg-card p-4 gap-1">
              <Text
                className="text-xs uppercase text-muted-foreground"
                style={{ letterSpacing: 0.5 }}
              >
                Avg daily
              </Text>
              {isLoading ? (
                <Skeleton className="h-6 w-2/3" />
              ) : (
                <Text className="text-xl font-semibold text-foreground">
                  {formatNumber(avgDaily)}
                </Text>
              )}
              <Text style={{ fontSize: 11, color: "#737373" }}>
                Over {days} days
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-border bg-card p-4 gap-1">
              <Text
                className="text-xs uppercase text-muted-foreground"
                style={{ letterSpacing: 0.5 }}
              >
                Status
              </Text>
              <Badge
                className="bg-emerald-500/20"
                textClassName="text-emerald-300"
              >
                Healthy
              </Badge>
              <Text style={{ fontSize: 11, color: "#737373" }}>
                p95 under 150ms
              </Text>
            </View>
          </View>

          {/* Range chart */}
          <View className="rounded-xl border border-border bg-card p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">
                Requests per day
              </Text>
              <View className="flex-row gap-2">
                {([7, 30, 90] as const).map((d) => (
                  <RangeButton
                    key={d}
                    active={days === d}
                    label={`${d}d`}
                    onPress={() => setDays(d)}
                  />
                ))}
              </View>
            </View>
            <View className="h-32 items-stretch">
              {isLoading || !usage ? (
                <Skeleton style={{ height: 128, borderRadius: 8 }} />
              ) : (
                <View className="flex-1 justify-end">
                  <Sparkline data={usage.daily} width={300} height={120} />
                </View>
              )}
            </View>
            {usage ? (
              <View className="flex-row items-center justify-between">
                <Text style={{ fontSize: 11, color: "#737373" }}>
                  {usage.daily[0]?.date.slice(5) ?? ""}
                </Text>
                <Text style={{ fontSize: 11, color: "#737373" }}>
                  {usage.daily[usage.daily.length - 1]?.date.slice(5) ?? ""}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Breakdown */}
          <View className="rounded-xl border border-border bg-card">
            <View className="border-b border-border p-4">
              <Text className="text-sm font-semibold text-foreground">
                Per-endpoint breakdown
              </Text>
              <Text style={{ fontSize: 11, color: "#737373" }}>
                Sorted by request volume
              </Text>
            </View>
            <View>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <View
                      key={i}
                      className="flex-row items-center gap-3 border-b border-border px-4 py-3"
                    >
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-12" />
                    </View>
                  ))
                : sortedBreakdown.map((row, i) => (
                    <View
                      key={row.endpoint}
                      className={`px-4 py-3 ${
                        i < sortedBreakdown.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >
                      <View className="flex-row items-center gap-2">
                        <View
                          className="rounded-md px-1.5 py-0.5"
                          style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
                        >
                          <Text
                            style={{
                              fontSize: 9,
                              fontWeight: "700",
                              color: "#34d399",
                              letterSpacing: 0.5,
                            }}
                          >
                            {row.method}
                          </Text>
                        </View>
                        <Text
                          className="flex-1 text-foreground"
                          style={{ fontFamily: "monospace", fontSize: 12 }}
                          numberOfLines={1}
                        >
                          {row.endpoint}
                        </Text>
                        <Text className="text-sm text-foreground tabular-nums">
                          {compact(row.requests)}
                        </Text>
                      </View>
                      <View className="mt-1 flex-row items-center gap-3">
                        <Text style={{ fontSize: 11, color: "#737373" }}>
                          err {(row.errorRate * 100).toFixed(2)}%
                        </Text>
                        <Text style={{ fontSize: 11, color: "#737373" }}>
                          ·
                        </Text>
                        <Text style={{ fontSize: 11, color: "#737373" }}>
                          {row.avgLatencyMs}ms p50
                        </Text>
                      </View>
                    </View>
                  ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
