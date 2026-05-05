import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plug, Webhook, type LucideIcon } from "lucide-react-native";

import { useMockAuth } from "@/components/providers";
import {
  INTEGRATION_CATALOG,
  listBots,
  type BotIntegration,
} from "@/lib/mock/bots";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BotIcon } from "@/components/integrations/bot-icon";
import { relativeTime } from "@/components/creators/relative-time";

interface BrandConfig {
  iconLabel: string;
  iconColor: string;
  containerClass: string;
  custom?: LucideIcon;
}

const BRAND: Record<string, BrandConfig> = {
  discord: {
    iconLabel: "D",
    iconColor: "#A5B4FC",
    containerClass: "bg-indigo-500/15 border border-indigo-500/30",
  },
  telegram: {
    iconLabel: "T",
    iconColor: "#7DD3FC",
    containerClass: "bg-sky-500/15 border border-sky-500/30",
  },
  slack: {
    iconLabel: "S",
    iconColor: "#6EE7B7",
    containerClass: "bg-emerald-500/15 border border-emerald-500/30",
  },
  twitter: {
    iconLabel: "X",
    iconColor: "#E5E5E5",
    containerClass: "bg-neutral-500/15 border border-neutral-600/40",
  },
  webhook: {
    iconLabel: "",
    iconColor: "#FCD34D",
    containerClass: "bg-amber-500/15 border border-amber-500/30",
    custom: Webhook,
  },
};

export default function IntegrationsScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";

  const botsQ = useQuery({
    queryKey: ["bots", userId],
    queryFn: () => listBots(userId),
  });

  const botsByKind = new Map<string, BotIntegration>();
  (botsQ.data ?? []).forEach((b) => botsByKind.set(b.kind, b));

  return (
    <>
      <Stack.Screen options={{ title: "Integrations" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-4 py-6 pb-24"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <View className="flex-row items-center gap-2">
            <Plug size={18} color="#2CD7E3" />
            <Text className="text-xl font-bold text-foreground">Integrations</Text>
          </View>
          <Text className="mt-1 text-sm text-muted-foreground">
            Pipe EVO TV events into the tools your community already uses.
          </Text>
        </View>

        {botsQ.isLoading ? (
          <View className="items-center justify-center py-16">
            <Spinner size="large" />
          </View>
        ) : (
          <View className="gap-4">
            {INTEGRATION_CATALOG.map((entry) => {
              const brand = BRAND[entry.kind] ?? BRAND.webhook!;
              const connected = botsByKind.get(entry.kind);
              const isAvailable = entry.status === "available";

              return (
                <View
                  key={entry.kind}
                  className="gap-4 rounded-2xl border border-border bg-card/50 p-5"
                >
                  <View className="flex-row items-start justify-between">
                    <View
                      className={`h-12 w-12 items-center justify-center rounded-xl ${brand.containerClass}`}
                    >
                      {brand.custom ? (
                        <brand.custom size={22} color={brand.iconColor} />
                      ) : (
                        <BotIcon label={brand.iconLabel} color={brand.iconColor} />
                      )}
                    </View>
                    {connected ? (
                      <View className="flex-row items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5">
                        <View className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <Text className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                          Connected
                        </Text>
                      </View>
                    ) : (
                      <Badge
                        variant="outline"
                        className={
                          isAvailable
                            ? "border-sky-500/30 bg-sky-500/10"
                            : "border-border bg-secondary"
                        }
                        textClassName={
                          (isAvailable
                            ? "text-sky-300"
                            : "text-muted-foreground") + " text-[10px]"
                        }
                      >
                        {isAvailable ? "Available" : "Coming soon"}
                      </Badge>
                    )}
                  </View>

                  <View>
                    <Text className="text-base font-semibold text-foreground">
                      {entry.label}
                    </Text>
                    <Text className="mt-1 text-sm text-muted-foreground">
                      {entry.blurb}
                    </Text>
                  </View>

                  {connected ? (
                    <View className="rounded-lg border border-border bg-background/60 p-3">
                      <View className="flex-row flex-wrap gap-3">
                        <DetailCell label="Server" value={connected.serverName} />
                        <DetailCell
                          label="Last event"
                          value={relativeTime(connected.lastEventAt)}
                        />
                        <DetailCell
                          label="Events sent"
                          value={String(connected.eventCount)}
                        />
                        <DetailCell
                          label="Connected"
                          value={relativeTime(connected.connectedAt)}
                        />
                      </View>
                    </View>
                  ) : null}

                  <View className="flex-row items-center justify-between border-t border-border pt-3">
                    <Text className="text-[11px] text-muted-foreground">
                      {connected
                        ? "Active"
                        : isAvailable
                        ? "Not connected"
                        : "Coming soon"}
                    </Text>
                    {isAvailable ? (
                      <Button
                        size="sm"
                        variant={connected ? "outline" : "default"}
                        onPress={() =>
                          router.push(
                            `/(authed)/integrations/${entry.kind}` as never,
                          )
                        }
                        className={connected ? "" : "bg-sky-500"}
                        textClassName={
                          connected
                            ? "text-foreground"
                            : "text-neutral-950 font-semibold"
                        }
                      >
                        <Text
                          className={
                            connected
                              ? "text-sm font-medium text-foreground"
                              : "text-sm font-semibold text-neutral-950"
                          }
                        >
                          {connected ? "Configure" : "Connect"}
                        </Text>
                        <ArrowRight
                          size={14}
                          color={connected ? "#FAFAFA" : "#0A0A0A"}
                        />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        <Text className="text-sm font-medium text-muted-foreground">
                          Coming soon
                        </Text>
                      </Button>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[40%] flex-1">
      <Text className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </Text>
      <Text className="mt-0.5 text-xs font-semibold text-foreground" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
