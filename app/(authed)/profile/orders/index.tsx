import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { ChevronRight, Package } from "lucide-react-native";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useMockAuth } from "@/components/providers";
import { listOrdersForUser } from "@/lib/mock";
import { readLocalOrders } from "@/components/shop/cart-store";
import { formatNgn, relativeTime } from "@/components/profile/ngn";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; border: string; text: string }
> = {
  pending: {
    bg: "rgba(38,38,38,1)",
    border: "rgba(64,64,64,1)",
    text: "#A3A3A3",
  },
  paid: {
    bg: "rgba(56,189,248,0.15)",
    border: "rgba(56,189,248,0.4)",
    text: "#7dd3fc",
  },
  processing: {
    bg: "rgba(56,189,248,0.15)",
    border: "rgba(56,189,248,0.4)",
    text: "#7dd3fc",
  },
  shipped: {
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.4)",
    text: "#fcd34d",
  },
  delivered: {
    bg: "rgba(56,189,248,0.15)",
    border: "rgba(56,189,248,0.4)",
    text: "#7dd3fc",
  },
  cancelled: {
    bg: "rgba(239,68,68,0.15)",
    border: "rgba(239,68,68,0.4)",
    text: "#fca5a5",
  },
  refunded: {
    bg: "rgba(38,38,38,1)",
    border: "rgba(64,64,64,1)",
    text: "#A3A3A3",
  },
};

export default function ProfileOrdersScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const remote = await listOrdersForUser(user.id);
      const local = (readLocalOrders() as Order[]).filter(
        (o) => o.userId === user.id || !o.userId,
      );
      const map = new Map<string, Order>();
      for (const o of [...local, ...remote]) map.set(o.id, o);
      const combined = Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      if (cancelled) return;
      setOrders(combined);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Orders" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Orders" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-12"
      >
        <View className="px-4 pt-5 pb-3">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <View>
              <Text className="text-2xl font-bold text-foreground">
                Your orders
              </Text>
              <Text className="text-sm text-muted-foreground">
                {orders.length} total
              </Text>
            </View>
            <Button
              variant="outline"
              size="sm"
              onPress={() => router.push("/(public)/shop")}
            >
              <Text className="text-sm font-medium text-foreground">
                Keep shopping
              </Text>
            </Button>
          </View>
        </View>

        {orders.length === 0 ? (
          <View className="mx-4 items-center rounded-2xl border border-dashed border-border bg-card p-10">
            <Package size={36} color="#525252" />
            <Text className="mt-3 text-base font-semibold text-foreground">
              No orders yet.
            </Text>
            <Button
              onPress={() => router.push("/(public)/shop")}
              className="mt-4 bg-brand"
              textClassName="text-black"
            >
              Browse shop
            </Button>
          </View>
        ) : (
          <View className="px-4">
            <View className="overflow-hidden rounded-2xl border border-border bg-card">
              {orders.map((o, idx) => {
                const count = o.items.reduce((sum, it) => sum + it.qty, 0);
                const c = STATUS_COLORS[o.status];
                return (
                  <Pressable
                    key={o.id}
                    onPress={() =>
                      router.push(`/(authed)/profile/orders/${o.id}`)
                    }
                    className={`flex-row items-center gap-3 p-4 active:bg-muted/40 ${
                      idx > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <View
                      className="h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }}
                    >
                      <Package size={16} color={c.text} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="font-mono text-xs text-foreground"
                          numberOfLines={1}
                        >
                          #{o.id.slice(-8).toUpperCase()}
                        </Text>
                        <Badge
                          className="border"
                          style={{
                            borderColor: c.border,
                            backgroundColor: c.bg,
                          }}
                        >
                          <Text
                            className="text-[10px] font-semibold"
                            style={{ color: c.text }}
                          >
                            {STATUS_LABEL[o.status]}
                          </Text>
                        </Badge>
                      </View>
                      <Text
                        className="mt-0.5 text-xs text-muted-foreground"
                        numberOfLines={1}
                      >
                        {count} {count === 1 ? "item" : "items"} ·{" "}
                        {relativeTime(o.createdAt)}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-foreground">
                      {formatNgn(o.totalNgn)}
                    </Text>
                    <ChevronRight size={16} color="#737373" />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}
