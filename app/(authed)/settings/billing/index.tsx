import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { CreditCard, Crown } from "lucide-react-native";
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
import { useMockAuth } from "@/components/providers";
import { getActiveSubscription } from "@/lib/mock";
import { formatNgn } from "@/components/profile/ngn";
import type { Subscription } from "@/lib/types";

interface HistoryRow {
  date: string;
  amount: number;
  ref: string;
}

export default function BillingScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const [sub, setSub] = React.useState<Subscription | null>(null);
  const [loading, setLoading] = React.useState(true);

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

  const history: HistoryRow[] = sub
    ? [
        {
          date: new Date(sub.createdAt).toLocaleDateString(),
          amount: sub.priceNgn,
          ref: "PS_2026_02",
        },
        {
          date: new Date(Date.now() - 31 * 86400000).toLocaleDateString(),
          amount: sub.priceNgn,
          ref: "PS_2026_01",
        },
        {
          date: new Date(Date.now() - 62 * 86400000).toLocaleDateString(),
          amount: sub.priceNgn,
          ref: "PS_2025_12",
        },
      ]
    : [];

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
              <Crown
                size={26}
                color={sub ? "#fbbf24" : "#525252"}
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
                        <Button variant="outline">Cancel subscription</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Premium?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Your Premium benefits stay active until{" "}
                            {new Date(sub.currentPeriodEnd).toLocaleDateString()}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Premium</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive"
                            onPress={() =>
                              toast.success("Subscription cancelled")
                            }
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
        <View className="mt-4 px-4">
          <View className="rounded-2xl border border-border bg-card p-5">
            <Text className="text-base font-semibold text-foreground">
              Payment method
            </Text>
            <Text className="text-sm text-muted-foreground">
              Managed securely via Paystack.
            </Text>
            <View className="mt-4 flex-row items-center gap-3 rounded-xl border border-border bg-background p-4">
              <CreditCard size={24} color="#00C3F7" />
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  <Text style={{ color: "#00C3F7" }}>Paystack</Text> · Visa ····
                  4242
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Expires 09 / 27
                </Text>
              </View>
              <Button
                variant="outline"
                size="sm"
                onPress={() => toast("Paystack portal coming soon")}
              >
                <Text className="text-sm font-medium text-foreground">
                  Update
                </Text>
              </Button>
            </View>
          </View>
        </View>

        {/* History */}
        <View className="mt-4 px-4">
          <View className="rounded-2xl border border-border bg-card p-5">
            <Text className="text-base font-semibold text-foreground">
              Payment history
            </Text>

            <View className="mt-3 overflow-hidden rounded-xl border border-border">
              <View className="flex-row items-center bg-background px-3 py-2">
                <Text className="flex-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Date
                </Text>
                <Text
                  className="text-[11px] uppercase tracking-wider text-muted-foreground"
                  style={{ width: 110 }}
                >
                  Reference
                </Text>
                <Text
                  className="text-[11px] uppercase tracking-wider text-muted-foreground text-right"
                  style={{ width: 90 }}
                >
                  Amount
                </Text>
                <Text
                  className="text-[11px] uppercase tracking-wider text-muted-foreground text-right"
                  style={{ width: 60 }}
                >
                  Status
                </Text>
              </View>
              {history.length === 0 ? (
                <View className="px-3 py-6">
                  <Text className="text-sm text-muted-foreground">
                    No payments yet.
                  </Text>
                </View>
              ) : (
                history.map((h, i) => (
                  <View
                    key={h.ref}
                    className={`flex-row items-center px-3 py-3 ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <Text
                      className="flex-1 text-xs text-foreground"
                      numberOfLines={1}
                    >
                      {h.date}
                    </Text>
                    <Text
                      className="font-mono text-[11px] text-muted-foreground"
                      style={{ width: 110 }}
                      numberOfLines={1}
                    >
                      {h.ref}
                    </Text>
                    <Text
                      className="text-xs font-semibold text-foreground text-right"
                      style={{ width: 90 }}
                    >
                      {formatNgn(h.amount)}
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
                ))
              )}
            </View>
          </View>
        </View>

        {/* Quick action: mobile money */}
        <View className="mt-4 px-4">
          <Pressable
            onPress={() => router.push("/(authed)/checkout/mobile-money")}
            className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:opacity-80"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(44,215,227,0.12)" }}
            >
              <CreditCard size={18} color="#2CD7E3" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                Pay with Mobile Money
              </Text>
              <Text className="text-xs text-muted-foreground">
                M-Pesa, MTN MoMo, Airtel Money — STK push
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
