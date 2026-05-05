import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock,
  Coins,
  Eye,
  Film,
  Heart,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react-native";

import { useMockAuth } from "@/components/providers";
import {
  getCreatorActivity,
  getCreatorMetrics,
} from "@/lib/mock/creators";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardShell } from "@/components/creators/dashboard-shell";
import { MetricCard } from "@/components/creators/metric-card";
import { relativeTime } from "@/components/creators/relative-time";

type ActivityKind = "tip" | "follower" | "clip" | "milestone";

const ACTIVITY_ICON: Record<ActivityKind, LucideIcon> = {
  tip: Heart,
  follower: UserPlus,
  clip: Film,
  milestone: Zap,
};

const ACTIVITY_COLOR: Record<ActivityKind, string> = {
  tip: "#F0ABFC",
  follower: "#6EE7B7",
  clip: "#7DD3FC",
  milestone: "#FCD34D",
};

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";

  const metricsQ = useQuery({
    queryKey: ["creator-dashboard", "metrics", userId],
    queryFn: () => getCreatorMetrics(userId),
  });
  const activityQ = useQuery({
    queryKey: ["creator-dashboard", "activity", userId],
    queryFn: () => getCreatorActivity(userId),
  });

  const loading =
    metricsQ.isLoading || activityQ.isLoading || !metricsQ.data || !activityQ.data;
  const metrics = metricsQ.data;
  const activity = activityQ.data ?? [];
  const newClipCount = activity.filter((a) => a.kind === "clip").length;

  return (
    <DashboardShell
      title="Creator dashboard"
      screenTitle="Dashboard"
      description={
        metrics ? `This month — ${metrics.monthLabel}` : "Loading metrics..."
      }
      actions={
        <Button
          onPress={() => router.push("/(authed)/creator-dashboard/clips")}
          className="bg-sky-500 self-start"
        >
          <Film size={14} color="#0A0A0A" />
          <Text className="text-sm font-semibold text-neutral-950">Review clips</Text>
        </Button>
      }
    >
      {loading || !metrics ? (
        <View className="gap-4">
          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </View>
          <Skeleton className="h-72 rounded-2xl" />
        </View>
      ) : (
        <View className="gap-6">
          <View className="gap-3">
            <MetricCard
              label="Hours streamed"
              value={`${metrics.hoursStreamed}h`}
              hint={metrics.monthLabel}
              icon={Clock}
              accent="sky"
              delta={12.4}
            />
            <MetricCard
              label="Avg concurrent"
              value={metrics.averageConcurrent.toLocaleString()}
              hint={`peak ${metrics.peakConcurrent.toLocaleString()}`}
              icon={Eye}
              accent="emerald"
              delta={8.1}
            />
            <MetricCard
              label="Tips received"
              value={metrics.totalTipsCoins.toLocaleString()}
              hint="EVO Coins this month"
              icon={Coins}
              accent="amber"
              delta={24.6}
            />
            <MetricCard
              label="Followers"
              value={`+${metrics.followerGrowth.toLocaleString()}`}
              hint={`${metrics.followerGrowthPct}% growth`}
              icon={UserPlus}
              accent="fuchsia"
              delta={metrics.followerGrowthPct}
            />
          </View>

          <View className="rounded-2xl border border-border bg-card/40 p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">
                Recent activity
              </Text>
              <Text className="text-[10px] uppercase tracking-widest text-muted-foreground">
                live feed
              </Text>
            </View>
            <View className="mt-4 gap-3">
              {activity.map((a) => {
                const kind = a.kind as ActivityKind;
                const Icon = ACTIVITY_ICON[kind] ?? Zap;
                return (
                  <View key={a.id} className="flex-row items-start gap-3">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                      <Icon size={14} color={ACTIVITY_COLOR[kind] ?? "#A3A3A3"} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm text-foreground">{a.label}</Text>
                      <Text className="text-[11px] text-muted-foreground">
                        {relativeTime(a.at)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View className="gap-3">
            <QuickLink
              title="Earnings"
              desc="Payouts, fees, monthly breakdown"
              icon={Coins}
              accentBg="bg-amber-500/15"
              accentBorder="border-amber-500/30"
              accentColor="#FCD34D"
              onPress={() => router.push("/(authed)/creator-dashboard/earnings")}
            />
            <QuickLink
              title="Auto-clips queue"
              desc="Approve highlights from your last stream"
              icon={Film}
              accentBg="bg-sky-500/15"
              accentBorder="border-sky-500/30"
              accentColor="#7DD3FC"
              badge={`${newClipCount} new`}
              onPress={() => router.push("/(authed)/creator-dashboard/clips")}
            />
            <QuickLink
              title="Audience demographics"
              desc="Who's watching, where, when"
              icon={Users}
              accentBg="bg-fuchsia-500/15"
              accentBorder="border-fuchsia-500/30"
              accentColor="#F0ABFC"
              onPress={() => router.push("/(authed)/creator-dashboard/audience")}
            />
          </View>

          <View className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <View className="flex-row items-center gap-2">
              <TrendingUp size={16} color="#6EE7B7" />
              <Text className="text-sm font-semibold text-emerald-200">
                Tip of the week
              </Text>
            </View>
            <Text className="mt-2 text-xs text-emerald-100/90">
              Streamers who go live within 30 minutes of an EVO TV scheduled match see a 2.3× lift in average concurrent viewers. Set up a recurring schedule to auto-promote.
            </Text>
          </View>
        </View>
      )}
    </DashboardShell>
  );
}

function QuickLink({
  title,
  desc,
  icon: Icon,
  accentBg,
  accentBorder,
  accentColor,
  badge,
  onPress,
}: {
  title: string;
  desc: string;
  icon: LucideIcon;
  accentBg: string;
  accentBorder: string;
  accentColor: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card/40 p-4 active:opacity-80"
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-lg border ${accentBg} ${accentBorder}`}
      >
        <Icon size={16} color={accentColor} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-shrink text-sm font-semibold text-foreground">
            {title}
          </Text>
          {badge ? (
            <View className="rounded-full bg-sky-500/15 px-2 py-0.5">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-sky-300">
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="text-xs text-muted-foreground">{desc}</Text>
      </View>
      <ArrowRight size={16} color="#A3A3A3" />
    </Pressable>
  );
}
