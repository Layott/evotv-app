import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { ShoppingBag, Trash2 } from "lucide-react-native";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { QtyStepper } from "@/components/shop/qty-stepper";
import {
  CartLine,
  getCart,
  removeLine,
  subscribeCart,
  updateQty,
} from "@/components/shop/cart-store";
import { getProductById } from "@/lib/api/products";
import { formatNgn } from "@/components/profile/ngn";
import type { Product } from "@/lib/types";

interface ResolvedLine extends CartLine {
  product: Product;
  unit: number;
  subtotal: number;
  variantLabel: string | null;
}

const SHIPPING = 2500;
const FREE_SHIPPING_MIN = 50_000;

export default function CartScreen() {
  const router = useRouter();
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [products, setProducts] = React.useState<Record<string, Product>>({});
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(() => {
    setLines(getCart());
  }, []);

  React.useEffect(() => {
    refresh();
    const unsub = subscribeCart(refresh);
    return unsub;
  }, [refresh]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const entries = await Promise.all(
        lines.map(async (l) => {
          const p = await getProductById(l.productId);
          return p ? ([l.productId, p] as const) : null;
        }),
      );
      if (cancelled) return;
      const map: Record<string, Product> = {};
      for (const e of entries) if (e) map[e[0]] = e[1];
      setProducts(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [lines]);

  const resolved: ResolvedLine[] = lines
    .map((l) => {
      const p = products[l.productId];
      if (!p) return null;
      const variant = l.variantId
        ? p.variants.find((v) => v.id === l.variantId)
        : null;
      const unit = variant?.priceNgn ?? p.priceNgn;
      return {
        ...l,
        product: p,
        unit,
        subtotal: unit * l.qty,
        variantLabel: variant?.label ?? null,
      };
    })
    .filter((r): r is ResolvedLine => r !== null);

  const subtotal = resolved.reduce((sum, r) => sum + r.subtotal, 0);
  const shipping =
    subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING;
  const total = subtotal + shipping;

  if (loading && lines.length > 0) {
    return (
      <>
        <Stack.Screen options={{ title: "Cart" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  if (resolved.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: "Cart" }} />
        <View className="flex-1 items-center justify-center bg-background px-4">
          <ShoppingBag size={48} color="#525252" />
          <Text className="mt-4 text-xl font-bold text-foreground">
            Your cart is empty
          </Text>
          <Text className="mt-1 text-center text-sm text-muted-foreground">
            Find jerseys, apparel, and digital gifts in the shop.
          </Text>
          <Button
            onPress={() => router.replace("/(public)/shop")}
            className="mt-5 bg-brand"
            textClassName="text-black"
          >
            Browse shop
          </Button>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Cart" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-12"
      >
        <View className="px-4 pt-5 pb-3">
          <Text className="text-2xl font-bold text-foreground">Your cart</Text>
        </View>

        <View className="px-4">
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            {resolved.map((line, i) => (
              <View
                key={`${line.productId}-${line.variantId ?? ""}`}
                className={`gap-3 p-4 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <View className="flex-row items-start gap-3">
                  <View className="h-20 w-20 overflow-hidden rounded-lg bg-muted">
                    <Image
                      source={line.product.images[0] ?? undefined}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Pressable
                      onPress={() =>
                        router.push(`/(public)/shop/${line.product.id}`)
                      }
                      className="active:opacity-70"
                    >
                      <Text
                        className="text-sm font-semibold text-foreground"
                        numberOfLines={2}
                      >
                        {line.product.name}
                      </Text>
                    </Pressable>
                    {line.variantLabel ? (
                      <Text className="text-xs text-muted-foreground">
                        Size: {line.variantLabel}
                      </Text>
                    ) : null}
                    <Text className="mt-1 text-xs text-muted-foreground">
                      {formatNgn(line.unit)} each
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      removeLine(line.productId, line.variantId);
                      toast.success("Removed from cart");
                    }}
                    accessibilityLabel="Remove"
                    className="h-8 w-8 items-center justify-center rounded-md active:opacity-70"
                  >
                    <Trash2 size={16} color="#f87171" />
                  </Pressable>
                </View>
                <View className="flex-row items-center justify-between">
                  <QtyStepper
                    value={line.qty}
                    onChange={(n) =>
                      updateQty(line.productId, line.variantId, n)
                    }
                  />
                  <Text className="text-sm font-semibold text-foreground">
                    {formatNgn(line.subtotal)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-4 px-4">
          <View className="rounded-2xl border border-border bg-card p-5">
            <Text className="text-base font-semibold text-foreground">
              Order summary
            </Text>
            <View className="mt-4 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">Subtotal</Text>
                <Text className="text-sm text-foreground">
                  {formatNgn(subtotal)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">Shipping</Text>
                <Text className="text-sm text-foreground">
                  {shipping === 0 && subtotal >= FREE_SHIPPING_MIN ? (
                    <Text style={{ color: "#2CD7E3" }}>Free</Text>
                  ) : (
                    formatNgn(shipping)
                  )}
                </Text>
              </View>
              <View className="flex-row items-center justify-between border-t border-border pt-3">
                <Text className="text-base font-bold text-foreground">
                  Total
                </Text>
                <Text className="text-base font-bold text-foreground">
                  {formatNgn(total)}
                </Text>
              </View>
            </View>

            <Button
              onPress={() => router.push("/(authed)/checkout")}
              className="mt-5 bg-brand"
              textClassName="text-black"
            >
              Checkout with Paystack
            </Button>
            <Text className="mt-2 text-center text-[11px] text-muted-foreground">
              Payments secured by Paystack
            </Text>
          </View>
          <Button
            variant="ghost"
            onPress={() => router.replace("/(public)/shop")}
            className="mt-3"
          >
            <Text className="text-sm font-medium text-foreground">
              Continue shopping
            </Text>
          </Button>
        </View>
      </ScrollView>
    </>
  );
}
