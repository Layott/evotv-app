import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useMockAuth } from "@/components/providers";
import {
  CART_KEY,
  clearCart,
  getCart,
  pushLocalOrder,
  type CartLine,
} from "@/components/shop/cart-store";
import { syncRemove } from "@/lib/storage/persist";
import { getProductById } from "@/lib/api/products";
import { createOrder } from "@/lib/api/orders";
import { initPlanCheckout } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/_client";
import * as WebBrowser from "expo-web-browser";
import { formatNgn } from "@/components/profile/ngn";
import type { Product } from "@/lib/types";

const NG_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT Abuja",
];

const SHIPPING_FEE = 2500;
const FREE_SHIPPING_MIN = 50_000;

interface ResolvedLine extends CartLine {
  product: Product;
  unit: number;
  subtotal: number;
  variantLabel: string | null;
}

interface ShippingFields {
  fullName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  country: string;
}

const PHONE_REGEX = /^\+234[0-9\s-]{7,}$/;

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const params = useLocalSearchParams<{ plan?: string }>();
  const isSubscription = params.plan === "premium";

  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [products, setProducts] = React.useState<Record<string, Product>>({});
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);

  const [fields, setFields] = React.useState<ShippingFields>({
    fullName: user?.displayName ?? "",
    phone: "+234 ",
    address1: "",
    address2: "",
    city: "",
    state: "Lagos",
    country: "Nigeria",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof ShippingFields, string>>>({});

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const l = getCart();
      setLines(l);
      const entries = await Promise.all(
        l.map(async (x) => {
          const p = await getProductById(x.productId);
          return p ? ([x.productId, p] as const) : null;
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
  }, []);

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

  const cartSubtotal = resolved.reduce((s, r) => s + r.subtotal, 0);
  const subtotal = isSubscription ? 4_500 : cartSubtotal;
  const shipping = isSubscription
    ? 0
    : cartSubtotal >= FREE_SHIPPING_MIN
      ? 0
      : SHIPPING_FEE;
  const total = subtotal + shipping;

  function validate(): boolean {
    if (isSubscription) return true;
    const next: Partial<Record<keyof ShippingFields, string>> = {};
    if (fields.fullName.trim().length < 2) next.fullName = "Full name required";
    if (!PHONE_REGEX.test(fields.phone.trim()))
      next.phone = "Format: +234 8XX XXX XXXX";
    if (fields.address1.trim().length < 3)
      next.address1 = "Address required";
    if (fields.city.trim().length < 2) next.city = "City required";
    if (fields.state.trim().length < 2) next.state = "State required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function finishOrder() {
    if (!validate()) {
      toast.error("Fix shipping details first");
      return;
    }
    setProcessing(true);

    // Subscription path → POST /api/payments/init. Backend records the
    // plan upgrade attempt + initialises Paystack/mock. Returns the
    // hosted-page redirect URL; opening it confirms the upgrade and
    // bumps the user's role to `premium` once the provider callback
    // lands.
    if (isSubscription) {
      try {
        const res = await initPlanCheckout({ plan: "premium" });
        if (res.redirectUrl) {
          try {
            await WebBrowser.openBrowserAsync(res.redirectUrl);
          } catch {
            /* user dismissed — payment stays pending; they can retry */
          }
        }
        setProcessing(false);
        toast.success("Premium upgrade started");
        router.replace("/(public)/home");
      } catch (err) {
        setProcessing(false);
        if (err instanceof ApiError) {
          const body = err.body as { error?: string } | null;
          if (err.status === 401) {
            toast.error("Sign in again to upgrade");
          } else if (err.status === 409) {
            toast.error("You already have an active subscription");
          } else if (err.status === 422) {
            toast.error(body?.error ?? "Invalid plan");
          } else {
            toast.error("Upgrade failed — please try again");
          }
          return;
        }
        toast.error("Network error — please try again");
      }
      return;
    }

    // Real /api/orders flow for product cart.
    try {
      const res = await createOrder({
        items: resolved.map((r) => ({
          productId: r.product.id,
          variantId: r.variantId,
          qty: r.qty,
        })),
        shipping: {
          fullName: fields.fullName || user?.displayName || "Customer",
          phone: fields.phone,
          address1: fields.address1,
          address2: fields.address2 || undefined,
          city: fields.city,
          state: fields.state,
          country: fields.country || "Nigeria",
        },
      });

      // Cart is consumed once the order row is created, regardless of
      // payment outcome. If payment fails the user can pay from
      // /(authed)/order/[id] later.
      clearCart();
      syncRemove(CART_KEY);
      pushLocalOrder(res.order);

      if (res.redirectUrl) {
        // Mock provider: confirm-payment URL with `mock=1` — opening it
        // auto-completes the order. Paystack: redirects to their hosted
        // page. Both paths converge on /(authed)/order/[id] after.
        try {
          await WebBrowser.openBrowserAsync(res.redirectUrl);
        } catch {
          /* user dismissed the browser — order stays pending */
        }
      }

      setProcessing(false);
      toast.success("Order placed");
      router.replace(`/(authed)/order/${res.order.id}`);
    } catch (err) {
      setProcessing(false);
      if (err instanceof ApiError) {
        const body = err.body as { error?: string; code?: string } | null;
        if (err.status === 409 && body?.code === "out_of_stock") {
          toast.error("One of your items just sold out");
        } else if (err.status === 422) {
          toast.error(body?.error ?? "Invalid order");
        } else if (err.status === 401) {
          toast.error("Sign in again to place the order");
        } else {
          toast.error("Order failed — please try again");
        }
        return;
      }
      toast.error("Network error — please try again");
    }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Checkout" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  if (!isSubscription && resolved.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: "Checkout" }} />
        <View className="flex-1 items-center justify-center bg-background px-4">
          <Text className="text-xl font-bold text-foreground">
            Your cart is empty
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Add items before checking out.
          </Text>
          <Button
            onPress={() => router.replace("/(public)/shop")}
            className="mt-5 bg-brand"
            textClassName="text-black"
          >
            Go to shop
          </Button>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ title: isSubscription ? "Confirm Premium" : "Checkout" }}
      />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-5">
          <Text className="text-2xl font-bold text-foreground">
            {isSubscription ? "Confirm Premium" : "Checkout"}
          </Text>
        </View>

        {/* Order summary first on mobile */}
        <View className="mt-4 px-4">
          <View className="rounded-2xl border border-border bg-card p-5">
            <Text className="text-base font-semibold text-foreground">
              Order summary
            </Text>
            <View className="mt-3">
              {isSubscription ? (
                <View className="flex-row items-center gap-3 py-3">
                  <View
                    className="h-14 w-14 items-center justify-center overflow-hidden rounded-lg"
                    style={{ backgroundColor: "rgba(245,158,11,0.2)" }}
                  >
                    <Text style={{ color: "#fbbf24", fontSize: 20 }}>★</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      EVO TV Premium
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      Billed monthly
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-foreground">
                    {formatNgn(4500)}
                  </Text>
                </View>
              ) : (
                resolved.map((r, i) => (
                  <View
                    key={`${r.productId}-${r.variantId ?? ""}`}
                    className={`flex-row items-center gap-3 py-3 ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <View className="h-14 w-14 overflow-hidden rounded-lg bg-muted">
                      <Image
                        source={r.product.images[0] ?? undefined}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text
                        className="text-sm font-semibold text-foreground"
                        numberOfLines={1}
                      >
                        {r.product.name}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {r.variantLabel ? `${r.variantLabel} · ` : ""}Qty {r.qty}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-foreground">
                      {formatNgn(r.subtotal)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View className="mt-3 gap-2 border-t border-border pt-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">Subtotal</Text>
                <Text className="text-sm text-foreground">
                  {formatNgn(subtotal)}
                </Text>
              </View>
              {!isSubscription ? (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">Shipping</Text>
                  <Text className="text-sm text-foreground">
                    {shipping === 0 ? (
                      <Text style={{ color: "#2CD7E3" }}>Free</Text>
                    ) : (
                      formatNgn(shipping)
                    )}
                  </Text>
                </View>
              ) : null}
              <View className="flex-row items-center justify-between border-t border-border pt-3">
                <Text className="text-base font-bold text-foreground">
                  Total
                </Text>
                <Text className="text-base font-bold text-foreground">
                  {formatNgn(total)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Shipping (cart only) */}
        {!isSubscription ? (
          <View className="mt-4 px-4">
            <View className="rounded-2xl border border-border bg-card p-5">
              <Text className="text-base font-semibold text-foreground">
                Shipping address
              </Text>

              <View className="mt-4 gap-3">
                <View className="gap-1.5">
                  <Label>Full name</Label>
                  <Input
                    value={fields.fullName}
                    onChangeText={(v) =>
                      setFields((s) => ({ ...s, fullName: v }))
                    }
                  />
                  {errors.fullName ? (
                    <Text className="text-xs" style={{ color: "#f87171" }}>
                      {errors.fullName}
                    </Text>
                  ) : null}
                </View>
                <View className="gap-1.5">
                  <Label>Phone</Label>
                  <Input
                    placeholder="+234 8XX XXX XXXX"
                    keyboardType="phone-pad"
                    value={fields.phone}
                    onChangeText={(v) =>
                      setFields((s) => ({ ...s, phone: v }))
                    }
                  />
                  {errors.phone ? (
                    <Text className="text-xs" style={{ color: "#f87171" }}>
                      {errors.phone}
                    </Text>
                  ) : null}
                </View>
                <View className="gap-1.5">
                  <Label>Address line 1</Label>
                  <Input
                    value={fields.address1}
                    onChangeText={(v) =>
                      setFields((s) => ({ ...s, address1: v }))
                    }
                  />
                  {errors.address1 ? (
                    <Text className="text-xs" style={{ color: "#f87171" }}>
                      {errors.address1}
                    </Text>
                  ) : null}
                </View>
                <View className="gap-1.5">
                  <Label>Address line 2 (optional)</Label>
                  <Input
                    value={fields.address2}
                    onChangeText={(v) =>
                      setFields((s) => ({ ...s, address2: v }))
                    }
                  />
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1 gap-1.5">
                    <Label>City</Label>
                    <Input
                      value={fields.city}
                      onChangeText={(v) =>
                        setFields((s) => ({ ...s, city: v }))
                      }
                    />
                    {errors.city ? (
                      <Text className="text-xs" style={{ color: "#f87171" }}>
                        {errors.city}
                      </Text>
                    ) : null}
                  </View>
                  <View className="flex-1 gap-1.5">
                    <Label>State</Label>
                    <Select
                      value={fields.state}
                      onValueChange={(v) =>
                        setFields((s) => ({ ...s, state: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NG_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </View>
                </View>
                <View className="gap-1.5">
                  <Label>Country</Label>
                  <Input
                    value={fields.country}
                    editable={false}
                    onChangeText={(v) =>
                      setFields((s) => ({ ...s, country: v }))
                    }
                  />
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Payment */}
        <View className="mt-4 px-4">
          <View className="rounded-2xl border border-border bg-card p-5">
            <Text className="text-base font-semibold text-foreground">
              Payment
            </Text>
            <View className="mt-4 rounded-xl border border-border bg-background p-4">
              <View className="flex-row items-center gap-3">
                <View
                  className="h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "rgba(0,195,247,0.15)" }}
                >
                  <Text
                    className="text-base font-extrabold"
                    style={{ color: "#00C3F7" }}
                  >
                    P
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Pay with Paystack
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Cards, bank transfer, USSD, Opay.
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-4 gap-2">
              <Button
                onPress={finishOrder}
                disabled={processing}
                className="bg-brand"
                textClassName="text-black"
              >
                {processing
                  ? "Processing..."
                  : `Pay ${formatNgn(total)} with Paystack`}
              </Button>
              <Pressable
                disabled={processing}
                onPress={() =>
                  router.push("/(authed)/checkout/mobile-money")
                }
                className="h-9 flex-row items-center justify-center rounded-md border border-input bg-background px-4 active:opacity-80"
              >
                <Text className="text-sm font-medium text-foreground">
                  Use mobile money instead
                </Text>
              </Pressable>
            </View>

            <View className="mt-3 flex-row items-center justify-center gap-1">
              <ShieldCheck size={12} color="#2CD7E3" />
              <Text className="text-[11px] text-muted-foreground">
                256-bit secure. No card data leaves Paystack.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
