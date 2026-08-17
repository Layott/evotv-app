import * as React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import {
  BadgeCheck,
  CalendarPlus,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "@/components/icons";
import { toast } from "sonner-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  adminCancelSubscription,
  adminExtendSubscription,
  getFreeToPremiumConversion,
  getOverviewMetrics,
  getRevenueByMonth,
  listAdminSubscriptions,
  type AdminSubscriptionRow,
} from "@/lib/api/admin";
import type { SubscriptionStatus } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatNgn, formatDateTime } from "./utils";

const SUB_STATUSES: (SubscriptionStatus | "all")[] = [
  "all",
  "active",
  "past_due",
  "canceled",
  "paused",
];

function subTone(s: SubscriptionStatus): "emerald" | "amber" | "red" | "neutral" {
  if (s === "active") return "emerald";
  if (s === "past_due") return "amber";
  if (s === "canceled") return "red";
  return "neutral";
}

export function AdminBillingPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] =
    React.useState<SubscriptionStatus | "all">("all");

  const overviewQ = useQuery({
    queryKey: ["admin", "billing-overview"],
    queryFn: getOverviewMetrics,
    staleTime: 30_000,
  });
  const conversionQ = useQuery({
    queryKey: ["admin", "billing-conversion"],
    queryFn: getFreeToPremiumConversion,
    staleTime: 60_000,
  });
  const revenueQ = useQuery({
    queryKey: ["admin", "billing-revenue"],
    queryFn: () => getRevenueByMonth(6),
    staleTime: 60_000,
  });
  const subsQ = useQuery({
    queryKey: ["admin", "subscriptions", statusFilter],
    queryFn: () =>
      listAdminSubscriptions({
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 200,
      }),
    staleTime: 30_000,
  });

  function invalidateBilling() {
    queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "billing-overview"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "billing-conversion"] });
  }

  const cancelMut = useMutation({
    mutationFn: (id: string) => adminCancelSubscription(id),
    onSuccess: () => {
      toast.success("Subscription canceled");
      invalidateBilling();
    },
    onError: (err) =>
      toast.error("Couldn't cancel", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });
  const extendMut = useMutation({
    mutationFn: (id: string) => adminExtendSubscription(id, 30),
    onSuccess: () => {
      toast.success("Extended 30 days");
      invalidateBilling();
    },
    onError: (err) =>
      toast.error("Couldn't extend", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const subs = subsQ.data?.subscriptions ?? [];
  const revenue = revenueQ.data ?? [];
  const revenueMax = Math.max(1, ...revenue.map((r) => r.ngn));
  const pending = cancelMut.isPending || extendMut.isPending;

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Billing"
          description="Revenue, premium members, and subscription management."
          actions={
            <Button
              variant="outline"
              onPress={() => {
                overviewQ.refetch();
                revenueQ.refetch();
                subsQ.refetch();
                conversionQ.refetch();
              }}
              disabled={subsQ.isFetching}
            >
              {subsQ.isFetching ? (
                <Loader2 size={14} color="#9FBDBD" />
              ) : (
                <RefreshCw size={14} color="#EAF6F5" />
              )}
              <Text className="text-xs text-foreground">Refresh</Text>
            </Button>
          }
        />

        {/* Revenue cards */}
        <View className="mb-4 flex-row flex-wrap gap-2">
          <MetricCard
            label="MRR"
            value={formatNgn(overviewQ.data?.mrrNgn ?? 0)}
            Icon={Wallet}
            loading={overviewQ.isLoading}
          />
          <MetricCard
            label="Active premium"
            value={String(overviewQ.data?.activePremiumSubs ?? 0)}
            Icon={BadgeCheck}
            loading={overviewQ.isLoading}
          />
          <MetricCard
            label="Free → premium"
            value={`${conversionQ.data?.pct ?? 0}%`}
            Icon={TrendingUp}
            loading={conversionQ.isLoading}
          />
        </View>

        {/* Revenue by month */}
        <View className="mb-4 rounded-2xl border border-border bg-card/40 p-4">
          <Text className="text-base font-semibold text-foreground">
            Revenue (last 6 months)
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            Subscriptions + paid orders, NGN.
          </Text>
          {revenueQ.isLoading ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#46E3CE" />
            </View>
          ) : (
            <View className="mt-3 gap-2">
              {revenue.map((r) => (
                <View key={r.month} className="flex-row items-center gap-2">
                  <Text className="w-16 text-xs text-muted-foreground">
                    {r.month}
                  </Text>
                  <View className="h-2.5 flex-1 overflow-hidden rounded-full bg-card">
                    <View
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${(r.ngn / revenueMax) * 100}%` }}
                    />
                  </View>
                  <Text
                    className="w-20 text-right text-xs text-foreground"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatNgn(r.ngn)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Subscriptions */}
        <View className="rounded-2xl border border-border bg-card/40 p-4">
          <Text className="text-base font-semibold text-foreground">
            Subscriptions
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            Manage premium access. Cancel or extend a member's period.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
          >
            <View className="flex-row gap-1.5">
              {SUB_STATUSES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setStatusFilter(s)}
                  className={`rounded-full border px-3 py-1 ${
                    statusFilter === s
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-border bg-card"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      statusFilter === s
                        ? "text-cyan-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View className="mt-3">
            {subsQ.isLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#46E3CE" />
              </View>
            ) : subsQ.isError ? (
              <Text className="py-6 text-center text-sm text-red-400">
                Failed to load subscriptions.
              </Text>
            ) : subs.length === 0 ? (
              <View className="rounded-xl bg-card/50 p-6">
                <Text className="text-center text-sm text-muted-foreground">
                  No subscriptions match this filter.
                </Text>
              </View>
            ) : (
              <>
                <Text className="mb-2 text-xs text-muted-foreground">
                  {subs.length} of {subsQ.data?.total ?? subs.length}
                </Text>
                {subs.map((row) => (
                  <SubscriptionRow
                    key={row.id}
                    row={row}
                    pending={pending}
                    onCancel={() => cancelMut.mutate(row.id)}
                    onExtend={() => extendMut.mutate(row.id)}
                  />
                ))}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SubscriptionRow({
  row,
  pending,
  onCancel,
  onExtend,
}: {
  row: AdminSubscriptionRow;
  pending: boolean;
  onCancel: () => void;
  onExtend: () => void;
}) {
  return (
    <View className="mb-2 rounded-xl border border-border bg-card/60 p-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-sm text-foreground" numberOfLines={1}>
            {row.userHandle ? `@${row.userHandle}` : row.userName || row.userEmail}
          </Text>
          <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
            {row.userEmail}
          </Text>
        </View>
        <StatusBadge tone={subTone(row.status)} dot={row.status === "active"}>
          {row.status}
        </StatusBadge>
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <View>
          <Text className="text-xs capitalize text-foreground">
            {row.tier} · {row.provider}
          </Text>
          <Text className="text-[10px] text-muted-foreground">
            Renews {formatDateTime(row.currentPeriodEnd)}
          </Text>
        </View>
        <Text
          className="text-sm font-semibold text-foreground"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {formatNgn(row.priceNgn)}
        </Text>
      </View>

      <View className="mt-3 flex-row gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={
            pending || (row.status !== "active" && row.status !== "past_due")
          }
          onPress={onExtend}
        >
          <CalendarPlus size={12} color="#EAF6F5" />
          <Text className="text-xs text-foreground">Extend 30d</Text>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={pending || row.status !== "active"}
          onPress={onCancel}
        >
          <XCircle size={12} color="#FCA5A5" />
          <Text className="text-xs text-foreground">Cancel</Text>
        </Button>
      </View>
    </View>
  );
}

function MetricCard({
  label,
  value,
  Icon,
  loading,
}: {
  label: string;
  value: string;
  Icon: import("@/components/icons").Icon;
  loading?: boolean;
}) {
  return (
    <View className="min-w-[30%] flex-1 flex-row items-center gap-3 rounded-2xl border border-border bg-card/40 p-3">
      <View className="h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/25">
        <Icon size={20} color="#67E8F0" />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] text-muted-foreground">
          {label}
        </Text>
        {loading ? (
          <Text className="text-lg font-bold text-muted-foreground">…</Text>
        ) : (
          <Text
            className="text-lg font-bold text-foreground"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {value}
          </Text>
        )}
      </View>
    </View>
  );
}
