import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Banknote, ClockIcon } from "lucide-react-native";

import { listPayouts, type Payout } from "@/lib/api/partner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatNgn(n: number): string {
  return `₦${n.toLocaleString()}`;
}

function statusClass(s: Payout["status"]): string {
  switch (s) {
    case "paid":
      return "bg-emerald-500/15 text-emerald-300";
    case "approved":
      return "bg-blue-500/15 text-blue-300";
    case "failed":
      return "bg-rose-500/15 text-rose-300";
    default:
      return "bg-amber-500/15 text-amber-300";
  }
}

export default function PayoutsScreen() {
  const payoutsQ = useQuery({
    queryKey: ["partner", "payouts"],
    queryFn: () => listPayouts(),
  });

  return (
    <>
      <Stack.Screen options={{ title: "Payouts" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-5 py-6">
          <View className="flex-row items-center gap-2">
            <Banknote size={22} color="#2CD7E3" />
            <Text className="text-2xl font-bold text-foreground">Payouts</Text>
          </View>
          <Text className="mt-1 text-sm text-muted-foreground">
            Weekly rollup. Pending entries await admin approval.
          </Text>

          {payoutsQ.isLoading ? (
            <View className="mt-5 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </View>
          ) : payoutsQ.isError ? (
            <View className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
              <Text className="text-sm text-rose-300">
                {(payoutsQ.error as Error)?.message ?? "Failed to load"}
              </Text>
            </View>
          ) : payoutsQ.data?.length === 0 ? (
            <View className="mt-5 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8">
              <View className="items-center gap-2">
                <ClockIcon size={20} color="#737373" />
                <Text className="text-center text-sm text-muted-foreground">
                  No payouts yet. The first weekly rollup runs Sunday 03:00 UTC.
                </Text>
              </View>
            </View>
          ) : (
            <View className="mt-5 gap-2">
              {payoutsQ.data?.map((p) => (
                <View
                  key={p.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-foreground">
                      {p.periodStart} → {p.periodEnd}
                    </Text>
                    <Text
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusClass(p.status),
                      )}
                    >
                      {p.status}
                    </Text>
                  </View>
                  <View className="mt-3 flex-row items-center justify-between">
                    <View>
                      <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Net payout
                      </Text>
                      <Text className="mt-0.5 text-lg font-bold text-foreground">
                        {formatNgn(p.netNgn)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Gross · Fee
                      </Text>
                      <Text className="mt-0.5 text-xs text-muted-foreground">
                        {formatNgn(p.grossNgn)} · {formatNgn(p.feeNgn)}
                      </Text>
                    </View>
                  </View>
                  {p.paystackTransferRef ? (
                    <Text className="mt-2 text-[10px] text-muted-foreground">
                      Ref {p.paystackTransferRef}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
