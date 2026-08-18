import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import {
  CircleDollarSign,
  LayoutGrid,
  Radio,
  UserPlus,
  Users,
} from "@/components/icons";

import {
  getOverviewMetrics,
  getViewsOverTime,
  listAdminOrders,
  listAdminPolls,
  listAdminSubscriptions,
  listAdminUsers,
} from "@/lib/api/admin";
import { listAdminReports } from "@/lib/api/reports";
import { listAdminVods } from "@/lib/api/vods";
import { listLiveStreams } from "@/lib/api/streams";
import { adminNavFor } from "@/lib/admin/nav-items";
import { hasMinRole } from "@/lib/auth/roles";
import { useAuth } from "@/components/providers";
import { useTokens } from "@/lib/theme/tokens";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

import { ListState } from "./list-state";
import { MetricCard } from "./metric-card";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatCompact, formatNgn, formatNumber, timeAgo } from "./utils";

/**
 * The admin landing screen.
 *
 * The grid at the bottom used to be its own array of twenty-one destinations,
 * in its own order, under its own labels: "Billing" where the website says
 * "Billing & USSD", "Users" where it says "Users & roles", sanctions and API
 * keys promoted to top-level tiles the website does not have. That array was
 * the second CMS. It now reads `adminNavFor(role)`, the same list the sections
 * sheet and the website sidebar use, so the three cannot disagree again.
 *
 * The live stat under a tile is the one thing the website does not have, and it
 * is worth keeping: knowing there are four open reports before opening
 * Moderation is the point of a landing screen. Stats are keyed by the nav
 * item's `href` rather than living in a parallel array, so adding a section
 * never leaves a stat attached to the wrong tile. A section with nothing cheap
 * to count renders without a stat line rather than with a dash.
 */
