import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";

import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, ShoppingCart } from "lucide-react-native";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard, formatNgn } from "@/components/shop/product-card";
import { QtyStepper } from "@/components/shop/qty-stepper";
import { VariantPicker } from "@/components/shop/variant-picker";
import { addLine } from "@/components/shop/cart-store";
import {
  getProductById,
  getProductBySlug,
  listProducts,
} from "@/lib/api/products";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ShopProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = id as string;

  const productQ = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      let p = await getProductById(productId);
      if (!p) p = await getProductBySlug(productId);
      return p;
    },
  });

  const product = productQ.data ?? null;

  const relatedQ = useQuery({
    queryKey: ["products", "related", product?.category, product?.id],
    queryFn: async () => {
      if (!product) return [] as Product[];
      const all = await listProducts();
      return all
        .filter((r) => r.category === product.category && r.id !== product.id)
        .slice(0, 6);
    },
    enabled: !!product,
  });

  const [variantId, setVariantId] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState(1);
  const [activeImage, setActiveImage] = React.useState(0);

  React.useEffect(() => {
    if (product && variantId == null) {
      const def = product.variants.find((v) => v.inventory > 0);
      setVariantId(def?.id ?? null);
    }
  }, [product, variantId]);

  if (!productQ.isPending && !product) {
    return (
      <>
        <Stack.Screen options={{ title: "Product" }} />
        <View className="flex-1 items-center justify-center bg-background px-4">
          <Text className="text-2xl font-bold text-foreground">
            Product not found
          </Text>
          <Button
            className="mt-6 bg-brand"
            textClassName="text-black"
            onPress={() => router.push("/shop")}
          >
            Back to shop
          </Button>
        </View>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Stack.Screen options={{ title: "Product" }} />
        <View className="flex-1 bg-background px-4 py-6">
          <Skeleton style={{ aspectRatio: 1, borderRadius: 16 }} />
          <Skeleton style={{ height: 24, marginTop: 16 }} />
          <Skeleton style={{ height: 16, marginTop: 12, width: "60%" }} />
        </View>
      </>
    );
  }

  const activeVariant = variantId
    ? product.variants.find((v) => v.id === variantId)
    : null;
  const price = activeVariant?.priceNgn ?? product.priceNgn;
  const hasVariants = product.variants.length > 0;
  const inStock = hasVariants
    ? (activeVariant?.inventory ?? 0) > 0
    : product.inventory > 0;

  function handleAdd() {
    if (hasVariants && !variantId) {
      toast.error("Pick a size first");
      return;
    }
    addLine({ productId: product!.id, variantId, qty });
    toast.success(`Added ${qty} × ${product!.name} to cart`);
  }

  const related = relatedQ.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <Pressable
          onPress={() => router.push("/shop")}
          className="mb-4 flex-row items-center gap-1 self-start active:opacity-70"
        >
          <ArrowLeft size={14} color="#a3a3a3" />
          <Text className="text-sm text-muted-foreground">Back to shop</Text>
        </Pressable>

        <View
          className="overflow-hidden rounded-2xl border border-border bg-card"
          style={{ aspectRatio: 1 }}
        >
          <ImageWithFallback
            source={product.images[activeImage] ?? product.images[0]}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            fallbackLabel={product.name}
            tintSeed={product.id}
          />
        </View>
        {product.images.length > 1 ? (
          <View className="mt-3 flex-row gap-2">
            {product.images.map((img, i) => (
              <Pressable
                key={i}
                onPress={() => setActiveImage(i)}
                className={cn(
                  "overflow-hidden rounded-lg border",
                  i === activeImage ? "border-brand" : "border-border",
                )}
                style={{ width: 80, aspectRatio: 1 }}
              >
                <Image
                  source={img}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </View>
        ) : null}

        <View className="mt-6">
          <Badge
            className="border-border bg-card"
            textClassName="capitalize text-muted-foreground"
          >
            {product.category}
          </Badge>
          <Text className="mt-2 text-2xl font-bold text-foreground">
            {product.name}
          </Text>
          <Text
            style={{
              marginTop: 12,
              fontSize: 28,
              fontWeight: "700",
              color: "#67e8f9",
            }}
          >
            {formatNgn(price)}
          </Text>
          <Text className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </Text>

          <View className="mt-6 gap-4">
            {hasVariants ? (
              <VariantPicker
                variants={product.variants}
                value={variantId}
                onChange={setVariantId}
              />
            ) : null}
            <View>
              <Text
                style={{
                  marginBottom: 8,
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  color: "#a3a3a3",
                  textTransform: "uppercase",
                }}
              >
                Quantity
              </Text>
              <QtyStepper
                value={qty}
                onChange={setQty}
                max={inStock ? 10 : 0}
              />
            </View>

            <View className="mt-2 flex-row gap-2">
              <Button
                onPress={handleAdd}
                disabled={!inStock}
                className="flex-1 bg-brand"
                textClassName="text-black"
              >
                <ShoppingCart size={16} color="#000" />
                <Text className="text-sm font-semibold text-black">
                  {inStock ? "Add to cart" : "Out of stock"}
                </Text>
              </Button>
            </View>

            <View className="mt-4 gap-1">
              <View className="flex-row items-center gap-2">
                <Check size={12} color="#67e8f9" />
                <Text style={{ fontSize: 11, color: "#737373" }}>
                  Ships NG-wide · 3–5 business days
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Check size={12} color="#67e8f9" />
                <Text style={{ fontSize: 11, color: "#737373" }}>
                  Paystack secured checkout
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Check size={12} color="#67e8f9" />
                <Text style={{ fontSize: 11, color: "#737373" }}>
                  14-day returns on apparel
                </Text>
              </View>
            </View>
          </View>
        </View>

        {related.length > 0 ? (
          <View className="mt-12 gap-4">
            <Text className="text-base font-semibold text-foreground">
              You might also like
            </Text>
            <View className="gap-4">
              {Array.from({ length: Math.ceil(related.length / 2) }).map(
                (_, ri) => {
                  const row = related.slice(ri * 2, ri * 2 + 2);
                  return (
                    <View key={ri} className="flex-row gap-4">
                      {row.map((r) => (
                        <ProductCard key={r.id} product={r} />
                      ))}
                      {row.length === 1 ? (
                        <View style={{ flex: 1 }} />
                      ) : null}
                    </View>
                  );
                },
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}
