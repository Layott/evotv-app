import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
} from "@/components/icons";

import { toast } from "sonner-native";

import { listTiers, type Tier } from "@/lib/api/subs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DisplayTier extends Tier {
  tagline: string;
  cta: string;
}

function decorateTier(t: Tier): DisplayTier {
  return {
    ...t,
    tagline: t.features[0] ?? "",
    cta: t.priceNgn === 0 ? "Current plan" : "Upgrade",
  };
}

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Premium benefits continue through the end of your current billing period after cancelling.",
  },
  {
    q: "Which payment methods work?",
    a: "Any Nigerian card, bank transfer, USSD, or Opay via Paystack. We never store card details ourselves.",
  },
  {
    q: "Is the trial really free?",
    a: "Your first 7 days are free. You won't be billed until the trial ends and you can cancel any time before.",
  },
  {
    q: "Do I need Premium to chat?",
    a: "No. Chat is free on every stream. Premium gets you a badge, slower cooldowns, and custom emotes.",
  },
];

function formatNgn(n: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

interface TierCardProps {
  tier: DisplayTier;
  current?: boolean;
  highlight?: boolean;
  onUpgrade: () => void;
}

function TierCard({ tier, current, highlight, onUpgrade }: TierCardProps) {
  const palette = useTokens();
  return (
    <View
      className={`relative rounded-2xl border p-6 gap-3 ${
        highlight
          ? "border-brand bg-card"
          : "border-border bg-card"
      }`}
    >
      {highlight ? (
        <View
          className="absolute -top-3 left-0 right-0 items-center"
          pointerEvents="none"
        >
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: palette.brand }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "#000",
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              Most popular
            </Text>
          </View>
        </View>
      ) : null}
      <Text className="text-lg font-bold text-foreground">{tier.name}</Text>
      <Text className="text-sm text-muted-foreground">{tier.tagline}</Text>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-3xl font-extrabold text-foreground">
          {tier.priceNgn === 0 ? "Free" : formatNgn(tier.priceNgn)}
        </Text>
        {tier.priceNgn > 0 ? (
          <Text className="text-sm text-muted-foreground">/month</Text>
        ) : null}
      </View>
      <View className="gap-2 mt-1">
        {tier.features.map((f) => (
          <Text key={f} className="text-sm text-foreground">
            {f}
          </Text>
        ))}
      </View>
      <View className="mt-3">
        {current ? (
          <Button variant="outline" disabled className="w-full">
            {tier.cta}
          </Button>
        ) : (
          <Button
            className="w-full bg-amber-500"
            textClassName="text-black font-semibold"
            onPress={onUpgrade}
          >
            {tier.cta} · {formatNgn(tier.priceNgn)}/mo
          </Button>
        )}
      </View>
    </View>
  );
}

export default function UpgradeScreen() {
  const palette = useTokens();
  const router = useRouter();
  const tiersQ = useQuery({
    queryKey: ["tiers"],
    queryFn: () => listTiers(),
  });

  const displayTiers = React.useMemo(
    () => (tiersQ.data ?? []).map(decorateTier),
    [tiersQ.data],
  );

  // Real premium price from the tiers API. Undefined until loaded, so the
  // payment cards never show a made-up number.
  const premiumPriceNgn = React.useMemo(
    () => tiersQ.data?.find((t) => t.id === "premium")?.priceNgn,
    [tiersQ.data],
  );

  const onUpgrade = () => {
    router.push("/(authed)/checkout?plan=premium" as never);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Upgrade" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 pt-4">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-1 active:opacity-70"
          >
            <ArrowLeft size={13} color={palette.muted} />
            <Text className="text-xs text-muted-foreground">Back</Text>
          </Pressable>
        </View>

        <View className="px-4 pt-4 gap-3 items-center">
          <Badge className="bg-amber-500/25" textClassName="text-amber-100">
            EVO TV Premium
          </Badge>
          <Text className="text-2xl font-bold text-foreground text-center">
            Watch deeper. No ads. 1080p.
          </Text>
          <Text className="text-sm text-muted-foreground text-center">
            Upgrade once, watch every tournament, anime show, and podcast
            episode across Africa in full fidelity, plus early access to EVO
            Originals and exclusive analysis from the creators you trust.
          </Text>
        </View>

        <View className="px-4 pt-8 gap-4">
          {tiersQ.isLoading ? (
            <View className="items-center py-12">
              <Spinner size="large" />
            </View>
          ) : (
            displayTiers.map((t) => (
              <TierCard
                key={t.id}
                tier={t}
                current={t.priceNgn === 0}
                highlight={t.id === "premium"}
                onUpgrade={onUpgrade}
              />
            ))
          )}
        </View>

        <Text className="text-xs text-muted-foreground text-center mt-3 px-6">
          Secure checkout via Paystack · Cancel anytime
        </Text>


        <View className="px-4 pt-10 gap-3">
          <Text className="text-base font-semibold text-foreground text-center">
            Frequently asked
          </Text>
          <View className="rounded-2xl border border-border bg-card px-4">
            <Accordion type="single" collapsible>
              {FAQ.map((f, i) => (
                <AccordionItem key={f.q} value={`q-${i}`}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent>{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
