import * as React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  CircleDollarSign,
  Radio,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react-native";

import {
  getOverviewMetrics,
  getViewsOverTime,
  listAdminUsers,
} from "@/lib/api/admin";
import { listLiveStreams } from "@/lib/api/streams";

import { MetricCard } from "./metric-card";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import {
  formatCompact,
  formatNgn,
  formatNumber,
  timeAgo,
} from "./utils";

export function OverviewPage() {
  const router = useRouter();

  const metricsQ = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getOverviewMetrics,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const streamsQ = useQuery({
    queryKey: ["admin", "live-streams"],
    queryFn: () => listLiveStreams(),
    staleTime: 30_000,
  });

  const viewsQ = useQuery({
    queryKey: ["admin", "views-30d"],
    queryFn: () => getViewsOverTime(30),
    staleTime: 5 * 60_000,
  });

  const signupsQ = useQuery({
    queryKey: ["admin", "recent-signups"],
    queryFn: () => listAdminUsers({ limit: 5 }),
    staleTime: 60_000,
  });

  const metrics = metricsQ.data;
  const liveCount = metrics?.liveStreams ?? streamsQ.data?.length ?? 0;
  const totalViewers =
    metrics?.totalViewers ??
    (streamsQ.data ?? []).reduce((acc, s) => acc + s.viewerCount, 0);
  const topStreams = (streamsQ.data ?? []).slice(0, 5);
  const recentSignups = signupsQ.data?.users ?? [];

  const viewsMax = React.useMemo(
    () => Math.max(1, ...(viewsQ.data ?? []).map((d) => d.views)),
    [viewsQ.data],
  );

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
            delta={undefined}
            deltaLabel={metricsQ.isLoading ? "Loading…" : "Real-time"}
            icon={Radio}
          />
        </View>
        <View className="min-w-[46%] flex-1">
          <MetricCard
            title="Signups today"
            value={metrics?.signupsToday ?? 0}
            delta={undefined}
            deltaLabel={metricsQ.isLoading ? "Loading…" : "Since 00:00 UTC"}
            icon={UserPlus}
          />
        </View>
        <View className="min-w-[46%] flex-1">
          <MetricCard
            title="Total viewers"
            value={formatNumber(totalViewers)}
            delta={undefined}
            deltaLabel={metricsQ.isLoading ? "Loading…" : "Live now"}
            icon={Users}
          />
        </View>
        <View className="min-w-[46%] flex-1">
          <MetricCard
            title="Revenue today"
            value={formatNgn(metrics?.revenueNgnToday ?? 0)}
            delta={undefined}
            deltaLabel={metricsQ.isLoading ? "Loading…" : "Since 00:00 UTC"}
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
          <StatusBadge tone={liveCount > 0 ? "emerald" : "neutral"} dot>
            {liveCount > 0 ? "Live" : "Idle"}
          </StatusBadge>
        </View>
        <View className="rounded-lg border border-border bg-background/50 p-3">
          <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
            30-day views trend
          </Text>
          {viewsQ.isLoading ? (
            <View className="mt-3 items-center" style={{ height: 80 }}>
              <ActivityIndicator color="#2CD7E3" />
            </View>
          ) : viewsQ.isError ? (
            <Text className="mt-3 text-xs text-red-400">
              Couldn't load chart
            </Text>
          ) : (viewsQ.data ?? []).length === 0 ? (
            <Text className="mt-3 text-xs text-muted-foreground">
              No views yet.
            </Text>
          ) : (
            <View className="mt-3 flex-row items-end gap-1" style={{ height: 80 }}>
              {(viewsQ.data ?? []).map((d) => {
                const h = Math.max(2, Math.round((d.views / viewsMax) * 80));
                return (
                  <View
                    key={d.date}
                    style={{ height: h }}
                    className="flex-1 rounded-sm bg-cyan-500/60"
                  />
                );
              })}
            </View>
          )}
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
          {streamsQ.isLoading ? (
            <View className="p-4">
              <ActivityIndicator color="#2CD7E3" />
            </View>
          ) : streamsQ.isError ? (
            <Text className="p-4 text-xs text-red-400">
              Couldn't load streams
            </Text>
          ) : topStreams.length === 0 ? (
            <Text className="p-4 text-xs text-muted-foreground">
              No live streams right now.
            </Text>
          ) : (
            topStreams.map((s, idx) => (
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
            ))
          )}
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
          {signupsQ.isLoading ? (
            <View className="p-4">
              <ActivityIndicator color="#2CD7E3" />
            </View>
          ) : signupsQ.isError ? (
            <Text className="p-4 text-xs text-red-400">
              Couldn't load signups
            </Text>
          ) : recentSignups.length === 0 ? (
            <Text className="p-4 text-xs text-muted-foreground">
              No recent signups.
            </Text>
          ) : (
            recentSignups.map((u, idx) => (
              <View
                key={u.id}
                className={`flex-row items-center gap-3 p-3 ${
                  idx < recentSignups.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <View className="h-9 w-9 overflow-hidden rounded-full bg-muted">
                  {u.image ? (
                    <Image
                      source={u.image}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : null}
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-foreground">
                    {u.handle ? `@${u.handle}` : u.email}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {timeAgo(u.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View className="mt-6 rounded-xl border border-border bg-card/40 p-4">
        <View className="flex-row items-center gap-2">
          <Sparkles size={14} color="#2CD7E3" />
          <Text className="text-sm text-foreground">Quick actions</Text>
        </View>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {[
            { label: "Streams", to: "/admin/streams" },
            { label: "VODs", to: "/admin/vods" },
            { label: "Clips", to: "/admin/clips" },
            { label: "Polls", to: "/admin/polls" },
            { label: "Ads", to: "/admin/ads" },
            { label: "Content", to: "/admin/content" },
            { label: "Audit log", to: "/admin/audit-log" },
            { label: "Sanctions", to: "/admin/sanctions" },
            { label: "Channels", to: "/admin/channels" },
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
