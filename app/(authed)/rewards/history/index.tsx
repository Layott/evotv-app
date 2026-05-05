import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { History as HistoryIcon, Loader2, Package } from "lucide-react-native";

import {
  listMyRedemptions,
  type Redemption,
} from "@/lib/mock/rewards";
import { useMockAuth } from "@/components/providers";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_BADGE: Record<
  Redemption["status"],
  { className: string; label: string; textClassName: string }
> = {
  pending: {
    className: "border-amber-500/40 bg-amber-500/10",
    label: "Pending",
    textClassName: "text-amber-200",
  },
  delivered: {
    className: "border-emerald-500/40 bg-emerald-500/10",
    label: "Delivered",
    textClassName: "text-emerald-300",
  },
  expired: {
    className: "border-neutral-700 bg-neutral-900",
    label: "Expired",
    textClassName: "text-neutral-400",
  },
};

const KIND_LABEL: Record<Redemption["dropKind"], string> = {
  cosmetic: "In-game",
  "premium-trial": "Premium",
  "merch-voucher": "Voucher",
};

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function RedemptionCard({ r }: { r: Redemption }) {
  const status = STATUS_BADGE[r.status];
  return (
    <View className="flex-row gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 6,
          overflow: "hidden",
          backgroundColor: "#171717",
        }}
      >
        <Image
          source={r.imageUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className="flex-1 text-sm font-semibold text-neutral-100"
            numberOfLines={1}
          >
            {r.dropName}
          </Text>
          <Badge variant="outline" className={status.className}>
            <Text className={`text-[10px] font-bold ${status.textClassName}`}>
              {status.label}
            </Text>
          </Badge>
        </View>
        <Text className="text-[11px] text-neutral-500">
          {KIND_LABEL[r.dropKind]} · {r.partner}
        </Text>
        <View className="flex-row items-center gap-3">
          <Text className="text-[11px] text-neutral-500">
            {relTime(r.redeemedAt)}
          </Text>
          <Text className="text-[11px] font-bold text-amber-300">
            {r.cost.toLocaleString()} coins
          </Text>
        </View>
        <View className="mt-1 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5">
          <Text className="font-mono text-xs text-amber-200" numberOfLines={1}>
            {r.code}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function RewardsHistoryScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const [items, setItems] = React.useState<Redemption[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await listMyRedemptions(user.id);
      if (cancelled) return;
      setItems(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  function renderRows(list: Redemption[]) {
    if (list.length === 0) {
      return (
        <View className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10">
          <View className="items-center">
            <Package size={36} color="#525252" />
          </View>
          <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
            No redemptions yet.
          </Text>
          <Text className="mt-1 text-center text-xs text-neutral-500">
            Spend EVO Coins in the drops store to see them here.
          </Text>
          <Button
            className="mt-4 bg-amber-500"
            onPress={() => router.push("/rewards/store")}
            textClassName="text-amber-950"
          >
            Open store
          </Button>
        </View>
      );
    }
    return (
      <View className="gap-2">
        {list.map((r) => (
          <RedemptionCard key={r.id} r={r} />
        ))}
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Loader2 size={24} color="#525252" />
      </View>
    );
  }

  const pending = items.filter((i) => i.status === "pending");
  const delivered = items.filter((i) => i.status === "delivered");
  const totalSpent = items.reduce((sum, r) => sum + r.cost, 0);

  return (
    <>
      <Stack.Screen options={{ title: "Redemption History" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-end justify-between gap-3">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <HistoryIcon size={22} color="#7DD3FC" />
                <Text className="text-2xl font-bold text-neutral-50">
                  Redemption history
                </Text>
              </View>
              <Text className="mt-1 text-sm text-neutral-400">
                All your past drops, codes and statuses.
              </Text>
            </View>
            <View className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2">
              <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                Total spent
              </Text>
              <Text className="text-base font-bold text-amber-300">
                {totalSpent.toLocaleString()}
              </Text>
            </View>
          </View>

          {loading ? (
            <View className="mt-5 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </View>
          ) : (
            <Tabs defaultValue="all" className="mt-5">
              <TabsList>
                <TabsTrigger value="all">
                  <Text className="text-sm font-medium text-neutral-300">
                    All ({items.length})
                  </Text>
                </TabsTrigger>
                <TabsTrigger value="pending">
                  <Text className="text-sm font-medium text-neutral-300">
                    Pending ({pending.length})
                  </Text>
                </TabsTrigger>
                <TabsTrigger value="delivered">
                  <Text className="text-sm font-medium text-neutral-300">
                    Delivered ({delivered.length})
                  </Text>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all">{renderRows(items)}</TabsContent>
              <TabsContent value="pending">{renderRows(pending)}</TabsContent>
              <TabsContent value="delivered">
                {renderRows(delivered)}
              </TabsContent>
            </Tabs>
          )}
        </View>
      </ScrollView>
    </>
  );
}