export function OverviewPage() {
  const router = useRouter();
  const t = useTokens();
  const { role } = useAuth();

  const sections = React.useMemo(() => adminNavFor(role), [role]);

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

  /**
   * Tile stats. Count-only reads: `limit: 1` fetches one row and the totals
   * come from the pagination envelope, so a tile costs a count, not a list.
   *
   * Each is switched off for a role that could not read it. The endpoints gate
   * themselves, so leaving them on would not leak anything, but a support admin
   * opening the dashboard would fire five requests that all answer 403 and then
   * render nothing. `enabled` uses the same minimum the section itself carries.
   */
  const ordersCountQ = useQuery({
    queryKey: ["admin", "hub", "orders-count"],
    queryFn: () => listAdminOrders({ limit: 1 }),
    enabled: hasMinRole(role, "support_admin"),
    staleTime: 60_000,
  });

  const subsCountQ = useQuery({
    queryKey: ["admin", "hub", "subs-count"],
    queryFn: () => listAdminSubscriptions({ limit: 1 }),
    enabled: hasMinRole(role, "finance_admin"),
    staleTime: 60_000,
  });

  const pollsCountQ = useQuery({
    queryKey: ["admin", "hub", "polls-count"],
    queryFn: () => listAdminPolls({ limit: 1 }),
    enabled: hasMinRole(role, "admin"),
    staleTime: 60_000,
  });

  const reportsCountQ = useQuery({
    queryKey: ["admin", "hub", "open-reports-count"],
    queryFn: () => listAdminReports({ status: "open", limit: 1 }),
    enabled: hasMinRole(role, "moderator"),
    staleTime: 60_000,
  });

  const vodsCountQ = useQuery({
    queryKey: ["admin", "hub", "vods-count"],
    queryFn: () => listAdminVods({ limit: 1 }),
    enabled: hasMinRole(role, "moderator"),
    staleTime: 60_000,
  });

  const metrics = metricsQ.data;
  const liveCount = metrics?.liveStreams ?? streamsQ.data?.length ?? 0;
  const totalViewers = (streamsQ.data ?? []).reduce(
    (acc, s) => acc + (s.viewerCount ?? 0),
    0,
  );
  const topStreams = (streamsQ.data ?? []).slice(0, 5);
  const recentSignups = signupsQ.data?.users ?? [];

  const viewsMax = React.useMemo(
    () => Math.max(1, ...(viewsQ.data ?? []).map((d) => d.views)),
    [viewsQ.data],
  );

  /**
   * The live number under a tile, by route.
   *
   * Undefined means "nothing cheap to say about this section", which is most of
   * them, and the tile renders as a label alone. A section whose count has not
   * arrived yet is also undefined rather than a dash: an empty line settles into
   * a number, where a dash reads as a broken value.
   */
  const statFor = React.useMemo<Record<string, string | undefined>>(() => {
    const stats: Record<string, string | undefined> = {};

    if (metrics || streamsQ.data) {
      stats["/admin/streams"] = `${formatNumber(liveCount)} live now`;
    }
    if (signupsQ.data) {
      stats["/admin/users"] = `${formatNumber(signupsQ.data.total)} users`;
    }
    if (ordersCountQ.data) {
      stats["/admin/orders"] = `${formatNumber(ordersCountQ.data.total)} orders`;
    }
    if (subsCountQ.data) {
      stats["/admin/subscriptions"] =
        `${formatNumber(subsCountQ.data.total)} subscribers`;
    }
    if (pollsCountQ.data) {
      stats["/admin/polls"] = `${formatNumber(pollsCountQ.data.total)} polls`;
    }
    if (reportsCountQ.data) {
      stats["/admin/moderation"] =
        `${formatNumber(reportsCountQ.data.total)} open reports`;
    }
    if (vodsCountQ.data) {
      stats["/admin/library"] = `${formatNumber(vodsCountQ.data.total)} videos`;
    }

    return stats;
  }, [
    metrics,
    streamsQ.data,
    liveCount,
    signupsQ.data,
    ordersCountQ.data,
    subsCountQ.data,
    pollsCountQ.data,
    reportsCountQ.data,
    vodsCountQ.data,
  ]);

  const rows: (typeof sections)[] = [];
  for (let i = 0; i < sections.length; i += 2) {
    rows.push(sections.slice(i, i + 2));
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
              deltaLabel={metricsQ.isPending ? "Loading…" : "Real-time"}
              icon={Radio}
            />
          </View>
          <View className="flex-1">
            <MetricCard
              title="Signups today"
              value={metrics?.todaySignups ?? 0}
              deltaLabel={metricsQ.isPending ? "Loading…" : "Since 00:00 UTC"}
              icon={UserPlus}
            />
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <MetricCard
              title="Total viewers"
              value={formatNumber(totalViewers)}
              deltaLabel={metricsQ.isPending ? "Loading…" : "Live now"}
              icon={Users}
            />
          </View>
          <View className="flex-1">
            <MetricCard
              title="Active premium"
              value={formatNumber(metrics?.activePremiumSubs ?? 0)}
              deltaLabel={
                metricsQ.isPending
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

      <View className="mt-6 rounded-2xl bg-card p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
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
        <View className="rounded-xl bg-background p-3">
          <Text className="text-[10px] text-muted-foreground">
            30-day views trend
          </Text>
          <ListState
            isPending={viewsQ.isPending}
            isError={viewsQ.isError}
            error={viewsQ.error}
            isEmpty={(viewsQ.data ?? []).length === 0}
            emptyMessage="No views recorded in the last 30 days."
            onRetry={() => viewsQ.refetch()}
          />
          {!viewsQ.isPending &&
          !viewsQ.isError &&
          (viewsQ.data ?? []).length > 0 ? (
            <View className="mt-3 flex-row items-end gap-1" style={{ height: 80 }}>
              {(viewsQ.data ?? []).map((d) => {
                const h = Math.max(2, Math.round((d.views / viewsMax) * 80));
                return (
                  <View
                    key={d.date}
                    style={{ height: h }}
                    className="flex-1 rounded-sm bg-brand/60"
                  />
                );
              })}
            </View>
          ) : null}
        </View>
      </View>

      <View className="mt-6 overflow-hidden rounded-2xl bg-card">
        <View className="flex-row items-center justify-between p-4 pb-2">
          <Text className="text-sm font-semibold text-foreground">
            Top streams right now
          </Text>
          <Pressable
            onPress={() => router.push("/admin/streams" as never)}
            hitSlop={8}
            accessibilityRole="link"
            className="active:opacity-70"
          >
            <Text className="text-xs font-semibold text-brand">View all</Text>
          </Pressable>
        </View>
        <View className="px-3 pb-3">
          <ListState
            isPending={streamsQ.isPending}
            isError={streamsQ.isError}
            error={streamsQ.error}
            isEmpty={topStreams.length === 0}
            emptyMessage="Nothing is live right now."
            onRetry={() => streamsQ.refetch()}
          />
          {topStreams.map((s) => (
            <View
              key={s.id}
              className="mb-1 flex-row items-center gap-3 rounded-xl bg-background p-3"
            >
              <View className="h-10 w-16 overflow-hidden rounded-lg bg-muted">
                <ImageWithFallback
                  source={s.thumbnailUrl}
                  fallbackLabel={s.title}
                  tintSeed={s.id}
                  // The placeholder branch is a bare View, so it needs a size
                  // of its own or it collapses inside its box.
                  style={{ width: "100%", height: "100%" }}
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-medium text-foreground"
                >
                  {s.title}
                </Text>
                <Text numberOfLines={1} className="text-xs text-muted-foreground">
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
                {formatCompact(s.viewerCount ?? 0)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-6 overflow-hidden rounded-2xl bg-card">
        <View className="flex-row items-center justify-between p-4 pb-2">
          <Text className="text-sm font-semibold text-foreground">
            Recent signups
          </Text>
          <Pressable
            onPress={() => router.push("/admin/users" as never)}
            hitSlop={8}
            accessibilityRole="link"
            className="active:opacity-70"
          >
            <Text className="text-xs font-semibold text-brand">Users</Text>
          </Pressable>
        </View>
        <View className="px-3 pb-3">
          <ListState
            isPending={signupsQ.isPending}
            isError={signupsQ.isError}
            error={signupsQ.error}
            isEmpty={recentSignups.length === 0}
            emptyMessage="Nobody has signed up yet."
            onRetry={() => signupsQ.refetch()}
          />
          {recentSignups.map((u) => (
            <View
              key={u.id}
              className="mb-1 flex-row items-center gap-3 rounded-xl bg-background p-3"
            >
              <View className="h-9 w-9 overflow-hidden rounded-full bg-muted">
                <ImageWithFallback
                  source={u.image ?? ""}
                  fallbackLabel={u.handle ?? u.email}
                  tintSeed={u.id}
                  style={{ width: "100%", height: "100%" }}
                />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="text-sm text-foreground">
                  {u.handle ? `@${u.handle}` : u.email}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {timeAgo(u.createdAt)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-6">
        <View className="flex-row items-center gap-2">
          <LayoutGrid size={14} color={t.brand} />
          <Text className="text-sm font-semibold text-foreground">
            All admin sections
          </Text>
        </View>
        <Text className="mt-0.5 text-xs text-muted-foreground">
          The same list as the Sections button, in the same order as the
          website.
        </Text>
        <View className="mt-3 gap-3">
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} className="flex-row gap-3">
              {row.map((item) => {
                const stat = statFor[item.href];
                return (
                  <View key={item.href} className="flex-1">
                    <Pressable
                      onPress={() => router.push(item.href as never)}
                      accessibilityRole="link"
                      // Stretches to the tallest tile in the row: not every
                      // section has a stat line, and without this the two
                      // halves of a row end up different heights.
                      className="flex-1 rounded-xl bg-card p-3 active:opacity-70"
                    >
                      <View className="flex-row items-center gap-2">
                        <View className="rounded-lg bg-muted p-1.5">
                          <item.Icon size={14} color={t.brand} />
                        </View>
                        <Text
                          numberOfLines={1}
                          className="flex-1 text-sm font-medium text-foreground"
                        >
                          {item.label}
                        </Text>
                      </View>
                      {stat ? (
                        <Text
                          numberOfLines={1}
                          className="mt-2 text-xs text-muted-foreground"
                          style={{ fontVariant: ["tabular-nums"] }}
                        >
                          {stat}
                        </Text>
                      ) : null}
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
