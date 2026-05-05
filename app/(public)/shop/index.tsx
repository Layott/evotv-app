import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { TopNavbar } from "@/components/home/top-navbar";
import { ProductCard } from "@/components/shop/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { listProducts } from "@/lib/mock/products";
import type { Product } from "@/lib/types";

const CATEGORIES: { v: Product["category"] | "all"; label: string }[] = [
  { v: "all", label: "All" },
  { v: "jersey", label: "Jerseys" },
  { v: "apparel", label: "Apparel" },
  { v: "accessory", label: "Accessories" },
  { v: "collectible", label: "Collectibles" },
  { v: "digital", label: "Digital" },
];

type Sort = "featured" | "price-asc" | "price-desc" | "name";
const SORTS: { v: Sort; label: string }[] = [
  { v: "featured", label: "Featured" },
  { v: "price-asc", label: "Price ↑" },
  { v: "price-desc", label: "Price ↓" },
  { v: "name", label: "A–Z" },
];

function Chip({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border px-3 py-1.5 active:opacity-70"
      style={{
        borderColor: active ? "rgba(44,215,227,0.5)" : "#262626",
        backgroundColor: active
          ? "rgba(44,215,227,0.15)"
          : "rgba(15,15,15,0.6)",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: active ? "#67e8f9" : "#d4d4d4",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ShopScreen() {
  const [cat, setCat] = React.useState<Product["category"] | "all">("all");
  const [sort, setSort] = React.useState<Sort>("featured");

  const productsQ = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
  });

  const filtered = React.useMemo(() => {
    let list = productsQ.data ?? [];
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    list = [...list];
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.priceNgn - b.priceNgn);
        break;
      case "price-desc":
        list.sort((a, b) => b.priceNgn - a.priceNgn);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        list.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }, [productsQ.data, cat, sort]);

  // Build 2-column rows
  const rows = React.useMemo(() => {
    const out: Product[][] = [];
    for (let i = 0; i < filtered.length; i += 2) {
      out.push(filtered.slice(i, i + 2));
    }
    return out;
  }, [filtered]);

  return (
    <View className="flex-1 bg-background">
      <TopNavbar />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
      >
        <View className="px-4 pb-4">
          <Text className="text-2xl font-bold tracking-tight text-foreground">
            Shop
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Official merch, collectibles & digital goods. Pay in Naira.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {CATEGORIES.map((c) => (
            <Chip
              key={c.v}
              active={cat === c.v}
              onPress={() => setCat(c.v)}
              label={c.label}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 11, color: "#737373", alignSelf: "center" }}>
            Sort:
          </Text>
          {SORTS.map((s) => (
            <Chip
              key={s.v}
              active={sort === s.v}
              onPress={() => setSort(s.v)}
              label={s.label}
            />
          ))}
        </ScrollView>

        <View className="mt-6 px-4">
          {productsQ.isPending ? (
            <View className="gap-4">
              <View className="flex-row gap-4">
                <Skeleton style={{ flex: 1, aspectRatio: 0.8, borderRadius: 16 }} />
                <Skeleton style={{ flex: 1, aspectRatio: 0.8, borderRadius: 16 }} />
              </View>
              <View className="flex-row gap-4">
                <Skeleton style={{ flex: 1, aspectRatio: 0.8, borderRadius: 16 }} />
                <Skeleton style={{ flex: 1, aspectRatio: 0.8, borderRadius: 16 }} />
              </View>
            </View>
          ) : filtered.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-border p-12">
              <Text className="text-center text-sm text-muted-foreground">
                No products match your filters.
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {rows.map((row, ri) => (
                <View key={ri} className="flex-row gap-4">
                  {row.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                  {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
