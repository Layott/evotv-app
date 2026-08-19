import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { Clock, PercentCircle, Radio, Users } from "@/components/icons";
import { useQuery } from "@tanstack/react-query";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RangeInput } from "@/lib/analytics-range";
import {
  getFreeToPremiumConversion,
  getViewsInWindow,
  getOverviewMetrics,
  getRetention,
  getRevenueByMonth,
  getTopVods,
  getViewsOverTime,
} from "@/lib/api/admin";

import { DayPicker } from "./day-picker";
import { MetricCard } from "./metric-card";
import { PageHeader } from "./page-header";
import { formatCompact, formatNgn, formatNumber } from "./utils";

const DATE_RANGES = [
  { value: "1d", label: "Today", days: 1 },
  { value: "7d", label: "7d", days: 7 },
  { value: "30d", label: "30d", days: 30 },
  { value: "90d", label: "90d", days: 90 },
  { value: "1y", label: "1y", days: 365 },
  { value: "custom", label: "Dates", days: 0 },
];

/** Today as a UTC day key, matching the API and the buckets behind it. */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function rangeToDays(r: string): number {
  return DATE_RANGES.find((d) => d.value === r)?.days || 30;
}

export function AnalyticsPage() {
  const [range, setRange] = React.useState("30d");
  /*
   * A chosen window, kept beside the preset rather than inside it.
   *
   * The presets could not answer how a particular night went, which is the
   * question the channel actually asks. "Dates" opens a month grid; everything
   * else is a preset, and the two cannot both be active.
   */
  const [dates, setDates] = React.useState<RangeInput>({ from: todayKey() });
  const custom = range === "custom";

  const overviewQ = useQuery({
    queryKey: ["admin-analytics-overview"],
    queryFn: getOverviewMetrics,
    staleTime: 60_000,
  });

  const viewsQ = useQuery({
    queryKey: ["admin-analytics-views", range, dates.from, dates.to],
    queryFn: () =>
      custom ? getViewsInWindow(dates) : getViewsOverTime(rangeToDays(range)),
    staleTime: 60_000,
  });

  const retentionQ = useQuery({
    queryKey: ["admin-analytics-retention"],
    queryFn: () => getRetention(8),
    staleTime: 5 * 60_000,
  });

  const revenueQ = useQuery({
    queryKey: ["admin-analytics-revenue"],
    queryFn: () => getRevenueByMonth(6),
    staleTime: 5 * 60_000,
  });

  const topVodsQ = useQuery({
    queryKey: ["admin-analytics-top-vods"],
    queryFn: () => getTopVods(10),
    staleTime: 5 * 60_000,
  });

  const conversionQ = useQuery({
    queryKey: ["admin-analytics-conversion"],
    queryFn: getFreeToPremiumConversion,
    staleTime: 5 * 60_000,
  });

  const viewsSeries = viewsQ.data ?? [];
  const retention = retentionQ.data?.matrix ?? [];
  const revenue = revenueQ.data ?? [];
  const topVods = topVodsQ.data ?? [];
  const overview = overviewQ.data;
  const conversion = conversionQ.data;

  const maxViews = viewsSeries.length > 0
    ? Math.max(1, ...viewsSeries.map((v) => v.views))
    : 1;
  const maxRevenue = revenue.length > 0
    ? Math.max(1, ...revenue.map((r) => r.ngn))
    : 1;
  const topMax = topVods.length > 0 ? Math.max(1, topVods[0].viewCount) : 1;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <PageHeader
        title="Analytics"
        description="Audience, retention and revenue signals."
      />

      <Tabs value={range} onValueChange={setRange}>
        <TabsList className="mb-4">
          {DATE_RANGES.map((r) => (
            <TabsTrigger key={r.value} value={r.value}>
              {r.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {custom ? (
        <View className="mb-4">
          <DayPicker value={dates} onChange={setDates} />
        </View>
      ) : null}

      <View className="gap-3">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <MetricCard
              title="Active premium"
              value={overview ? formatNumber(overview.activePremiumSubs) : "-"}
              delta={undefined}
              deltaLabel={overviewQ.isLoading ? "Loading…" : "Subscribers"}
              icon={Users}
            />
          </View>
          <View className="flex-1">
            <MetricCard
              title="Live streams"
              value={overview ? formatNumber(overview.liveStreams) : "-"}
              delta={undefined}
              deltaLabel={overviewQ.isLoading ? "Loading…" : "Right now"}
              icon={Radio}
            />
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <MetricCard
              title="Conversion"
              value={conversion ? `${conversion.pct.toFixed(2)}%` : "-"}
              delta={undefined}
              deltaLabel="free → premium"
              icon={PercentCircle}
            />
          </View>
          <View className="flex-1">
            <MetricCard
              title="Signups today"
              value={overview ? formatNumber(overview.todaySignups) : "-"}
              delta={undefined}
              deltaLabel="Last 24h"
              icon={Clock}
            />
          </View>
        </View>
      </View>

      <View className="mt-6 rounded-xl border border-border bg-card/40 p-4">
        <Text className="text-sm font-semibold text-foreground">
          Views over time
        </Text>
        <Text className="text-xs text-muted-foreground">
          {DATE_RANGES.find((r) => r.value === range)?.label}
        </Text>
        <View className="mt-3 flex-row items-end gap-0.5" style={{ height: 120 }}>
          {viewsSeries.length === 0 ? (
            <Text className="text-xs text-muted-foreground">
              {viewsQ.isLoading ? "Loading…" : "No views recorded yet."}
            </Text>
          ) : (
            viewsSeries.map((d, i) => {
              const h = Math.max(8, (d.views / maxViews) * 110);
              return (
                <View
                  key={i}
                  style={{ height: h }}
                  className="flex-1 rounded-sm bg-cyan-500/60"
                />
              );
            })
          )}
        </View>
        {viewsSeries.length > 0 ? (
          <View className="mt-1 flex-row justify-between">
            <Text className="text-[10px] text-muted-foreground">
              {viewsSeries[0]?.date}
            </Text>
            <Text className="text-[10px] text-muted-foreground">
              {viewsSeries[viewsSeries.length - 1]?.date}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-6 rounded-xl border border-border bg-card/40 p-4">
        <Text className="text-sm font-semibold text-foreground">
          Revenue by month
        </Text>
        <Text className="text-xs text-muted-foreground">
          Last 6 months - subs + orders combined
        </Text>
        <View
          className="mt-3 flex-row items-end gap-2"
          style={{ height: 130 }}
        >
          {revenue.length === 0 ? (
            <Text className="text-xs text-muted-foreground">
              {revenueQ.isLoading ? "Loading…" : "No revenue yet."}
            </Text>
          ) : (
            revenue.map((r) => {
              const h = Math.max(8, (r.ngn / maxRevenue) * 110);
              return (
                <View key={r.month} className="flex-1 items-center">
                  <Text
                    className="text-[10px] text-muted-foreground"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatCompact(r.ngn)}
                  </Text>
                  <View
                    style={{ height: h }}
                    className="my-1 w-full rounded-sm bg-cyan-500"
                  />
                  <Text className="text-[10px] text-muted-foreground">
                    {r.month.slice(5)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
        {revenue.length > 0 ? (
          <Text className="mt-2 text-xs text-muted-foreground">
            Total:{" "}
            {formatNgn(revenue.reduce((s, r) => s + r.ngn, 0))}
          </Text>
        ) : null}
      </View>

      <View className="mt-6 rounded-xl border border-border bg-card/40 p-4">
        <Text className="text-sm font-semibold text-foreground">
          Retention cohort
        </Text>
        <Text className="text-xs text-muted-foreground">
          Week retention over 8 signup cohorts
        </Text>
        {retention.length === 0 ? (
          <Text className="mt-3 text-xs text-muted-foreground">
            {retentionQ.isLoading ? "Loading…" : "Not enough data yet."}
          </Text>
        ) : (
          <ScrollView
            horizontal
            className="mt-3"
            showsHorizontalScrollIndicator={false}
          >
            <View>
              <View className="flex-row">
                <View style={{ width: 60 }} />
                {Array.from(
                  { length: retention[0]?.length ?? 0 },
                  (_, i) => (
                    <View key={i} style={{ width: 38 }} className="items-center">
                      <Text className="text-[10px] text-muted-foreground">
                        W{i}
                      </Text>
                    </View>
                  ),
                )}
              </View>
              {retention.map((row, r) => (
                <View key={r} className="flex-row">
                  <View
                    style={{ width: 60 }}
                    className="items-start justify-center"
                  >
                    <Text className="text-[10px] text-muted-foreground">
                      {retentionQ.data?.cohorts[r]?.weekStart.slice(5) ?? "?"}
                    </Text>
                  </View>
                  {row.map((v, c) => (
                    <View
                      key={c}
                      style={{
                        width: 36,
                        height: 24,
                        margin: 1,
                        backgroundColor:
                          v == null
                            ? "transparent"
                            : `rgba(70,227,206,${(v / 100) * 0.7 + 0.05})`,
                        borderRadius: 4,
                      }}
                      className="items-center justify-center"
                    >
                      <Text
                        className="text-[10px]"
                        style={{
                          color:
                            v == null
                              ? "#3f3f46"
                              : v > 55
                                ? "#052e30"
                                : "#A7E5F3",
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {v == null ? "-" : `${v}%`}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <View className="mt-6 rounded-xl border border-border bg-card/40 p-4">
        <Text className="text-sm font-semibold text-foreground">
          Top 10 VODs
        </Text>
        <Text className="text-xs text-muted-foreground">
          By total views
        </Text>
        <View className="mt-3 gap-2.5">
          {topVods.length === 0 ? (
            <Text className="text-xs text-muted-foreground">
              {topVodsQ.isLoading ? "Loading…" : "No VODs yet."}
            </Text>
          ) : (
            topVods.map((t) => {
              const pct = Math.round((t.viewCount / topMax) * 100);
              return (
                <View key={t.id}>
                  <View className="flex-row items-center justify-between">
                    <Text
                      numberOfLines={1}
                      className="flex-1 pr-2 text-xs text-foreground"
                    >
                      {t.title}
                    </Text>
                    <Text
                      className="text-xs text-muted-foreground"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {formatNumber(t.viewCount)}
                    </Text>
                  </View>
                  <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${pct}%` }}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}
