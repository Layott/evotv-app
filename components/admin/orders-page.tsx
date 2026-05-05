import * as React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Search, X } from "lucide-react-native";
import { toast } from "sonner-native";

import { orders as ordersSource } from "@/lib/mock/orders";
import { profiles } from "@/lib/mock/users";
import type { Order, OrderStatus } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatDateTime, formatNgn, seededRandom } from "./utils";

function handleForUser(id: string): string {
  return profiles.find((p) => p.id === id)?.handle ?? id;
}

function orderTone(
  status: OrderStatus,
): "emerald" | "amber" | "red" | "blue" | "neutral" {
  if (status === "paid" || status === "pending") return "amber";
  if (status === "processing") return "blue";
  if (status === "shipped" || status === "delivered") return "emerald";
  if (status === "cancelled" || status === "refunded") return "red";
  return "neutral";
}

function buildExtraOrders(): Order[] {
  const rng = seededRandom(23);
  const statuses: OrderStatus[] = [
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ];
  const items = [
    {
      id: "prod_alpha_jersey",
      name: "Team Alpha Jersey 2026",
      price: 38_000,
      thumb: "/team-alpha-jersey.jpg",
    },
    {
      id: "prod_evo_hoodie",
      name: "EVO TV Hoodie",
      price: 28_500,
      thumb: "/evo-hoodie.jpg",
    },
    {
      id: "prod_champs_cap",
      name: "Championship Snapback",
      price: 12_000,
      thumb: "/championship-cap.jpg",
    },
  ];
  const people = profiles.slice(0, 12);
  return Array.from({ length: 14 }, (_, i) => {
    const item = items[Math.floor(rng() * items.length)]!;
    const qty = 1 + Math.floor(rng() * 2);
    const subtotal = item.price * qty;
    const shipping = 2_500;
    const status = statuses[Math.floor(rng() * statuses.length)]!;
    const buyer = people[i % people.length]!;
    return {
      id: `order_mock_${i + 1}`,
      userId: buyer.id,
      status,
      items: [
        {
          productId: item.id,
          productName: item.name,
          variantId: "m",
          variantLabel: "M",
          qty,
          unitPriceNgn: item.price,
          thumbnailUrl: item.thumb,
        },
      ],
      subtotalNgn: subtotal,
      shippingNgn: shipping,
      totalNgn: subtotal + shipping,
      shipping: {
        fullName: buyer.displayName,
        phone: "+234 800 000 0000",
        address1: "12 Example Way",
        address2: "",
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
      },
      paymentProvider: "paystack",
      paymentRef: `PS_MOCK_${(i + 100).toString().padStart(4, "0")}`,
      createdAt: new Date(
        Date.now() - Math.floor(rng() * 40) * 86_400_000,
      ).toISOString(),
      trackingNumber:
        status === "shipped" || status === "delivered"
          ? `NIPOST-${Math.floor(rng() * 99999)}`
          : null,
    } satisfies Order;
  });
}

const STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export function OrdersPage() {
  const [all, setAll] = React.useState<Order[]>(() => [
    ...ordersSource,
    ...buildExtraOrders(),
  ]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<Order | null>(null);
  const [refundConfirm, setRefundConfirm] = React.useState<Order | null>(null);

  const filtered = React.useMemo(() => {
    let rows = all;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((o) =>
        [o.id, handleForUser(o.userId), o.paymentRef].some((v) =>
          v.toLowerCase().includes(q),
        ),
      );
    }
    if (statusFilter !== "all")
      rows = rows.filter((o) => o.status === statusFilter);
    return rows;
  }, [all, search, statusFilter]);

  function handleRefund() {
    if (!refundConfirm) return;
    setAll((prev) =>
      prev.map((o) =>
        o.id === refundConfirm.id
          ? { ...o, status: "refunded" as OrderStatus }
          : o,
      ),
    );
    setSelected((prev) =>
      prev && prev.id === refundConfirm.id
        ? { ...prev, status: "refunded" }
        : prev,
    );
    toast.success(`Refunded ${refundConfirm.id}`);
    setRefundConfirm(null);
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Orders"
          description="Customer orders, payments and refunds."
        />

        <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
          <Search size={14} color="#A3A3A3" />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search order, customer, ref"
            className="h-9 flex-1 border-0 bg-transparent px-0"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row gap-1.5">
            <Pressable
              onPress={() => setStatusFilter("all")}
              className={`rounded-full border px-3 py-1 ${
                statusFilter === "all"
                  ? "border-cyan-500 bg-cyan-500/10"
                  : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-xs ${
                  statusFilter === "all"
                    ? "text-cyan-300"
                    : "text-muted-foreground"
                }`}
              >
                All
              </Text>
            </Pressable>
            {STATUSES.map((s) => (
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

        <Text className="mb-2 text-xs text-muted-foreground">
          {filtered.length} orders
        </Text>

        {filtered.map((row) => (
          <Pressable
            key={row.id}
            onPress={() => setSelected(row)}
            className="mb-2 rounded-xl border border-border bg-card/40 p-3"
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-mono text-xs text-foreground">
                {row.id}
              </Text>
              <StatusBadge tone={orderTone(row.status)}>
                {row.status}
              </StatusBadge>
            </View>
            <Text className="text-[10px] text-muted-foreground">
              {row.paymentRef}
            </Text>
            <View className="mt-2 flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-foreground">
                  @{handleForUser(row.userId)}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {row.items.reduce((acc, i) => acc + i.qty, 0)} item(s) ·{" "}
                  {formatDateTime(row.createdAt)}
                </Text>
              </View>
              <Text
                className="text-sm font-semibold text-foreground"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatNgn(row.totalNgn)}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable
          onPress={() => setSelected(null)}
          className="flex-1 justify-end bg-black/50"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="max-h-[90%] rounded-t-2xl border border-border bg-background"
          >
            {selected ? (
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View className="mb-4 flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-mono text-base text-foreground">
                      {selected.id}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(selected.createdAt)} · @
                      {handleForUser(selected.userId)}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                    <X size={20} color="#A3A3A3" />
                  </Pressable>
                </View>

                <View className="mb-3 flex-row items-center justify-between">
                  <StatusBadge tone={orderTone(selected.status)}>
                    {selected.status}
                  </StatusBadge>
                  <Text className="font-mono text-xs text-muted-foreground">
                    {selected.paymentRef}
                  </Text>
                </View>

                <Text className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Items
                </Text>
                <View className="mb-3">
                  {selected.items.map((item, idx) => (
                    <View
                      key={`${item.productId}-${idx}`}
                      className="mb-2 flex-row items-center gap-3 rounded-lg border border-border bg-card/40 p-2"
                    >
                      <View className="h-10 w-10 overflow-hidden rounded bg-muted">
                        <Image
                          source={item.thumbnailUrl}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm text-foreground">
                          {item.productName}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {item.variantLabel
                            ? `Size ${item.variantLabel} · `
                            : ""}
                          Qty {item.qty}
                        </Text>
                      </View>
                      <Text
                        className="text-sm text-foreground"
                        style={{ fontVariant: ["tabular-nums"] }}
                      >
                        {formatNgn(item.unitPriceNgn * item.qty)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="mb-3 rounded-lg border border-border bg-card/40 p-3">
                  <SummaryRow
                    label="Subtotal"
                    value={formatNgn(selected.subtotalNgn)}
                  />
                  <SummaryRow
                    label="Shipping"
                    value={formatNgn(selected.shippingNgn)}
                  />
                  <View className="my-1 border-t border-border" />
                  <SummaryRow
                    label="Total"
                    value={formatNgn(selected.totalNgn)}
                    strong
                  />
                </View>

                <Text className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Ship to
                </Text>
                <View className="mb-3 rounded-lg border border-border bg-card/40 p-3">
                  <Text className="text-sm text-foreground">
                    {selected.shipping.fullName}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {selected.shipping.address1}
                    {selected.shipping.address2
                      ? `, ${selected.shipping.address2}`
                      : ""}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {selected.shipping.city}, {selected.shipping.state},{" "}
                    {selected.shipping.country}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {selected.shipping.phone}
                  </Text>
                  {selected.trackingNumber ? (
                    <Text className="mt-2 text-xs text-cyan-300">
                      Tracking: {selected.trackingNumber}
                    </Text>
                  ) : null}
                </View>

                <Button
                  variant="destructive"
                  disabled={selected.status === "refunded"}
                  onPress={() => setRefundConfirm(selected)}
                >
                  <Text className="text-sm text-white">Issue refund</Text>
                </Button>
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Dialog
        open={!!refundConfirm}
        onOpenChange={(o) => !o && setRefundConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue refund?</DialogTitle>
            <DialogDescription>
              This will mark order {refundConfirm?.id} as refunded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onPress={() => setRefundConfirm(null)}>
              <Text className="text-sm text-foreground">Cancel</Text>
            </Button>
            <Button variant="destructive" onPress={handleRefund}>
              <Text className="text-sm text-white">Confirm refund</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-0.5">
      <Text
        className={`text-sm ${strong ? "font-semibold text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </Text>
      <Text
        className={`text-sm ${strong ? "font-semibold text-foreground" : "text-foreground"}`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
    </View>
  );
}
