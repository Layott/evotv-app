import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Coins,
  Eye,
  Heart,
  Radio,
  TrendingUp,
  Users,
} from "lucide-react-native";

import {
  getChannelAnalytics,
  type AnalyticsDailyRow,
  type AnalyticsPeriod,
} from "@/lib/api/partner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "All" },
];

const CHART_HEIGHT = 140;

export default function ChannelAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [period, setPeriod] = React.useState<AnalyticsPeriod>("30d");

  const analyticsQ = useQuery({
    queryKey: ["partner", "channel", id, "analytics", period],
    queryFn: () => getChannelAnalytics(id!, period),
    enabled: !!id,
  });

  return (
    <>
      <Stack.Screen options={{ title: "Analytics" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-5 py-6">
          <View className="flex-row items-center gap-2">
            <BarChart3 size={22} color="#2CD7E3" />
            <Text className="text-2xl font-bold text-foreground">Analytics</Text>
          </View>
          <Text className="mt-1 text-sm text-muted-foreground">
            Daily rollup. Updates after 02:00 UTC the next morning.
          </Text>

          <View className="mt-5 flex-row gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setPeriod(opt.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5",
                  period === opt.value
                    ? "border-brand/50 bg-brand/10"
                    : "border-neutral-800 bg-neutral-900",
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-semibold",
                    period === opt.value ? "text-brand" : "text-neutral-300",
                  )}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {analyticsQ.isLoading ? (
            <View className="mt-5 gap-3">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
            </View>
          ) : analyticsQ.isError ? (
            <View className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
              <Text className="text-sm text-rose-300">
                {(analyticsQ.error as Error)?.message ?? "Failed to load analytics"}
              </Text>
            </View>
          ) : analyticsQ.data ? (
            <View className="mt-5 gap-4">
              <View className="flex-row flex-wrap gap-3">
                <SummaryCard
                  icon={<Eye size={14} color="#FAFAFA" />}
                  label="Views"
                  value={analyticsQ.data.totals.views.toLocaleString()}
                />
                <SummaryCard
                  icon={<Users size={14} color="#FAFAFA" />}
                  label="Unique"
                  value={analyticsQ.data.totals.uniqueViewers.toLocaleString()}
                />
                <SummaryCard
                  icon={<TrendingUp size={14} color="#FAFAFA" />}
                  label="Watch min"
                  value={analyticsQ.data.totals.watchMinutes.toLocaleString()}
                />
                <SummaryCard
                  icon={<Radio size={14} color="#FAFAFA" />}
                  label="Peak"
                  value={analyticsQ.data.totals.peakConcurrent.toLocaleString()}
                />
                <SummaryCard
                  icon={<Coins size={14} color="#FCD34D" />}
                  label="Tips"
                  value={`${analyticsQ.data.totals.tipCoinsReceived.toLocaleString()} c`}
                />
                <SummaryCard
                  icon={<Heart size={14} color="#F472B6" />}
                  label="Followers Δ"
                  value={`+${analyticsQ.data.totals.followersGained.toLocaleString()}`}
                />
              </View>

              <SparkSection
                title="Views per day"
                rows={analyticsQ.data.rows}
                accessor={(r) => r.views}
                color="#2CD7E3"
              />
              <SparkSection
                title="Watch minutes per day"
                rows={analyticsQ.data.rows}
                accessor={(r) => r.watchMinutes}
                color="#A78BFA"
              />
              <SparkSection
                title="Tip coins per day"
                rows={analyticsQ.data.rows}
                accessor={(r) => r.tipCoinsReceived}
                color="#FCD34D"
              />
            </View>
          ) : null}
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
  value: string;
}) {
  return (
    <View
      className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3"
      style={{ minWidth: "30%", flexGrow: 1 }}
    >
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </Text>
      </View>
      <Text className="mt-1 text-base font-bold text-foreground">{value}</Text>
    </View>
  );
}

function SparkSection({
  title,
  rows,
  accessor,
  color,
}: {
  title: string;
  rows: AnalyticsDailyRow[];
  accessor: (r: AnalyticsDailyRow) => number;
  color: string;
}) {
  const values = rows.map(accessor);
  const max = Math.max(1, ...values);
  return (
    <View className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      {rows.length === 0 ? (
        <Text className="mt-4 text-center text-xs text-muted-foreground">
          No data for this period yet.
        </Text>
      ) : (
        <View
          className="mt-3 flex-row items-end gap-[2px]"
          style={{ height: CHART_HEIGHT }}
        >
          {rows.map((r, i) => {
            const h = Math.max(2, (accessor(r) / max) * CHART_HEIGHT);
            return (
              <View
                key={r.date + i}
                style={{
                  flex: 1,
                  height: h,
                  backgroundColor: color,
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                  opacity: 0.85,
                }}
              />
            );
          })}
        </View>
      )}
      <Text className="mt-2 text-[10px] text-muted-foreground">
        {rows.length > 0
          ? `${rows[0]!.date} → ${rows[rows.length - 1]!.date}`
          : ""}
      </Text>
    </View>
  );
}
