import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/common/image-with-fallback";

export function formatNgn(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `₦${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}K`;
  return `₦${n.toLocaleString()}`;
}

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const image = product.images[0];
  return (
    <Pressable
      onPress={() => router.push(`/shop/${product.id}`)}
      className="overflow-hidden rounded-2xl border border-border bg-card active:opacity-80"
      style={{ flex: 1 }}
    >
      <View
        style={{
          aspectRatio: 1,
          backgroundColor: "#262626",
          position: "relative",
        }}
      >
        <ImageWithFallback
          source={image}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          fallbackLabel={product.name}
          tintSeed={product.id}
        />
        <View className="absolute left-2 top-2">
          <Badge
            className="border-border bg-background"
            textClassName="capitalize text-foreground"
          >
            {product.category}
          </Badge>
        </View>
        {product.featured ? (
          <View className="absolute right-2 top-2">
            <Badge
              style={{
                borderColor: "rgba(245,158,11,0.4)",
                backgroundColor: "rgba(245,158,11,0.2)",
              }}
              textClassName="text-xs"
            >
              <Text style={{ fontSize: 10, color: "#fcd34d", fontWeight: "600" }}>
                Featured
              </Text>
            </Badge>
          </View>
        ) : null}
      </View>
      <View className="flex-1 p-3">
        <Text
          className="text-sm font-semibold text-foreground"
          numberOfLines={2}
        >
          {product.name}
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 16,
            fontWeight: "700",
            color: "#67e8f9",
          }}
        >
          {formatNgn(product.priceNgn)}
        </Text>
      </View>
    </Pressable>
  );
}

export default ProductCard;
