import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  CheckCircle2,
  Copy,
  PhoneCall,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react-native";
import { toast } from "sonner-native";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ProviderTile } from "@/components/payment-methods/provider-tile";
import { useMockAuth } from "@/components/providers";
import { formatNgn } from "@/components/profile/ngn";
import {
  initMobileMoney,
  listPaymentProviders,
  pollAttempt,
  type PaymentAttempt,
  type PaymentProvider,
} from "@/lib/mock/payment-methods";

type Phase = "select" | "waiting" | "success" | "failed";

const DEFAULT_AMOUNT = 4_500;

export default function MobileMoneyCheckoutScreen() {
  const router = useRouter();
  const { user } = useMockAuth();

  const [providers, setProviders] = React.useState<PaymentProvider[] | null>(
    null,
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState("");
  const [forceFail, setForceFail] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("select");
  const [attempt, setAttempt] = React.useState<PaymentAttempt | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const amount = DEFAULT_AMOUNT;

  React.useEffect(() => {
    let cancelled = false;
    void listPaymentProviders().then((list) => {
      if (cancelled) return;
      const mm = list.filter((p) => p.kind === "mobile-money");
      setProviders(mm);
      if (mm.length > 0) setSelectedId(mm[0]!.id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = React.useMemo(
    () => providers?.find((p) => p.id === selectedId) ?? null,
    [providers, selectedId],
  );

  // Poll while waiting
  React.useEffect(() => {
    if (phase !== "waiting" || !attempt) return;
    let cancelled = false;
    const tick = async () => {
      const updated = await pollAttempt(attempt.ref);
      if (cancelled || !updated) return;
      setAttempt(updated);
      if (updated.status === "success") {
        setPhase("success");
        toast.success("Payment confirmed");
      } else if (updated.status === "failed") {
        setPhase("failed");
        toast.error(updated.failureReason ?? "Payment failed");
      }
    };
    const timer = setInterval(() => {
      void tick();
    }, 1000);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [phase, attempt]);

  const phoneOk = /^\+?[0-9 ()-]{8,}$/.test(phone.trim());

  async function startPayment() {
    if (!selected || !phoneOk) {
      toast.error("Enter a valid phone number");
      return;
    }
    setSubmitting(true);
    try {
      const a = await initMobileMoney(
        selected.id,
        phone.trim(),
        amount,
        {
          forceFail,
          userId: user?.id ?? "user_current",
        },
      );
      setAttempt(a);
      setPhase("waiting");
      toast(`STK push sent to ${phone.trim()}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start payment";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setPhase("select");
    setAttempt(null);
  }

  return (
    <>
      <Stack.Screen options={{ title: "Mobile Money" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-5">
          <View className="mb-2 flex-row flex-wrap items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                Pay with Mobile Money
              </Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                Confirm your subscription with M-Pesa, MTN MoMo, or Airtel
                Money. We'll send a prompt to your phone.
              </Text>
            </View>
            <Badge
              className="border"
              style={{
                borderColor: "rgba(245,158,11,0.4)",
                backgroundColor: "rgba(245,158,11,0.1)",
              }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: "#fcd34d" }}
              >
                Premium · {formatNgn(amount)}
              </Text>
            </Badge>
          </View>
        </View>

        {phase === "select" ? (
          <View className="mt-4 gap-4 px-4">
            {/* Providers */}
            <View className="rounded-2xl border border-border bg-card p-5">
              <Text className="mb-3 text-base font-semibold text-foreground">
                Choose a provider
              </Text>
              {providers === null ? (
                <View className="gap-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                  ))}
                </View>
              ) : providers.length === 0 ? (
                <View className="rounded-xl border border-dashed border-border p-6">
                  <Text className="text-center text-sm text-muted-foreground">
                    No mobile money providers available right now.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {providers.map((p) => (
                    <ProviderTile
                      key={p.id}
                      provider={p}
                      selected={p.id === selectedId}
                      onPress={() => setSelectedId(p.id)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Phone */}
            <View className="rounded-2xl border border-border bg-card p-5">
              <Text className="mb-3 text-base font-semibold text-foreground">
                Phone number
              </Text>
              <View className="gap-1.5">
                <Label>Mobile number registered with the provider</Label>
                <Input
                  keyboardType="phone-pad"
                  placeholder="+254 712 345 678"
                  autoComplete="tel"
                  value={phone}
                  onChangeText={setPhone}
                  className="bg-background"
                />
                {!phoneOk && phone.length > 0 ? (
                  <Text className="text-xs" style={{ color: "#f87171" }}>
                    Enter a valid phone number
                  </Text>
                ) : (
                  <Text className="text-xs text-muted-foreground">
                    We'll send an STK push prompt — approve it on your phone.
                  </Text>
                )}
              </View>
              <View className="mt-4 flex-row items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Force-fail mode
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Toggle on to simulate a customer cancellation. Useful for
                    testing.
                  </Text>
                </View>
                <Switch
                  checked={forceFail}
                  onCheckedChange={setForceFail}
                />
              </View>
            </View>

            {/* Order summary */}
            <View className="rounded-2xl border border-border bg-card p-5">
              <Text className="text-base font-semibold text-foreground">
                Order summary
              </Text>
              <View className="mt-3 gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">Plan</Text>
                  <Text className="text-sm text-foreground">
                    EVO TV Premium
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">
                    Subtotal
                  </Text>
                  <Text className="text-sm text-foreground">
                    {formatNgn(amount)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">
                    Provider fee
                  </Text>
                  <Text className="text-sm text-foreground">
                    {selected ? `₦${selected.feeNgn.toLocaleString()}` : "—"}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between border-t border-border pt-2">
                  <Text className="text-base font-bold text-foreground">
                    Total
                  </Text>
                  <Text className="text-base font-bold text-foreground">
                    {formatNgn(amount + (selected?.feeNgn ?? 0))}
                  </Text>
                </View>
              </View>
              <View className="mt-4 rounded-xl border border-border bg-background p-3">
                <Text className="text-xs font-semibold text-foreground">
                  How it works
                </Text>
                <View className="mt-2 gap-1">
                  <Text className="text-xs text-muted-foreground">
                    1. Pick a provider
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    2. Enter your number
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    3. Approve the STK push
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    4. Premium unlocks instantly
                  </Text>
                </View>
              </View>
            </View>

            <Button
              onPress={startPayment}
              disabled={submitting || !selected || !phoneOk}
              size="lg"
              className="bg-brand"
              textClassName="text-black"
            >
              {submitting ? (
                <Spinner size="small" />
              ) : (
                <PhoneCall size={16} color="#0A0A0A" />
              )}
              <Text className="text-sm font-medium text-black">
                {submitting
                  ? "Sending prompt..."
                  : selected
                    ? `Send ${selected.name} request — ${formatNgn(amount)}`
                    : "Send request"}
              </Text>
            </Button>

            <View className="flex-row items-center justify-center gap-1.5">
              <ShieldCheck size={14} color="#2CD7E3" />
              <Text className="text-[11px] text-muted-foreground">
                Your phone number is only used to send the STK push.
              </Text>
            </View>
          </View>
        ) : null}

        {phase === "waiting" && attempt && selected ? (
          <WaitingState
            attempt={attempt}
            provider={selected}
            phone={phone}
            onCancel={reset}
          />
        ) : null}

        {phase === "success" && attempt ? (
          <SuccessState
            attempt={attempt}
            onDone={() => router.replace("/(authed)/settings/billing")}
          />
        ) : null}

        {phase === "failed" && attempt ? (
          <FailedState attempt={attempt} onRetry={reset} />
        ) : null}
      </ScrollView>
    </>
  );
}

function WaitingState({
  attempt,
  provider,
  phone,
  onCancel,
}: {
  attempt: PaymentAttempt;
  provider: PaymentProvider;
  phone: string;
  onCancel: () => void;
}) {
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    const start = new Date(attempt.createdAt).getTime();
    const tick = () => setElapsed(Math.max(0, Date.now() - start));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [attempt.createdAt]);
  const seconds = Math.floor(elapsed / 1000);
  const remainingSec = Math.max(
    0,
    Math.ceil((attempt.durationMs - elapsed) / 1000),
  );

  const ACCENT_BG: Record<string, string> = {
    mpesa: "rgba(16,185,129,0.15)",
    "mtn-momo": "rgba(245,158,11,0.15)",
    "airtel-money": "rgba(239,68,68,0.15)",
    "paystack-card": "rgba(44,215,227,0.15)",
  };

  return (
    <View className="mx-4 mt-4 items-center rounded-2xl border border-border bg-card p-8">
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: ACCENT_BG[provider.id] ?? "#262626" }}
      >
        <Smartphone size={32} color="#FAFAFA" />
      </View>
      <Text className="text-xl font-bold text-foreground">
        Check your phone
      </Text>
      <Text className="mt-1.5 text-center text-sm text-muted-foreground">
        We sent a {provider.name} prompt to{" "}
        <Text className="text-foreground">{phone}</Text>. Approve it within{" "}
        {remainingSec}s.
      </Text>
      <View className="mt-6 w-full max-w-sm flex-row items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
        <Spinner size="small" />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            Awaiting confirmation...
          </Text>
          <Text className="text-xs text-muted-foreground">
            Elapsed {seconds}s · Ref {attempt.ref}
          </Text>
        </View>
      </View>
      <Button
        variant="outline"
        onPress={onCancel}
        className="mt-6 w-full"
      >
        Cancel and choose another method
      </Button>
    </View>
  );
}

function SuccessState({
  attempt,
  onDone,
}: {
  attempt: PaymentAttempt;
  onDone: () => void;
}) {
  const router = useRouter();

  const handleCopy = () => {
    // RN copy-to-clipboard requires expo-clipboard, not bundled here. Keep the
    // affordance and surface the ref via toast so the user can read it.
    toast.success(`Reference: ${attempt.ref}`);
  };

  return (
    <View
      className="mx-4 mt-4 items-center rounded-2xl border p-8"
      style={{
        borderColor: "rgba(16,185,129,0.3)",
        backgroundColor: "rgba(16,185,129,0.05)",
      }}
    >
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: "rgba(16,185,129,0.15)",
          borderWidth: 1,
          borderColor: "rgba(16,185,129,0.4)",
        }}
      >
        <CheckCircle2 size={36} color="#6ee7b7" />
      </View>
      <Text className="text-xl font-bold text-foreground">
        Payment confirmed
      </Text>
      <Text className="mt-1.5 text-center text-sm text-muted-foreground">
        {attempt.providerLabel} approved your payment of{" "}
        <Text className="font-semibold text-foreground">
          {formatNgn(attempt.amountNgn)}
        </Text>
        . Premium is now active.
      </Text>
      <View className="mt-5 w-full max-w-sm rounded-xl border border-border bg-background p-3">
        <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Reference
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Text
            className="flex-1 font-mono text-sm text-foreground"
            numberOfLines={1}
          >
            {attempt.ref}
          </Text>
          <Pressable
            onPress={handleCopy}
            accessibilityLabel="Copy reference"
            className="h-8 w-8 items-center justify-center rounded-md border border-border active:opacity-70"
          >
            <Copy size={12} color="#A3A3A3" />
          </Pressable>
        </View>
      </View>
      <View className="mt-6 w-full flex-row gap-2">
        <Button
          variant="outline"
          onPress={() => router.replace("/(public)/home")}
          className="flex-1"
        >
          Back to home
        </Button>
        <Button
          onPress={onDone}
          className="flex-1 bg-brand"
          textClassName="text-black"
        >
          Open billing
        </Button>
      </View>
    </View>
  );
}

function FailedState({
  attempt,
  onRetry,
}: {
  attempt: PaymentAttempt;
  onRetry: () => void;
}) {
  const router = useRouter();
  return (
    <View
      className="mx-4 mt-4 items-center rounded-2xl border p-8"
      style={{
        borderColor: "rgba(239,68,68,0.3)",
        backgroundColor: "rgba(239,68,68,0.05)",
      }}
    >
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: "rgba(239,68,68,0.15)",
          borderWidth: 1,
          borderColor: "rgba(239,68,68,0.4)",
        }}
      >
        <XCircle size={36} color="#fca5a5" />
      </View>
      <Text className="text-xl font-bold text-foreground">
        Payment did not complete
      </Text>
      <Text className="mt-1.5 text-center text-sm text-muted-foreground">
        {attempt.failureReason ?? "The provider could not confirm the charge."}{" "}
        You haven't been billed.
      </Text>
      <View className="mt-5 w-full max-w-sm rounded-xl border border-border bg-background p-3">
        <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Reference
        </Text>
        <Text
          className="mt-1 font-mono text-sm text-foreground"
          numberOfLines={1}
        >
          {attempt.ref}
        </Text>
      </View>
      <View className="mt-6 w-full flex-row gap-2">
        <Button
          variant="outline"
          onPress={() => router.replace("/(public)/upgrade")}
          className="flex-1"
        >
          Choose another method
        </Button>
        <Button
          onPress={onRetry}
          className="flex-1 bg-brand"
          textClassName="text-black"
        >
          Try again
        </Button>
      </View>
    </View>
  );
}
