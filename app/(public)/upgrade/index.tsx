import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "@/components/icons";

import { listTiers, type Tier } from "@/lib/api/subs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Upgrade.
 *
 * This was three columns with a "Most popular" flag on the middle one, which
 * is the pricing-table shape the no-vibecoded-look rule bans by name, and it
 * was also dishonest in two ways.
 *
 * The flag claimed a fact nobody has measured: there is no data on which plan
 * sells, so "most popular" was decoration wearing the clothes of evidence.
 *
 * And the ladder flattened two different decisions into one row. Supporter and
 * Premium are a viewer choosing how much of the ads to remove. Pro is a creator
 * buying analytics, an ingest slot and API access - a different person, a
 * different reason, eight times the price. Putting them side by side asks a
 * viewer to compare a plan that is not for them, which is exactly what makes a
 * three-tier table read as a template rather than a page about this product.
 *
 * So the page is ordered by who is reading it: what you already have, then the
 * two viewer plans as full-width rows, then a separate section for creators.
 * No columns, no flag, no checkmarks.
 */

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Your benefits continue to the end of the period you have paid for, and nothing renews after that.",
  },
  {
    q: "Which payment methods work?",
    a: "Card and bank transfer through Paystack. Card details never touch EVO TV's servers.",
  },
  {
    q: "What happens to my account if I stop paying?",
    a: "Nothing is deleted. You drop back to Free, keep your follows, watch history and profile, and the ads come back.",
  },
  {
    q: "Do I need to pay to chat?",
    a: "No. Chat is free on every stream. Paid plans add a badge and access to premium-only rooms.",
  },
];

function formatNgn(n: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * One plan, full width.
 *
 * The price and the name share a line because they are one fact, and the
 * feature list sits under them as plain sentences. `emphasis` fills the surface
 * a step brighter for the plan the page is actually recommending, which is a
 * fill rather than a badge or a ring.
 */
function PlanRow({
  tier,
  emphasis,
  onPress,
}: {
  tier: Tier;
  emphasis?: boolean;
  onPress: () => void;
}) {
  return (
    <View
      className={`rounded-2xl p-5 gap-3 ${emphasis ? "bg-brand/15" : "bg-card"}`}
    >
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="text-lg font-bold text-foreground">{tier.name}</Text>
        <View className="flex-row items-baseline gap-1">
          <Text className="text-2xl font-bold text-foreground">
            {formatNgn(tier.priceNgn)}
          </Text>
          <Text className="text-xs text-muted-foreground">/month</Text>
        </View>
      </View>

      <View className="gap-1.5">
        {tier.features.map((f) => (
          <Text key={f} className="text-sm text-muted-foreground leading-5">
            {f}
          </Text>
        ))}
      </View>

      <Button
        className={`w-full mt-1 ${emphasis ? "bg-brand" : "bg-secondary"}`}
        textClassName={
          emphasis ? "text-primary-foreground font-semibold" : "text-foreground font-semibold"
        }
        onPress={onPress}
      >
        {tier.cta}
      </Button>
    </View>
  );
}

export default function UpgradeScreen() {
  const palette = useTokens();
  const router = useRouter();
  const tiersQ = useQuery({ queryKey: ["tiers"], queryFn: () => listTiers() });

  const tiers = tiersQ.data ?? [];
  const free = tiers.find((t) => t.id === "free");
  // Split by who the plan is for rather than by price. Anything that is not
  // free and not the creator plan is a viewer plan, so a new middle tier
  // appears here on its own without a code change.
  const viewerPlans = tiers.filter((t) => t.priceNgn > 0 && t.id !== "pro");
  const creatorPlan = tiers.find((t) => t.id === "pro");

  const goToCheckout = (planId: string) => {
    router.push(`/(authed)/checkout?plan=${planId}` as never);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Upgrade" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 40 }}
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

        <View className="px-4 pt-6 gap-2">
          <Text className="text-2xl font-bold text-foreground">
            Watch without the ads
          </Text>
          <Text className="text-sm text-muted-foreground leading-5">
            Every stream, show and VOD is free to watch. Paying removes the ads,
            opens the premium chat rooms, and gets you VOD drops before they go
            out to everyone.
          </Text>
        </View>

        {/* `isPending`, not `isLoading`. In React Query v5 `isLoading` is
            `isPending && isFetching`, so between two retries of a failing
            request all three of isLoading, isError and data are falsy at once
            and the page fell straight through to the success branch with an
            empty array: no plans, no spinner, no error, just a heading and an
            FAQ. Caught by loading the screen against an origin the API does not
            allow, which is what a phone on a bad connection looks like. */}
        {tiersQ.isPending ? (
          <View className="items-center py-16">
            <Spinner size="large" />
          </View>
        ) : tiersQ.isError || viewerPlans.length === 0 ? (
          <View className="px-4 pt-10 gap-3">
            <Text className="text-base font-semibold text-foreground">
              Plans are not loading
            </Text>
            <Text className="text-sm text-muted-foreground leading-5">
              We could not reach the server. Everything on EVO TV is still free
              to watch while this is down.
            </Text>
            <Button
              className="bg-secondary self-start"
              textClassName="text-foreground font-semibold"
              onPress={() => tiersQ.refetch()}
            >
              Try again
            </Button>
          </View>
        ) : (
          <>
            {/* What you already have. A line, not a card: Free is the state
                you are in, not a product on sale. */}
            {free ? (
              <View className="px-4 pt-6">
                {/* Sentence case, not an uppercase eyebrow. The owner ruled
                    those out along with the rest of the template furniture. */}
                <Text className="text-xs text-muted-foreground">
                  You are on {free.name}
                </Text>
                <Text className="text-sm text-foreground mt-1 leading-5">
                  {free.tagline}
                </Text>
              </View>
            ) : null}

            <View className="px-4 pt-6 gap-3">
              {viewerPlans.map((t) => (
                <PlanRow
                  key={t.id}
                  tier={t}
                  emphasis={t.id === "premium"}
                  onPress={() => goToCheckout(t.id)}
                />
              ))}
            </View>

            <Text className="text-xs text-muted-foreground text-center mt-4 px-6">
              Paystack handles the payment. Cancel any time.
            </Text>

            {/* Creators, kept apart on purpose. Same data, different reader. */}
            {creatorPlan ? (
              <View className="px-4 pt-12 gap-3">
                <Text className="text-base font-semibold text-foreground">
                  Streaming on EVO TV?
                </Text>
                <Text className="text-sm text-muted-foreground leading-5">
                  {creatorPlan.tagline}
                </Text>
                <PlanRow
                  tier={creatorPlan}
                  onPress={() => goToCheckout(creatorPlan.id)}
                />
              </View>
            ) : null}
          </>
        )}

        <View className="px-4 pt-12 gap-3">
          <Text className="text-base font-semibold text-foreground">
            Frequently asked
          </Text>
          <View className="rounded-2xl bg-card px-4">
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
