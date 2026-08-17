import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { CreditCard, BadgeCheck } from "@/components/icons";
import { toast } from "sonner-native";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/providers";
import { cancelSubscription, getActiveSubscription } from "@/lib/api";
import { formatNgn } from "@/components/profile/ngn";
import type { Subscription } from "@/lib/types";

const PROVIDER_LABELS: Record<Subscription["provider"], string> = {
  paystack: "Paystack",
  stripe: "Stripe",
  mock: "Test provider",
};

export default function BillingScreen() {
  const palette = useTokens();
  const router = useRouter();
  const { user } = useAuth();
  const [sub, setSub] = React.useState<Subscription | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cancelling, setCancelling] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const s = await getActiveSubscription(user.id);
      if (cancelled) return;
      setSub(s);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelSubscription();
      setSub(null);
      toast.success("Subscription cancelled");
    } catch (err) {
      toast.error("Couldn't cancel subscription", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Billing" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Billing" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-12"
      >
        <View className="px-4 pt-5 pb-3">
          <Text className="text-2xl font-bold text-foreground">Billing</Text>
          <Text className="text-sm text-muted-foreground">
            Subscription, payment method, and receipts.
          </Text>
        </View>

        {/* Plan card */}
        <View className="px-4">
          <View className="rounded-2xl border border-border bg-card p-5">
            <View className="flex-row items-start gap-3">
              <BadgeCheck
                size={26}
                color={sub ? "#fbbf24" : palette.muted}
              />
              <View className="flex-1">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="text-base font-semibold text-foreground">
                    {sub ? "Premium" : "Free plan"}
                  </Text>
                  {sub ? (
                    <Badge
                      className="border"
                      style={{
                        borderColor: "rgba(56,189,248,0.4)",
                        backgroundColor: "rgba(56,189,248,0.15)",
                      }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: "#7dd3fc" }}
                      >
                        Active
                      </Text>
                    </Badge>
                  ) : null}
                </View>

                {sub ? (
                  <>
                    <Text className="mt-1 text-sm text-foreground">
                      {formatNgn(sub.priceNgn)}/mo
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      Next charge{" "}
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </Text>
                  </>
                ) : (
                  <Text className="mt-1 text-sm text-foreground">
                    Upgrade for ad-free, 1080p and early VOD access.
                  </Text>
                )}

                <View className="mt-4 flex-row flex-wrap gap-2">
                  <Button
                    onPress={() => router.push("/(public)/upgrade")}
                    className="bg-brand"
                    textClassName="text-black"
                  >
                    {sub ? "Change plan" : "Upgrade"}
                  </Button>
                  {sub ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" disabled={cancelling}>
                          {cancelling ? "Cancelling…" : "Cancel subscription"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Premium?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Your Premium access ends immediately and your
                            account returns to the Free plan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Premium</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive"
                            onPress={() => void handleCancel()}
                          >
                            Confirm cancel
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Payment method */}
        {sub ? (
          <View className="mt-4 px-4">
            <View className="rounded-2xl border border-border bg-card p-5">
              <Text className="text-base font-semibold text-foreground">
                Payment method
              </Text>
              <Text className="text-sm text-muted-foreground">
                Managed securely via {PROVIDER_LABELS[sub.provider]}.
              </Text>
              <View className="mt-4 flex-row items-center gap-3 rounded-xl border border-border bg-background p-4">
                <CreditCard size={24} color="#00C3F7" />
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    {PROVIDER_LABELS[sub.provider]}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Billed automatically each period
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* History */}
        <View className="mt-4 px-4">
          <View className="rounded-2xl border border-border bg-card p-5">
            <Text className="text-base font-semibold text-foreground">
              Payment history
            </Text>

            <View className="mt-3 overflow-hidden rounded-xl border border-border">
              <View className="flex-row items-center bg-background px-3 py-2">
                <Text className="flex-1 text-[11px] text-muted-foreground">
                  Date
                </Text>
                <Text
                  className="text-[11px] text-muted-foreground"
                  style={{ width: 110 }}
                >
                  Reference
                </Text>
                <Text
                  className="text-[11px] text-muted-foreground text-right"
                  style={{ width: 90 }}
                >
                  Amount
                </Text>
                <Text
                  className="text-[11px] text-muted-foreground text-right"
                  style={{ width: 60 }}
                >
                  Status
                </Text>
              </View>
              {!sub ? (
                <View className="px-3 py-6">
                  <Text className="text-sm text-muted-foreground">
                    No payments yet.
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center px-3 py-3">
                  <Text
                    className="flex-1 text-xs text-foreground"
                    numberOfLines={1}
                  >
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </Text>
                  <Text
                    className="font-mono text-[11px] text-muted-foreground"
                    style={{ width: 110 }}
                    numberOfLines={1}
                  >
                    {sub.providerSubId || PROVIDER_LABELS[sub.provider]}
                  </Text>
                  <Text
                    className="text-xs font-semibold text-foreground text-right"
                    style={{ width: 90 }}
                  >
                    {formatNgn(sub.priceNgn)}
                  </Text>
                  <View style={{ width: 60 }} className="items-end">
                    <Badge
                      className="border"
                      style={{
                        borderColor: "rgba(56,189,248,0.4)",
                        backgroundColor: "rgba(56,189,248,0.15)",
                      }}
                    >
                      <Text
                        className="text-[10px] font-medium"
                        style={{ color: "#7dd3fc" }}
                      >
                        Paid
                      </Text>
                    </Badge>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
