import * as React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Handshake,
  Info,
  ShieldCheck,
  Star,
} from "lucide-react-native";

import { listPartners, type Partner } from "@/lib/mock/partners";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PartnerCardProps {
  partner: Partner;
}

function PartnerCard({ partner }: PartnerCardProps) {
  return (
    <View
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <View
        className="px-4 py-3"
        style={{ backgroundColor: `${partner.brandColor}1A` }}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 overflow-hidden rounded-xl bg-card">
            <Image
              source={partner.logoUrl}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">
              {partner.name}
            </Text>
            <Text
              className="text-xs text-muted-foreground"
              numberOfLines={1}
            >
              {partner.tagline}
            </Text>
          </View>
          <Badge
            variant="outline"
            className="border-border"
            textClassName={
              partner.kind === "betting"
                ? "text-emerald-300"
                : "text-sky-300"
            }
          >
            {partner.kind === "betting" ? "Betting" : "Sponsor"}
          </Badge>
        </View>
      </View>
      <View className="px-4 py-3 gap-3">
        <Text
          className="text-sm text-muted-foreground"
          numberOfLines={3}
        >
          {partner.blurb}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Star size={13} color="#fbbf24" fill="#fbbf24" />
            <Text className="text-xs text-foreground">
              {partner.rating.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 11, color: "#737373" }}>·</Text>
            <Text className="text-xs text-muted-foreground">
              {partner.country}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              Linking.openURL(
                `https://${partner.name.toLowerCase().replace(/\s+/g, "")}.com`,
              )
            }
            className="flex-row items-center gap-1 active:opacity-70"
          >
            <Text
              style={{ color: "#2CD7E3", fontSize: 12, fontWeight: "600" }}
            >
              {partner.ctaLabel}
            </Text>
            <ArrowUpRight size={13} color="#2CD7E3" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterPill({ label, active, onPress }: FilterPillProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${
        active ? "border-brand" : "border-border bg-card"
      }`}
      style={
        active ? { backgroundColor: "rgba(44,215,227,0.10)" } : undefined
      }
    >
      <Text
        className="text-xs font-medium"
        style={{ color: active ? "#2CD7E3" : "#a3a3a3" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function PartnersScreen() {
  const [filter, setFilter] = React.useState<"all" | "betting" | "sponsor">(
    "all",
  );

  const { data: partners, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: () => listPartners(),
  });

  const filtered = React.useMemo(() => {
    if (!partners) return [];
    if (filter === "all") return partners;
    return partners.filter((p) => p.kind === filter);
  }, [partners, filter]);

  return (
    <>
      <Stack.Screen options={{ title: "Partners" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 pt-4 gap-3">
          <Badge
            variant="outline"
            className="border-brand"
            textClassName="text-brand"
          >
            <Handshake size={11} color="#2CD7E3" /> Partner showcase
          </Badge>
          <Text className="text-2xl font-bold text-foreground">
            The brands behind African entertainment.
          </Text>
          <Text className="text-sm text-muted-foreground">
            Meet the partners powering EVO TV. Visit their sites to learn more
            — wagers are not placed or facilitated through this platform.
          </Text>
        </View>

        <View className="px-4 pt-4">
          <View className="flex-row gap-2">
            <FilterPill
              label="All partners"
              active={filter === "all"}
              onPress={() => setFilter("all")}
            />
            <FilterPill
              label="Betting"
              active={filter === "betting"}
              onPress={() => setFilter("betting")}
            />
            <FilterPill
              label="Sponsors"
              active={filter === "sponsor"}
              onPress={() => setFilter("sponsor")}
            />
          </View>
        </View>

        <View className="px-4 pt-4 gap-3">
          {isLoading ? (
            [0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ height: 180, borderRadius: 16 }} />
            ))
          ) : filtered.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-border p-10 items-center">
              <Text className="text-sm text-muted-foreground">
                No partners under this filter yet.
              </Text>
            </View>
          ) : (
            filtered.map((p) => <PartnerCard key={p.id} partner={p} />)
          )}
        </View>

        <View className="mx-4 mt-8 rounded-2xl border border-border bg-card p-5 flex-row gap-3">
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(44,215,227,0.15)" }}
          >
            <ShieldCheck size={18} color="#2CD7E3" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">
              Responsible viewing
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              EVO TV showcases partners for transparency. All odds, brand pages,
              and visuals are for entertainment only — EVO TV does not collect,
              hold, or place wagers on behalf of viewers. For support with
              problem gambling, contact local helplines such as Be Gamble Aware
              (Africa).
            </Text>
          </View>
        </View>

        <View className="mx-4 mt-3 flex-row items-start gap-2 rounded-lg border border-border bg-card p-3">
          <Info size={13} color="#737373" />
          <Text className="flex-1 text-xs text-muted-foreground">
            Odds shown across the platform reflect partner-published prices for
            entertainment only. Numbers may shift in real-time and EVO TV is not
            the source of truth for wager settlement.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
