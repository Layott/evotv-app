import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react-native";

import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { listGames } from "@/lib/api/games";

function platformLabel(p: string): string {
  switch (p) {
    case "mobile":
      return "Mobile";
    case "pc":
      return "PC";
    case "console":
      return "Console";
    default:
      return p.toUpperCase();
  }
}

function categoryLabel(c: string): string {
  switch (c) {
    case "br":
      return "Battle Royale";
    case "fps":
      return "FPS";
    case "moba":
      return "MOBA";
    case "sports":
      return "Sports";
    case "fighting":
      return "Fighting";
    default:
      return c.toUpperCase();
  }
}

export default function CategoriesScreen() {
  const router = useRouter();
  const games = useQuery({ queryKey: ["games"], queryFn: () => listGames() });

  return (
    <>
      <Stack.Screen options={{ title: "Categories" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <View className="mb-6">
          <Text className="text-2xl font-bold tracking-tight text-foreground">
            Categories
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Browse by category. Esports tournaments, anime reactions, lifestyle
            podcasts - find what you love.
          </Text>
        </View>

        {games.isPending ? (
          <View className="gap-4">
            <Skeleton style={{ aspectRatio: 4 / 5, borderRadius: 12 }} />
            <Skeleton style={{ aspectRatio: 4 / 5, borderRadius: 12 }} />
          </View>
        ) : (games.data ?? []).length === 0 ? (
          <View className="rounded-xl border border-border bg-card p-8">
            <Text className="text-center text-sm text-muted-foreground">
              No games available yet.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {games.data!.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => router.push(`/categories/${g.slug}`)}
                className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
              >
                <View
                  style={{ aspectRatio: 4 / 5, position: "relative" }}
                >
                  <ImageWithFallback
                    source={g.coverUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    fallbackLabel={g.name}
                    tintSeed={g.id}
                  />
                  <View
                    className="absolute inset-x-0 bottom-0 h-1/2"
                    style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
                  />
                  <View className="absolute inset-x-0 bottom-0 gap-2 p-4">
                    <View
                      className="self-start rounded-md px-2 py-0.5"
                      style={{
                        backgroundColor: "rgba(70,227,206,0.25)",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "600",
                          letterSpacing: 1,
                          color: "#67e8f9",
                          textTransform: "uppercase",
                        }}
                      >
                        {categoryLabel(g.category)}
                      </Text>
                    </View>
                    <Text className="text-lg font-bold text-white">
                      {g.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#d4d4d4" }}>
                      {g.shortName}
                    </Text>
                    <View className="mt-1 flex-row items-center justify-between">
                      <Text style={{ fontSize: 11, color: "#d4d4d4" }}>
                        {categoryLabel(g.category)} ·{" "}
                        {platformLabel(g.platform)}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#67e8f9",
                          }}
                        >
                          Enter
                        </Text>
                        <ArrowRight size={14} color="#67e8f9" />
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}
