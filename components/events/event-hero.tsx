import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ArrowLeft, Calendar, MapPin, Trophy } from "lucide-react-native";

import type { EsportsEvent, Game } from "@/lib/types";

export interface EventHeroProps {
  event: EsportsEvent;
  game?: Game | null;
}

function formatNgn(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "₦-";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `₦${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}K`;
  return `₦${n.toLocaleString()}`;
}

function tierStyle(t: string): {
  backgroundColor: string;
  color: string;
} {
  switch (t) {
    case "s":
      return {
        backgroundColor: "rgba(245,158,11,0.3)",
        color: "#fcd34d",
      };
    case "a":
    case "b":
      return {
        backgroundColor: "rgba(70,227,206,0.3)",
        color: "#67e8f9",
      };
    default:
      return {
        backgroundColor: "#103133",
        color: "#d4d4d4",
      };
  }
}

function safeDateLabel(iso: string | null | undefined): string {
  if (!iso) return "TBA";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "TBA" : d.toLocaleDateString();
}

export function EventHero({ event, game }: EventHeroProps) {
  const router = useRouter();
  const tier = tierStyle(event.tier);
  const startLabel = safeDateLabel(event.startsAt);
  const endLabel = safeDateLabel(event.endsAt);
  return (
    <View className="mb-6 overflow-hidden rounded-xl border border-border">
      <View style={{ aspectRatio: 16 / 9, position: "relative" }}>
        <Image
          source={event.bannerUrl}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        {/* Gradient-ish overlay using stacked solid views */}
        <View
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        />
        <View
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        />
        <View className="absolute inset-x-0 bottom-0 gap-2 p-4">
          <Pressable
            onPress={() => router.push("/events")}
            className="flex-row items-center gap-1 self-start"
          >
            <ArrowLeft size={12} color="#9FBDBD" />
            <Text style={{ fontSize: 11, color: "#9FBDBD" }}>All events</Text>
          </Pressable>
          <View className="flex-row items-center gap-2">
            <View
              className="rounded-md px-2 py-0.5"
              style={{
                backgroundColor: tier.backgroundColor,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  letterSpacing: 1,
                  color: tier.color,
                }}
              >
                TIER {(event.tier ?? "").toUpperCase()}
              </Text>
            </View>
            {event.status === "live" ? (
              <View
                className="flex-row items-center gap-1 rounded-md px-2 py-0.5"
                style={{
                  backgroundColor: "rgba(239,68,68,0.25)",
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#ef4444",
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 1,
                    color: "#fca5a5",
                  }}
                >
                  LIVE NOW
                </Text>
              </View>
            ) : null}
            {event.status === "completed" ? (
              <View
                className="rounded-md px-2 py-0.5"
                style={{
                  backgroundColor: "#103133",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 1,
                    color: "#9FBDBD",
                  }}
                >
                  CONCLUDED
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-2xl font-bold leading-tight text-white">
            {event.title}
          </Text>
          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
            {game ? (
              <Text style={{ fontSize: 11, color: "#67e8f9" }}>{game.name}</Text>
            ) : null}
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color="#d4d4d4" />
              <Text style={{ fontSize: 11, color: "#d4d4d4" }}>
                {startLabel} - {endLabel}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color="#d4d4d4" />
              <Text style={{ fontSize: 11, color: "#d4d4d4" }}>
                {event.region}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Trophy size={12} color="#fcd34d" />
              <Text
                style={{ fontSize: 11, fontWeight: "600", color: "#fcd34d" }}
              >
                {formatNgn(event.prizePoolNgn)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default EventHero;
