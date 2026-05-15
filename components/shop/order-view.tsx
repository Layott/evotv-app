import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Check,
  Package,
  Printer,
  ShoppingBag,
  Truck,
} from "lucide-react-native";
import { toast } from "sonner-native";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { readLocalOrders } from "@/components/shop/cart-store";
import { getOrderById } from "@/lib/api/orders";
import { formatNgn } from "@/components/profile/ngn";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; border: string; text: string }> = {
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

function readLocalOrder(id: string): Order | null {
  const arr = readLocalOrders() as Order[];
  return arr.find((o) => o.id === id) ?? null;
}

interface StatusBadgeProps {
  status: OrderStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const c = STATUS_COLORS[status];
  return (
    <Badge
      className="border"
      style={{ borderColor: c.border, backgroundColor: c.bg }}
    >
      <Text className="text-xs font-semibold" style={{ color: c.text }}>
        {STATUS_LABEL[status]}
      </Text>
    </Badge>
  );
}

interface OrderViewProps {
  id: string;
}

export function OrderView({ id }: OrderViewProps) {
  const router = useRouter();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [missing, setMissing] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const local = readLocalOrder(id);
      if (local) {
        if (!cancelled) {
          setOrder(local);
          setLoading(false);
        }
        return;
      }
      const remote = await getOrderById(id);
      if (cancelled) return;
      if (!remote) setMissing(true);
      else setOrder(remote);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="large" />
      </View>
    );
  }

  if (missing || !order) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-4">
        <Package size={36} color="#525252" />
        <Text className="mt-3 text-base font-semibold text-foreground">
          Order not found
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          The order you're looking for doesn't exist or was removed.
        </Text>
        <Button
          onPress={() => router.replace("/(authed)/profile/orders")}
          className="mt-5 bg-brand"
          textClassName="text-black"
        >
          Back to orders
        </Button>
      </View>
    );
  }

  const base = new Date(order.createdAt).getTime();
  const steps: {
    key: OrderStatus;
    label: string;
    icon: import("lucide-react-native").LucideIcon;
    at: string;
  }[] = [
    {
      key: "paid",
      label: "Paid",
      icon: Check,
      at: new Date(base).toLocaleString(),
    },
    {
      key: "processing",
      label: "Processing",
      icon: Package,
      at: new Date(base + 3600_000).toLocaleString(),
    },
    {
      key: "shipped",
      label: "Shipped",
      icon: Truck,
      at: new Date(base + 86_400_000).toLocaleString(),
    },
    {
      key: "delivered",
      label: "Delivered",
      icon: Check,
      at: new Date(base + 3 * 86_400_000).toLocaleString(),
    },
  ];
  const orderIndex = steps.findIndex((s) => s.key === order.status);
  const activeIdx = orderIndex >= 0 ? orderIndex : 0;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-12"
    >
      {/* Header card */}
      <View className="px-4 pt-5">
        <View className="rounded-2xl border border-border bg-card p-5">
          <View className="flex-row flex-wrap items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Order
              </Text>
              <Text className="font-mono text-lg font-bold text-foreground">
                #{order.id.slice(-8).toUpperCase()}
              </Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                Placed {new Date(order.createdAt).toLocaleString()}
              </Text>
            </View>
            <StatusBadge status={order.status} />
          </View>

          {/* Status timeline */}
          <View className="mt-6 gap-3">
            {steps.map((s, i) => {
              const active = i <= activeIdx;
              const Icon = s.icon;
              return (
                <View
                  key={s.key}
                  className={cn(
                    "rounded-xl border p-3",
                    active
                      ? "bg-brand/5"
                      : "border-border bg-background",
                  )}
                  style={
                    active
                      ? {
                          borderColor: "rgba(44,215,227,0.4)",
                        }
                      : undefined
                  }
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: active ? "#2CD7E3" : "#262626",
                      }}
                    >
                      <Icon size={14} color={active ? "#0A0A0A" : "#737373"} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {s.label}
                      </Text>
                      <Text className="text-[11px] text-muted-foreground">
                        {active ? s.at : "Pending"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Items */}
      <View className="mt-4 px-4">
        <View className="rounded-2xl border border-border bg-card p-5">
          <Text className="text-base font-semibold text-foreground">Items</Text>
          <View className="mt-3">
            {order.items.map((item, i) => (
              <View
                key={`${item.productId}-${i}`}
                className={`flex-row items-center gap-3 py-3 ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <View className="h-16 w-16 overflow-hidden rounded-lg bg-muted">
                  <Image
                    source={item.thumbnailUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-sm font-semibold text-foreground"
                    numberOfLines={1}
                  >
                    {item.productName}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {item.variantLabel ? `${item.variantLabel} · ` : ""}Qty{" "}
                    {item.qty}
                  </Text>
                </View>
                <Text className="text-sm font-semibold text-foreground">
                  {formatNgn(item.unitPriceNgn * item.qty)}
                </Text>
              </View>
            ))}
          </View>

          <View className="mt-4 gap-2 border-t border-border pt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">Subtotal</Text>
              <Text className="text-sm text-foreground">
                {formatNgn(order.subtotalNgn)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">Shipping</Text>
              <Text className="text-sm text-foreground">
                {order.shippingNgn === 0
                  ? "Free"
                  : formatNgn(order.shippingNgn)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between border-t border-border pt-2">
              <Text className="text-base font-bold text-foreground">Total</Text>
              <Text className="text-base font-bold text-foreground">
                {formatNgn(order.totalNgn)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Shipping */}
      <View className="mt-4 px-4">
        <View className="rounded-2xl border border-border bg-card p-5">
          <Text className="mb-3 text-base font-semibold text-foreground">
            Shipping to
          </Text>
          {order.shipping.address1 ? (
            <View className="gap-1">
              <Text className="text-sm font-semibold text-foreground">
                {order.shipping.fullName}
              </Text>
              <Text className="text-sm text-foreground">
                {order.shipping.address1}
              </Text>
              {order.shipping.address2 ? (
                <Text className="text-sm text-foreground">
                  {order.shipping.address2}
                </Text>
              ) : null}
              <Text className="text-sm text-foreground">
                {order.shipping.city}, {order.shipping.state}
              </Text>
              <Text className="text-sm text-foreground">
                {order.shipping.country}
              </Text>
              {order.shipping.phone ? (
                <Text className="mt-2 text-xs text-muted-foreground">
                  {order.shipping.phone}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">
              Digital order — no shipping.
            </Text>
          )}
        </View>
      </View>

      {/* Payment */}
      <View className="mt-4 px-4">
        <View className="rounded-2xl border border-border bg-card p-5">
          <Text className="mb-3 text-base font-semibold text-foreground">
            Payment
          </Text>
          <Text className="text-sm text-foreground">
            <Text style={{ color: "#00C3F7" }}>Paystack</Text> ·{" "}
            {order.paymentRef}
          </Text>
        </View>
      </View>

      {/* Tracking */}
      <View className="mt-4 px-4">
        <View className="rounded-2xl border border-border bg-card p-5">
          <Text className="mb-3 text-base font-semibold text-foreground">
            Tracking
          </Text>
          <Text className="font-mono text-sm text-foreground">
            {order.trackingNumber ?? "Available once shipped"}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="mt-4 flex-row gap-2 px-4">
        <Button
          variant="outline"
          onPress={() => toast("Receipt download is desktop-only")}
          className="flex-1"
        >
          <Printer size={14} color="#FAFAFA" />
          <Text className="text-sm font-medium text-foreground">Receipt</Text>
        </Button>
        <Pressable
          onPress={() => router.push("/(public)/shop")}
          className="flex-1 h-9 flex-row items-center justify-center gap-2 rounded-md bg-brand px-4 active:opacity-80"
        >
          <ShoppingBag size={14} color="#0A0A0A" />
          <Text className="text-sm font-medium text-black">Continue</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default OrderView;
