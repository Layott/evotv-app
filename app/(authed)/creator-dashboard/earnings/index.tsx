import * as React from "react";
import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Coins, Download, FileSpreadsheet } from "lucide-react-native";
import { toast } from "sonner-native";

import { listPayouts, type Payout } from "@/lib/api/partner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardShell } from "@/components/creators/dashboard-shell";
import { MetricCard } from "@/components/creators/metric-card";

type PayoutStatus = Payout["status"];

const STATUS_BADGE: Record<
  PayoutStatus,
  { className: string; textClassName: string; label: string }
> = {
  paid: {
    className: "border-emerald-500/40 bg-emerald-500/15",
    textClassName: "text-emerald-300",
    label: "Paid",
  },
  approved: {
    className: "border-sky-500/40 bg-sky-500/15",
    textClassName: "text-sky-300",
    label: "Approved",
  },
  pending: {
    className: "border-amber-500/40 bg-amber-500/15",
    textClassName: "text-amber-300",
    label: "Pending",
  },
  failed: {
    className: "border-rose-500/40 bg-rose-500/15",
    textClassName: "text-rose-300",
    label: "Failed",
  },
};

function formatNgn(n: number): string {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

function monthLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export default function CreatorEarningsScreen() {
  const payoutsQ = useQuery({
    queryKey: ["creator-earnings"],
    queryFn: () => listPayouts(),
  });

  const loading = payoutsQ.isLoading || !payoutsQ.data;
  const payouts = payoutsQ.data ?? [];
  const totalNet = payouts.reduce((s, p) => s + p.netNgn, 0);
  const totalGross = payouts.reduce((s, p) => s + p.grossNgn, 0);
  const totalFee = payouts.reduce((s, p) => s + p.feeNgn, 0);
  const lastPaid = payouts.find((p) => p.status === "paid");
  const pending = payouts
    .filter((p) => p.status !== "paid" && p.status !== "failed")
    .reduce((s, p) => s + p.netNgn, 0);

  const chartMax = Math.max(1, ...payouts.map((p) => p.netNgn + p.feeNgn));

  return (
    <DashboardShell
      title="Earnings"
      screenTitle="Earnings"
      description="Monthly payouts, fees, and totals — paid in Naira (NGN)."
      actions={
        <Button
          variant="outline"
          onPress={() =>
            toast("CSV export will be available after launch.")
          }
        >
          <Download size={14} color="#FAFAFA" />
          <Text className="text-sm font-medium text-foreground">Export CSV</Text>
        </Button>
      }
    >
      {loading ? (
        <View className="gap-4">
          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </View>
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </View>
      ) : (
        <View className="gap-6">
          <View className="gap-3">
            <MetricCard
              label="Lifetime net"
              value={formatNgn(totalNet)}
              hint="NGN delivered"
              icon={Coins}
              accent="emerald"
            />
            <MetricCard
              label="Lifetime gross"
              value={formatNgn(totalGross)}
              hint="before platform fee"
              icon={Coins}
              accent="amber"
            />
            <MetricCard
              label="Pending"
              value={formatNgn(pending)}
              hint="approved or pending payout"
              icon={FileSpreadsheet}
              accent="sky"
            />
            <MetricCard
              label="Last payout"
              value={lastPaid ? monthLabel(lastPaid.paidAt ?? lastPaid.periodEnd) : "—"}
              hint={
                lastPaid
                  ? formatNgn(lastPaid.netNgn)
                  : "No payouts yet"
              }
              icon={Coins}
              accent="fuchsia"
            />
          </View>

          {/* Bar chart placeholder — RN-friendly */}
          <View className="rounded-2xl border border-border bg-card/40 p-5">
            <Text className="text-sm font-semibold text-foreground">
              Net vs platform fee · 12 months
            </Text>
            <Text className="mt-0.5 text-[11px] text-muted-foreground">
              Total platform fee paid: {formatNgn(totalFee)}
            </Text>
            <View className="mt-4 h-48 flex-row items-end gap-1.5">
              {payouts.map((p) => {
                const total = p.netNgn + p.feeNgn;
                const totalH = (total / chartMax) * 100;
                const netH = (p.netNgn / chartMax) * 100;
                return (
                  <View key={p.id} className="flex-1 items-center gap-1">
                    <View
                      className="w-full justify-end overflow-hidden rounded"
                      style={{ height: `${Math.max(8, totalH)}%` }}
                    >
                      <View
                        className="w-full bg-neutral-700"
                        style={{ height: `${100 - (netH / Math.max(0.1, totalH)) * 100}%` }}
                      />
                      <View
                        className="w-full bg-emerald-500"
                        style={{ height: `${(netH / Math.max(0.1, totalH)) * 100}%` }}
                      />
                    </View>
                    <Text className="text-[9px] text-muted-foreground">
                      {monthLabel(p.periodStart).split(" ")[0]}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View className="mt-3 flex-row items-center gap-4">
              <View className="flex-row items-center gap-1.5">
                <View className="h-2 w-2 rounded-sm bg-emerald-500" />
                <Text className="text-[11px] text-muted-foreground">Net</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="h-2 w-2 rounded-sm bg-neutral-700" />
                <Text className="text-[11px] text-muted-foreground">Fee</Text>
              </View>
            </View>
          </View>

          <View className="overflow-hidden rounded-2xl border border-border bg-card/40">
            <View className="border-b border-border px-4 py-3">
              <Text className="text-sm font-semibold text-foreground">
                Payout history
              </Text>
            </View>
            <View>
              {payouts.length === 0 ? (
                <View className="p-6">
                  <Text className="text-center text-sm text-muted-foreground">
                    No payouts yet. Earnings appear here after your first payout cycle clears.
                  </Text>
                </View>
              ) : (
                payouts
                  .slice()
                  .reverse()
                  .map((p, idx, arr) => {
                    const status = STATUS_BADGE[p.status];
                    return (
                      <View
                        key={p.id}
                        className={
                          "p-4 " +
                          (idx === arr.length - 1 ? "" : "border-b border-border")
                        }
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-semibold text-foreground">
                            {monthLabel(p.periodStart)}
                          </Text>
                          <Badge
                            variant="outline"
                            className={status.className}
                            textClassName={status.textClassName}
                          >
                            {status.label}
                          </Badge>
                        </View>
                        <View className="mt-2 flex-row items-center justify-between">
                          <Text className="text-xs text-muted-foreground">Gross</Text>
                          <Text className="text-xs text-foreground">
                            {formatNgn(p.grossNgn)}
                          </Text>
                        </View>
                        <View className="mt-1 flex-row items-center justify-between">
                          <Text className="text-xs text-muted-foreground">Fee</Text>
                          <Text className="text-xs text-muted-foreground">
                            -{formatNgn(p.feeNgn)}
                          </Text>
                        </View>
                        <View className="mt-1 flex-row items-center justify-between">
                          <Text className="text-sm text-foreground">Net</Text>
                          <Text className="text-sm font-bold text-emerald-300">
                            {formatNgn(p.netNgn)}
                          </Text>
                        </View>
                        {p.paystackTransferRef ? (
                          <Text className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                            ref · {p.paystackTransferRef}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })
              )}
            </View>
          </View>
        </View>
      )}
    </DashboardShell>
  );
}
