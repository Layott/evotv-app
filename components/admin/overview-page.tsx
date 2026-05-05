import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CircleDollarSign,
  Radio,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react-native";

import { listLiveStreams } from "@/lib/mock/streams";
import { profiles } from "@/lib/mock/users";

import { MetricCard } from "./metric-card";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import {
  formatCompact,
  formatNgn,
  formatNumber,
  seededRandom,
  timeAgo,
} from "./utils";

export function OverviewPage() {
  const router = useRouter();
  const streamsQ = useQuery({
    queryKey: ["admin", "live-streams"],
    queryFn: () => listLiveStreams(),
  });

  const liveCount = streamsQ.data?.length ?? 0;
  const totalViewers = (streamsQ.data ?? []).reduce(
    (acc, s) => acc + s.viewerCount,
    0,
  );

  const rng = React.useMemo(() => seededRandom(7), []);
  const signupsToday = React.useMemo(
    () => Math.round(40 + rng() * 40),
    [rng],
  );
  const premiumSubs = React.useMemo(
    () => 1_820 + Math.round(rng() * 240),
    [rng],
  );
  const mrr = premiumSubs * 2_500;

  const recentSignups = React.useMemo(() => {
    return [...profiles]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, []);

  const alerts: {
    id: string;
    tone: "amber" | "red" | "emerald";
    title: string;
    body: string;
  }[] = [
    {
      id: "a1",
      tone: "amber",
      title: "Stream key rotation reminder",
      body: "3 official streams have not rotated their key in 90+ days.",
    },
    {
      id: "a2",
      tone: "red",
      title: "Chat spike on stream_lagos_final",
      body: "Chat activity is 4× baseline. 12 reports awaiting review.",
    },
    {
      id: "a3",
      tone: "emerald",
      title: "Premium conversions up 8%",
      body: "Week-over-week conversion ticked up to 2.4%.",
    },
  ];

  const topStreams = (streamsQ.data ?? []).slice(0, 5);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <PageHeader
        title="Overview"
        description="Operational snapshot across streams, subscriptions and revenue."
      />

      <View className="flex-row flex-wrap gap-3">
        <View className="min-w-[46%] flex-1">
          <MetricCard
            title="Live streams"
            value={liveCount}
            delta={12.4}
            deltaLabel="vs last hour"
            icon={Radio}
          />
        </View>
        <View className="min-w-[46%] flex-1">
          <MetricCard
            title="Signups today"
            value={signupsToday}
            delta={6.3}
            deltaLabel="vs yesterday"
            icon={UserPlus}
          />
        </View>
        <View className="min-w-[46%] flex-1">
          <MetricCard
            title="Active premium"
            value={formatNumber(premiumSubs)}
            delta={3.1}
            deltaLabel="rolling 7d"
            icon={Users}
          />
        </View>
        <View className="min-w-[46%] flex-1">
          <MetricCard
            title="MRR"
            value={formatNgn(mrr)}
            delta={4.8}
            deltaLabel="vs last month"
            icon={CircleDollarSign}
          />
        </View>
      </View>

      <View className="mt-6 rounded-xl border border-border bg-card/40 p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-semibold text-foreground">
              Live snapshot
            </Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              {formatNumber(totalViewers)} viewers across {liveCount} streams
            </Text>
          </View>
          <StatusBadge tone="emerald" dot>
            Live
          </StatusBadge>
        </View>
        <View className="rounded-lg border border-border bg-background/50 p-3">
          <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
            30-day views trend
          </Text>
          <View className="mt-3 flex-row items-end gap-1" style={{ height: 80 }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const r = seededRandom(42 + i);
              const h = 25 + Math.round(r() * 55);
              return (
                <View
                  key={i}
                  style={{ height: h }}
                  className="flex-1 rounded-sm bg-cyan-500/60"
                />
              );
            })}
          </View>
        </View>
      </View>

      <View className="mt-6 overflow-hidden rounded-xl border border-border bg-card/40">
        <View className="flex-row items-center justify-between border-b border-border p-4">
          <Text className="text-sm font-semibold text-foreground">
            Top streams right now
          </Text>
          <Text
            className="text-xs text-cyan-400"
            onPress={() => router.push("/admin/streams" as never)}
          >
            View all
          </Text>
        </View>
        <View>
          {topStreams.length === 0 && streamsQ.isLoading ? (
            <View className="p-4">
              <Text className="text-sm text-muted-foreground">Loading…</Text>
            </View>
          ) : null}
          {topStreams.map((s, idx) => (
            <View
              key={s.id}
              className={`flex-row items-center gap-3 p-3 ${
                idx < topStreams.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <View className="h-10 w-16 overflow-hidden rounded bg-muted">
                <Image
                  source={s.thumbnailUrl}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-medium text-foreground"
                >
                  {s.title}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-xs text-muted-foreground"
                >
                  {s.streamerName}
                </Text>
              </View>
              <StatusBadge tone="red" dot>
                LIVE
              </StatusBadge>
              <Text
                className="w-12 text-right text-sm text-foreground"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatCompact(s.viewerCount)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-6 overflow-hidden rounded-xl border border-border bg-card/40">
        <View className="flex-row items-center justify-between border-b border-border p-4">
          <Text className="text-sm font-semibold text-foreground">
            Recent signups
          </Text>
          <Text
            className="text-xs text-cyan-400"
            onPress={() => router.push("/admin/users" as never)}
          >
            Users
          </Text>
        </View>
        <View>
          {recentSignups.map((u, idx) => (
            <View
              key={u.id}
              className={`flex-row items-center gap-3 p-3 ${
                idx < recentSignups.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <View className="h-9 w-9 overflow-hidden rounded-full bg-muted">
                <Image
                  source={u.avatarUrl}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-foreground">@{u.handle}</Text>
                <Text className="text-xs text-muted-foreground">
                  {timeAgo(u.createdAt)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-6 overflow-hidden rounded-xl border border-border bg-card/40">
        <View className="flex-row items-center gap-2 border-b border-border p-4">
          <AlertTriangle size={16} color="#FBBF24" />
          <Text className="text-sm font-semibold text-foreground">Alerts</Text>
        </View>
        <View>
          {alerts.map((a, idx) => (
            <View
              key={a.id}
              className={`p-3 ${
                idx < alerts.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <View className="flex-row items-center gap-2">
                <StatusBadge tone={a.tone} dot>
                  {a.tone === "red"
                    ? "Action"
                    : a.tone === "amber"
                      ? "Warn"
                      : "Info"}
                </StatusBadge>
                <Text
                  numberOfLines={1}
                  className="flex-1 text-sm font-medium text-foreground"
                >
                  {a.title}
                </Text>
              </View>
              <Text className="mt-1 text-xs text-muted-foreground">
                {a.body}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-6 rounded-xl border border-border bg-card/40 p-4">
        <View className="flex-row items-center gap-2">
          <Sparkles size={14} color="#2CD7E3" />
          <Text className="text-sm text-foreground">Quick actions</Text>
        </View>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {[
            { label: "New stream", to: "/admin/streams" },
            { label: "New poll", to: "/admin/polls" },
            { label: "New ad", to: "/admin/ads" },
            { label: "New event", to: "/admin/content" },
          ].map((q) => (
            <Text
              key={q.to}
              onPress={() => router.push(q.to as never)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground"
            >
              {q.label}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
