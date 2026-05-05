import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { Clock, PercentCircle, TrendingDown, Users } from "lucide-react-native";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MetricCard } from "./metric-card";
import { PageHeader } from "./page-header";
import { formatCompact, formatNgn, formatNumber, seededRandom } from "./utils";

const DATE_RANGES = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "1y", label: "1y" },
];

export function AnalyticsPage() {
  const [range, setRange] = React.useState("30d");

  const viewsSeries = React.useMemo(() => {
    const rng = seededRandom(51);
    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const now = Date.now();
    return Array.from({ length: Math.min(days, 60) }, (_, i) => {
      const d = new Date(now - (Math.min(days, 60) - 1 - i) * 86_400_000);
      const base = 100_000 + i * (days > 30 ? 1200 : 4000);
      const views = Math.round(base + rng() * 80_000);
      return {
        day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        views,
      };
    });
  }, [range]);

  const retention = React.useMemo(() => {
    const rng = seededRandom(7);
    return Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, c) => {
        if (c > 7 - r) return null;
        const base = Math.max(12, 100 - c * 13 - r * 2);
        return Math.min(100, Math.round(base + rng() * 6));
      }),
    );
  }, []);

  const revenueByMonth = React.useMemo(() => {
    const rng = seededRandom(19);
    const labels = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    return labels.map((m, i) => ({
      month: m,
      revenue: Math.round(3_200_000 + i * 480_000 + rng() * 600_000),
    }));
  }, []);

  const topTitles = React.useMemo(() => {
    const titles = [
      "EVO Finals — Highlights",
      "PUBGM Casablanca Day 1",
      "Evo Talk Ep 12",
      "CoD Mobile Cairo",
      "Free Fire Lagos Semis",
      "EA FC Continental",
      "Retrospective: Alpha",
      "Scrim Night: Titan",
      "Accra Showdown Recap",
      "Bracket Reveal — EVO Cup",
    ];
    const rng = seededRandom(5);
    return titles
      .map((t) => ({ title: t, views: Math.round(12_000 + rng() * 240_000) }))
      .sort((a, b) => b.views - a.views);
  }, []);

  const maxViews = Math.max(...viewsSeries.map((v) => v.views));
  const maxRevenue = Math.max(...revenueByMonth.map((r) => r.revenue));

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

      <View className="flex-row flex-wrap gap-3">
        <View className="min-w-[46%] flex-1">
          <MetricCard
            title="Unique viewers"
            value={formatNumber(284_120)}
            delta={11.2}
            deltaLabel="MoM"
            icon={Users}
          />
        </View>
        <View className="min-w-[46%] flex-1">
          <MetricCard
            title="Avg watch"
            value="32m 14s"
            delta={4.5}
            deltaLabel="vs last"
            icon={Clock}
          />
        </View>
        <View className="min-w-[46%] flex-1">
          <MetricCard
            title="Conversion"
            value="2.4%"
            delta={0.3}
            deltaLabel="free → premium"
            icon={PercentCircle}
          />
        </View>
        <View className="min-w-[46%] flex-1">
          <MetricCard
            title="Premium churn"
            value="3.1%"
            delta={-0.6}
            deltaLabel="vs last"
            icon={TrendingDown}
          />
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
          {viewsSeries.map((d, i) => {
            const h = Math.max(8, (d.views / maxViews) * 110);
            return (
              <View
                key={i}
                style={{ height: h }}
                className="flex-1 rounded-sm bg-cyan-500/60"
              />
            );
          })}
        </View>
        <View className="mt-1 flex-row justify-between">
          <Text className="text-[10px] text-muted-foreground">
            {viewsSeries[0]?.day}
          </Text>
          <Text className="text-[10px] text-muted-foreground">
            {viewsSeries[viewsSeries.length - 1]?.day}
          </Text>
        </View>
      </View>

      <View className="mt-6 rounded-xl border border-border bg-card/40 p-4">
        <Text className="text-sm font-semibold text-foreground">
          Revenue by month
        </Text>
        <Text className="text-xs text-muted-foreground">
          Last 6 months, premium subs
        </Text>
        <View
          className="mt-3 flex-row items-end gap-2"
          style={{ height: 130 }}
        >
          {revenueByMonth.map((r, i) => {
            const h = Math.max(8, (r.revenue / maxRevenue) * 110);
            return (
              <View key={i} className="flex-1 items-center">
                <Text
                  className="text-[10px] text-muted-foreground"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatCompact(r.revenue)}
                </Text>
                <View
                  style={{ height: h }}
                  className="my-1 w-full rounded-sm bg-cyan-500"
                />
                <Text className="text-[10px] text-muted-foreground">
                  {r.month}
                </Text>
              </View>
            );
          })}
        </View>
        <Text className="mt-2 text-xs text-muted-foreground">
          Total:{" "}
          {formatNgn(revenueByMonth.reduce((s, r) => s + r.revenue, 0))}
        </Text>
      </View>

      <View className="mt-6 rounded-xl border border-border bg-card/40 p-4">
        <Text className="text-sm font-semibold text-foreground">
          Retention cohort
        </Text>
        <Text className="text-xs text-muted-foreground">
          Week retention over 8 cohorts
        </Text>
        <ScrollView horizontal className="mt-3" showsHorizontalScrollIndicator={false}>
          <View>
            <View className="flex-row">
              <View style={{ width: 50 }} />
              {Array.from({ length: 8 }, (_, i) => (
                <View
                  key={i}
                  style={{ width: 38 }}
                  className="items-center"
                >
                  <Text className="text-[10px] text-muted-foreground">
                    W{i}
                  </Text>
                </View>
              ))}
            </View>
            {retention.map((row, r) => (
              <View key={r} className="flex-row">
                <View
                  style={{ width: 50 }}
                  className="items-start justify-center"
                >
                  <Text className="text-[10px] text-muted-foreground">
                    W{r + 1}
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
                          : `rgba(44,215,227,${(v / 100) * 0.7 + 0.05})`,
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
                      {v == null ? "—" : `${v}%`}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="mt-6 rounded-xl border border-border bg-card/40 p-4">
        <Text className="text-sm font-semibold text-foreground">
          Top 10 VODs
        </Text>
        <Text className="text-xs text-muted-foreground">
          By views in current range
        </Text>
        <View className="mt-3 gap-2.5">
          {topTitles.map((t) => {
            const pct = Math.round((t.views / topTitles[0]!.views) * 100);
            return (
              <View key={t.title}>
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
                    {formatNumber(t.views)}
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
          })}
        </View>
      </View>
    </ScrollView>
  );
}
