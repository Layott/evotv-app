import * as React from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { CalendarPlus, Search, X, XCircle } from "@/components/icons";
import {
  adminCancelSubscription,
  adminExtendSubscription,
  listAdminSubscriptions,
  type AdminSubscriptionRow,
} from "@/lib/api/admin";
import { useAuth } from "@/components/providers";
import { hasMinRole } from "@/lib/auth/roles";
import type { SubscriptionStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useTokens } from "@/lib/theme/tokens";

import { ListState } from "./list-state";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatDate, formatNgn } from "./utils";

/**
 * Who is past the paywall, and until when.
 *
 * `/api/admin/subscriptions` has served this join since the paywall was built
 * and the app rendered none of it, so the only way to answer "is this person
 * actually premium" from a phone was to ask somebody with a psql session.
 *
 * Nothing here moves money. A refund is a Paystack action; this manages the
 * access period, which is the part the product owns.
 */

const STATUSES: SubscriptionStatus[] = [
  "active",
  "past_due",
  "paused",
  "canceled",
];

function statusTone(status: SubscriptionStatus) {
  if (status === "active") return "emerald" as const;
  if (status === "past_due") return "amber" as const;
  if (status === "paused") return "blue" as const;
  return "neutral" as const;
}

export function SubscriptionsPage() {
  const t = useTokens();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  // Finance can read the book. Changing an access period is an admin verb on
  // the API, which is what the buttons obey.
  const canEdit = hasMinRole(role, "admin");

  const [status, setStatus] = React.useState<SubscriptionStatus | "all">("all");
  const [search, setSearch] = React.useState("");
  const [extending, setExtending] =
    React.useState<AdminSubscriptionRow | null>(null);
  const [extendDays, setExtendDays] = React.useState("30");

  const subsQ = useQuery({
    queryKey: ["admin", "subscriptions", { status }],
    queryFn: () =>
      listAdminSubscriptions({
        status: status === "all" ? undefined : status,
        limit: 200,
      }),
    staleTime: 30_000,
  });

  const subscriptions = subsQ.data?.subscriptions ?? [];

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscriptions;
    return subscriptions.filter(
      (s) =>
        s.userEmail.toLowerCase().includes(q) ||
        (s.userHandle ?? "").toLowerCase().includes(q) ||
        (s.userName ?? "").toLowerCase().includes(q),
    );
  }, [subscriptions, search]);

  const refresh = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
    [queryClient],
  );

  const cancel = useMutation({
    mutationFn: (sub: AdminSubscriptionRow) => adminCancelSubscription(sub.id),
    onSuccess: () => {
      toast.success("Subscription cancelled", {
        description: "No refund was issued.",
      });
      refresh();
    },
    onError: (err) =>
      toast.error("Could not cancel it", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const extend = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      adminExtendSubscription(id, days),
    onSuccess: (_res, v) => {
      toast.success(`Extended by ${v.days} days`);
      setExtending(null);
      refresh();
    },
    onError: (err) =>
      toast.error("Could not extend it", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  function confirmCancel(sub: AdminSubscriptionRow) {
    Alert.alert(
      "Cancel this subscription?",
      `${sub.userEmail} loses premium access, and the account drops back to a normal user unless another subscription keeps it. No money moves: refund in Paystack if one is owed.`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Cancel subscription",
          style: "destructive",
          onPress: () => cancel.mutate(sub),
        },
      ],
    );
  }

  const days = Number(extendDays);
  const daysValid = Number.isFinite(days) && days >= 1 && days <= 365;

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <PageHeader
          title="Subscriptions"
          description="Who is past the paywall and until when. Refunds happen in Paystack; this controls access periods."
        />

        <View className="mb-3 flex-row items-center gap-2 rounded-lg bg-card px-3">
          <Search size={14} color={t.muted} />
          <Input
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            placeholder="Search email, name or handle"
            className="h-10 flex-1 bg-transparent px-0"
          />
        </View>

        <View className="mb-3 flex-row flex-wrap items-center gap-2">
          {(["all", ...STATUSES] as (SubscriptionStatus | "all")[]).map((s) => {
            const on = status === s;
            return (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                className={`rounded-lg px-3 py-1.5 active:opacity-70 ${
                  on ? "bg-brand/25" : "bg-card"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    on ? "text-brand" : "text-muted-foreground"
                  }`}
                >
                  {s === "all" ? "Any status" : s.replace("_", " ")}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mb-3 text-xs text-muted-foreground">
          {filtered.length} of {subsQ.data?.total ?? 0}
        </Text>

        <ListState
          isPending={subsQ.isPending}
          isError={subsQ.isError}
          error={subsQ.error}
          isEmpty={filtered.length === 0}
          emptyMessage={
            search.trim() || status !== "all"
              ? "Nothing matches that filter."
              : "Nobody has subscribed yet. Comped access is granted as the Premium role under Users."
          }
          onRetry={() => subsQ.refetch()}
        />

        {filtered.map((sub) => (
          <View key={sub.id} className="mb-2 rounded-xl bg-card p-3">
            <View className="flex-row items-start gap-3">
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-medium text-foreground"
                >
                  {sub.userName || sub.userHandle || sub.userEmail}
                </Text>
                <Text numberOfLines={1} className="text-xs text-muted-foreground">
                  {sub.userEmail}
                </Text>
              </View>
              <StatusBadge tone={statusTone(sub.status)}>
                {sub.status.replace("_", " ")}
              </StatusBadge>
            </View>

            <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
              <Text className="text-xs capitalize text-muted-foreground">
                {sub.tier}
              </Text>
              <Text
                className="text-xs text-muted-foreground"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatNgn(sub.priceNgn)}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {sub.currentPeriodEnd
                  ? `Access until ${formatDate(sub.currentPeriodEnd)}`
                  : "No end date"}
              </Text>
              <Text className="text-xs capitalize text-muted-foreground">
                via {sub.provider}
              </Text>
            </View>

            {canEdit ? (
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setExtendDays("30");
                    setExtending(sub);
                  }}
                  className="flex-row items-center gap-1.5 rounded-lg bg-accent px-3 py-2 active:opacity-70"
                >
                  <CalendarPlus size={14} color={t.brand} />
                  <Text className="text-xs font-semibold text-foreground">
                    Extend
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmCancel(sub)}
                  disabled={sub.status === "canceled"}
                  className={`flex-row items-center gap-1.5 rounded-lg bg-accent px-3 py-2 active:opacity-70 ${
                    sub.status === "canceled" ? "opacity-50" : ""
                  }`}
                >
                  <XCircle size={14} color={t.danger} />
                  <Text className="text-xs font-semibold text-foreground">
                    Cancel
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={extending !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setExtending(null)}
      >
        <Pressable
          onPress={() => setExtending(null)}
          className="flex-1 justify-end bg-black/60"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="rounded-t-2xl bg-background p-5 pb-8"
          >
            <View className="mb-3 flex-row items-start justify-between">
              <Text className="text-lg font-bold text-foreground">
                Extend access
              </Text>
              <Pressable
                onPress={() => setExtending(null)}
                hitSlop={12}
                accessibilityLabel="Close"
              >
                <X size={20} color={t.muted} />
              </Pressable>
            </View>

            {extending ? (
              <Text className="mb-4 text-sm leading-5 text-muted-foreground">
                Pushes {extending.userEmail}
                {"'"}s access period out. Nothing is charged.
              </Text>
            ) : null}

            <Label className="mb-1.5 text-xs text-muted-foreground">Days</Label>
            <Input
              value={extendDays}
              onChangeText={setExtendDays}
              keyboardType="number-pad"
              className="bg-card"
            />
            <Text className="mt-1 text-xs text-muted-foreground">
              Between 1 and 365.
            </Text>

            <View className="mt-5 flex-row gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onPress={() => setExtending(null)}
              >
                <Text className="text-sm font-medium text-foreground">
                  Cancel
                </Text>
              </Button>
              <Button
                disabled={!daysValid || extend.isPending}
                className="flex-1 bg-brand"
                onPress={() =>
                  extending && extend.mutate({ id: extending.id, days })
                }
              >
                <Text className="text-sm font-semibold text-background">
                  {extend.isPending ? "Extending…" : "Extend"}
                </Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
