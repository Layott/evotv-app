import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  CalendarRange,
  ChartColumn,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Film,
  MonitorPlay,
  Fingerprint,
  Gavel,
  KeyRound,
  LayoutGrid,
  Megaphone,
  Radio,
  Scissors,
  ScrollText,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Tv,
  UserPlus,
  Users,
  Vote,
  type Icon,
} from "@/components/icons";

import {
  getOverviewMetrics,
  getViewsOverTime,
  listAdminOrders,
  listAdminPolls,
  listAdminSubscriptions,
  listAdminUsers,
  listAllSanctions,
  listCreatorApplications,
} from "@/lib/api/admin";
import { listAdminReports } from "@/lib/api/reports";
import { listLiveStreams } from "@/lib/api/streams";
import { listAdminWaitlist } from "@/lib/api/waitlist";

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

  // Hub stats. Cheap count-only reads (limit: 1, totals come from pagination).
  const ordersCountQ = useQuery({
    queryKey: ["admin", "hub", "orders-count"],
    queryFn: () => listAdminOrders({ limit: 1 }),
    staleTime: 60_000,
  });

  const subsCountQ = useQuery({
    queryKey: ["admin", "hub", "subs-count"],
    queryFn: () => listAdminSubscriptions({ limit: 1 }),
    staleTime: 60_000,
  });

  const sanctionsCountQ = useQuery({
    queryKey: ["admin", "hub", "sanctions-count"],
    queryFn: () => listAllSanctions({ limit: 1 }),
    staleTime: 60_000,
  });

  const pollsCountQ = useQuery({
    queryKey: ["admin", "hub", "polls-count"],
    queryFn: () => listAdminPolls({ limit: 1 }),
    staleTime: 60_000,
  });

  const creatorAppsQ = useQuery({
    queryKey: ["admin", "hub", "creator-apps-submitted"],
    queryFn: () => listCreatorApplications("submitted"),
    staleTime: 60_000,
  });

  const reportsCountQ = useQuery({
    queryKey: ["admin", "hub", "open-reports-count"],
    queryFn: () => listAdminReports({ status: "open", limit: 1 }),
    staleTime: 60_000,
  });

  const waitlistQ = useQuery({
    queryKey: ["admin", "hub", "waitlist-count"],
    queryFn: listAdminWaitlist,
    staleTime: 60_000,
  });

  const metrics = metricsQ.data;
  const liveCount = metrics?.liveStreams ?? streamsQ.data?.length ?? 0;
  const totalViewers = (streamsQ.data ?? []).reduce(
    (acc, s) => acc + s.viewerCount,
    0,
  );
  const topStreams = (streamsQ.data ?? []).slice(0, 5);
  const recentSignups = signupsQ.data?.users ?? [];

  const viewsMax = React.useMemo(
    () => Math.max(1, ...(viewsQ.data ?? []).map((d) => d.views)),
    [viewsQ.data],
  );

  const hubItems: {
    to: string;
    label: string;
    icon: Icon;
    stat: string;
  }[] = [
    {
      to: "/admin/streams",
      label: "Streams",
      icon: Radio,
      stat:
        metrics || streamsQ.data
          ? `${formatNumber(liveCount)} live now`
          : "-",
    },
    {
      to: "/admin/schedule",
      label: "Schedule",
      icon: CalendarRange,
      stat: "Programming guide",
    },
    {
      to: "/admin/content",
      label: "Content",
      icon: LayoutGrid,
      stat: "Games + ratings",
    },
    {
      to: "/admin/users",
      label: "Users",
      icon: Users,
      stat: signupsQ.data ? `${formatNumber(signupsQ.data.total)} users` : "-",
    },
    {
      to: "/admin/orders",
      label: "Orders",
      icon: ShoppingCart,
      stat: ordersCountQ.data
        ? `${formatNumber(ordersCountQ.data.total)} orders`
        : "-",
    },
    {
      to: "/admin/billing",
      label: "Billing",
      icon: CreditCard,
      stat: subsCountQ.data
        ? `${formatNumber(subsCountQ.data.total)} subs`
        : "-",
    },
    {
      to: "/admin/analytics",
      label: "Analytics",
      icon: ChartColumn,
      stat: "Views + revenue",
    },
    {
      to: "/admin/moderation",
      label: "Moderation",
      icon: ShieldAlert,
      stat: reportsCountQ.data
        ? `${formatNumber(reportsCountQ.data.total)} open reports`
        : "-",
    },
    {
      to: "/admin/sanctions",
      label: "Sanctions",
      icon: Gavel,
      stat: sanctionsCountQ.data
        ? `${formatNumber(sanctionsCountQ.data.total)} sanctions`
        : "-",
    },
    {
      to: "/admin/audit-log",
      label: "Audit log",
      icon: ScrollText,
      stat: "Admin actions",
    },
    {
      to: "/admin/forensic",
      label: "Forensic",
      icon: Fingerprint,
      stat: "Login events",
    },
    {
      to: "/admin/channels",
      label: "Channels",
      icon: Tv,
      stat: "Publisher channels",
    },
    {
      to: "/admin/polls",
      label: "Polls",
      icon: Vote,
      stat: pollsCountQ.data
        ? `${formatNumber(pollsCountQ.data.total)} polls`
        : "-",
    },
    {
      to: "/admin/ads",
      label: "Ads",
      icon: Megaphone,
      stat: "Campaigns + slots",
    },
    {
      to: "/admin/creator-program",
      label: "Creator program",
      icon: Award,
      stat: creatorAppsQ.data ? `${creatorAppsQ.data.length} pending` : "-",
    },
    {
      to: "/admin/waitlist",
      label: "Waitlist",
      icon: ClipboardList,
      stat: waitlistQ.data
        ? `${formatNumber(waitlistQ.data.count)} signups`
        : "-",
    },
    {
      to: "/admin/shows",
      label: "Shows",
      icon: MonitorPlay,
      stat: "Series and episodes",
    },
    {
      to: "/admin/vods",
      label: "VODs",
      icon: Film,
      stat: "Video library",
    },
    {
      to: "/admin/clips",
      label: "Clips",
      icon: Scissors,
      stat: "Clip library",
    },
    {
      to: "/admin/settings",
      label: "Settings",
      icon: Settings,
      stat: "Platform config",
    },
    {
      to: "/admin/api-keys",
      label: "API keys",
      icon: KeyRound,
      stat: "Service keys",
    },
  ];

  const hubRows: (typeof hubItems)[] = [];
  for (let i = 0; i < hubItems.length; i += 2) {
    hubRows.push(hubItems.slice(i, i + 2));
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <PageHeader
        title="Overview"
        description="Operational snapshot across streams, subscriptions and revenue."
      />

      <View className="gap-3">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <MetricCard
              title="Live streams"
              value={liveCount}
              delta={undefined}
              deltaLabel={metricsQ.isLoading ? "Loading…" : "Real-time"}
              icon={Radio}
            />
          </View>
          <View className="flex-1">
            <MetricCard
              title="Signups today"
              value={metrics?.todaySignups ?? 0}
              delta={undefined}
              deltaLabel={metricsQ.isLoading ? "Loading…" : "Since 00:00 UTC"}
              icon={UserPlus}
            />
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <MetricCard
              title="Total viewers"
              value={formatNumber(totalViewers)}
              delta={undefined}
              deltaLabel={metricsQ.isLoading ? "Loading…" : "Live now"}
              icon={Users}
            />
          </View>
          <View className="flex-1">
            <MetricCard
              title="Active premium"
              value={formatNumber(metrics?.activePremiumSubs ?? 0)}
              delta={undefined}
              deltaLabel={
                metricsQ.isLoading
                  ? "Loading…"
                  : metrics
                    ? `${formatNgn(metrics.mrrNgn)} MRR`
                    : "Subscribers"
              }
              icon={CircleDollarSign}
            />
          </View>
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
              <ActivityIndicator color="#46E3CE" />
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
              <ActivityIndicator color="#46E3CE" />
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
              <ActivityIndicator color="#46E3CE" />
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

      <View className="mt-6">
        <View className="flex-row items-center gap-2">
          <LayoutGrid size={14} color="#46E3CE" />
          <Text className="text-sm font-semibold text-foreground">
            All admin pages
          </Text>
        </View>
        <Text className="mt-0.5 text-xs text-muted-foreground">
          Jump into any admin area.
        </Text>
        <View className="mt-3 gap-3">
          {hubRows.map((row, rowIdx) => (
            <View key={rowIdx} className="flex-row gap-3">
              {row.map((item) => {
                const Icon = item.icon;
                return (
                  <View key={item.to} className="flex-1">
                    <Pressable
                      onPress={() => router.push(item.to as never)}
                      className="rounded-xl border border-border bg-card/40 p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center gap-2">
                        <View className="rounded-md bg-muted p-1.5">
                          <Icon size={14} color="#46E3CE" />
                        </View>
                        <Text
                          numberOfLines={1}
                          className="flex-1 text-sm font-medium text-foreground"
                        >
                          {item.label}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        className="mt-2 text-xs text-muted-foreground"
                        style={{ fontVariant: ["tabular-nums"] }}
                      >
                        {item.stat}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
              {row.length === 1 ? <View className="flex-1" /> : null}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
