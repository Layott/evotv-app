import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { toast } from "sonner-native";
import {
  CheckCircle2,
  Copy,
  Delete,
  Loader2,
  Phone,
  ShieldCheck,
  Timer,
  XCircle,
} from "lucide-react-native";

import {
  listUssdProviders,
  pollUssdSession,
  startUssdSession,
  type UssdProvider,
  type UssdProviderId,
  type UssdSession,
} from "@/lib/mock/ussd";
import { useMockAuth } from "@/components/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const AMOUNT = 4_500;

const KEYPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

function formatNgn(n: number): string {
  return `₦${n.toLocaleString()}`;
}

function copy(_s: string, label: string) {
  // expo-clipboard isn't installed — surface label to user as a no-op.
  toast.success(`${label}: ${_s}`);
}

function ProviderCard({
  provider,
  selected,
  onPress,
}: {
  provider: UssdProvider;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-1 flex-col items-center gap-2 rounded-xl border bg-neutral-950 p-4",
        selected ? "border-brand/60" : "border-neutral-800",
      )}
    >
      <View
        className={cn(
          "h-10 w-10 items-center justify-center rounded-lg",
          provider.id === "mtn"
            ? "bg-amber-500/15"
            : provider.id === "airtel"
              ? "bg-red-500/15"
              : provider.id === "glo"
                ? "bg-emerald-500/15"
                : "bg-brand/15",
        )}
      >
        <Text
          className={cn(
            "text-base font-extrabold",
            provider.id === "mtn"
              ? "text-amber-300"
              : provider.id === "airtel"
                ? "text-red-300"
                : provider.id === "glo"
                  ? "text-emerald-300"
                  : "text-brand",
          )}
        >
          {provider.name.slice(0, 1)}
        </Text>
      </View>
      <Text className="text-sm font-semibold text-neutral-100">
        {provider.name}
      </Text>
      <Text className="font-mono text-[10px] text-neutral-400">
        {provider.shortCode}
      </Text>
    </Pressable>
  );
}

function Keypad({
  display,
  onKey,
  onBackspace,
}: {
  display: string;
  onKey: (k: string) => void;
  onBackspace: () => void;
}) {
  return (
    <View className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <View className="rounded-lg bg-black px-3 py-3">
        <Text className="text-right font-mono text-xl text-emerald-300">
          {display || "*XXX#"}
        </Text>
      </View>
      <View className="mt-3 gap-2">
        {KEYPAD.map((row, ri) => (
          <View key={ri} className="flex-row gap-2">
            {row.map((k) => (
              <Pressable
                key={k}
                onPress={() => onKey(k)}
                className="flex-1 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 py-4 active:bg-neutral-800"
              >
                <Text className="text-xl font-bold text-neutral-100">{k}</Text>
              </Pressable>
            ))}
          </View>
        ))}
        <Pressable
          onPress={onBackspace}
          className="items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 py-3"
        >
          <Delete size={18} color="#A3A3A3" />
        </Pressable>
      </View>
    </View>
  );
}

export default function UssdScreen() {
  const { user } = useMockAuth();
  const [providers, setProviders] = React.useState<UssdProvider[] | null>(null);
  const [providerId, setProviderId] = React.useState<UssdProviderId | null>(null);
  const [session, setSession] = React.useState<UssdSession | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [dialed, setDialed] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    listUssdProviders().then((list) => {
      if (cancelled) return;
      setProviders(list);
      if (list.length > 0) setProviderId(list[0]!.id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll while awaiting
  React.useEffect(() => {
    if (!session || session.status !== "awaiting") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    async function tick() {
      const next = await pollUssdSession(session!.code);
      if (cancelled || !next) return;
      setSession(next);
      if (next.status === "confirmed") {
        toast.success("USSD payment confirmed");
        return;
      }
      if (next.status === "expired") {
        toast.error("Session expired");
        return;
      }
      timer = setTimeout(tick, 5000);
    }
    timer = setTimeout(tick, 5000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [session]);

  async function handleStart() {
    if (!providerId) return;
    setLoading(true);
    try {
      const s = await startUssdSession(
        providerId,
        AMOUNT,
        user?.id ?? "user_current",
      );
      setSession(s);
      setDialed(s.shortCode);
      toast(`Code generated. Dial ${s.shortCode}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSession(null);
    setDialed("");
  }

  const selected = providers?.find((p) => p.id === providerId) ?? null;

  return (
    <>
      <Stack.Screen options={{ title: "Pay by USSD" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-neutral-50">
                Pay by USSD
              </Text>
              <Text className="mt-1 text-sm text-neutral-400">
                Dial a code, type your linking code, your account upgrades.
              </Text>
            </View>
            <Badge className="border border-amber-500/40 bg-amber-500/10">
              <Text className="text-xs font-bold text-amber-300">
                Premium · {formatNgn(AMOUNT)}
              </Text>
            </Badge>
          </View>

          {!session ? (
            <>
              {/* Provider grid */}
              <View className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
                <Text className="text-sm font-semibold text-neutral-100">
                  Pick your network
                </Text>
                {providers === null ? (
                  <View className="mt-3 flex-row gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 flex-1 rounded-xl" />
                    ))}
                  </View>
                ) : (
                  <>
                    <View className="mt-3 flex-row gap-2">
                      {providers.slice(0, 2).map((p) => (
                        <ProviderCard
                          key={p.id}
                          provider={p}
                          selected={providerId === p.id}
                          onPress={() => setProviderId(p.id)}
                        />
                      ))}
                    </View>
                    <View className="mt-2 flex-row gap-2">
                      {providers.slice(2, 4).map((p) => (
                        <ProviderCard
                          key={p.id}
                          provider={p}
                          selected={providerId === p.id}
                          onPress={() => setProviderId(p.id)}
                        />
                      ))}
                    </View>
                  </>
                )}
              </View>

              {/* Keypad */}
              <Text className="mt-4 text-sm font-semibold text-neutral-100">
                Dial the code
              </Text>
              <Text className="mt-0.5 text-[11px] text-neutral-500">
                Practice the dial — when ready, generate a linking code.
              </Text>
              <View className="mt-3">
                <Keypad
                  display={dialed}
                  onKey={(k) => setDialed((d) => (d.length < 24 ? d + k : d))}
                  onBackspace={() => setDialed((d) => d.slice(0, -1))}
                />
                <View className="mt-2 flex-row gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-neutral-800"
                    onPress={() =>
                      selected && setDialed(selected.shortCode)
                    }
                    textClassName="text-neutral-200"
                  >
                    Auto-fill {selected?.shortCode ?? ""}
                  </Button>
                </View>
              </View>

              {/* How it works */}
              <View className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
                <Text className="text-sm font-semibold text-neutral-100">
                  How it works
                </Text>
                <View className="mt-3 gap-2">
                  {(selected?.steps ?? []).map((step, i) => (
                    <View key={i} className="flex-row items-start gap-3">
                      <View className="h-6 w-6 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950">
                        <Text className="text-xs font-bold text-brand">
                          {i + 1}
                        </Text>
                      </View>
                      <Text className="flex-1 text-sm text-neutral-300">
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <Button
                className="mt-4 bg-brand"
                disabled={!providerId || loading}
                onPress={handleStart}
                textClassName="text-black"
              >
                {loading ? <Loader2 size={16} color="#000" /> : <Phone size={16} color="#000" />}
                {loading ? "Starting…" : "Generate linking code"}
              </Button>

              {/* Why USSD */}
              <View className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
                <Text className="text-sm font-semibold text-neutral-100">
                  Why USSD?
                </Text>
                <View className="mt-3 gap-2">
                  {[
                    "Works without internet",
                    "Settle from your airtime balance",
                    "One-time charge, no card needed",
                  ].map((why) => (
                    <View key={why} className="flex-row items-start gap-2">
                      <ShieldCheck size={14} color="#7DD3FC" />
                      <Text className="flex-1 text-sm text-neutral-300">
                        {why}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : session.status === "confirmed" ? (
            <View className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <View className="items-center">
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
                  <CheckCircle2 size={36} color="#34D399" />
                </View>
              </View>
              <Text className="mt-4 text-center text-xl font-bold text-neutral-50">
                Premium activated
              </Text>
              <Text className="mt-1 text-center text-sm text-neutral-400">
                {session.providerLabel} confirmed your{" "}
                <Text className="text-neutral-200">
                  {formatNgn(session.amountNgn)}
                </Text>{" "}
                payment.
              </Text>
              <View className="mx-auto mt-5 max-w-xs rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                  Linking code
                </Text>
                <Text className="mt-1 font-mono text-base text-neutral-100">
                  {session.code}
                </Text>
              </View>
              <Button
                className="mt-5 bg-brand"
                onPress={reset}
                textClassName="text-black"
              >
                Done
              </Button>
            </View>
          ) : session.status === "expired" ? (
            <View className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <View className="items-center">
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15">
                  <XCircle size={36} color="#F87171" />
                </View>
              </View>
              <Text className="mt-4 text-center text-xl font-bold text-neutral-50">
                Session expired
              </Text>
              <Text className="mt-1 text-center text-sm text-neutral-400">
                The 15-minute window passed. Start a new session to try again.
              </Text>
              <Button
                className="mt-5 bg-brand"
                onPress={reset}
                textClassName="text-black"
              >
                Start new session
              </Button>
            </View>
          ) : (
            <AwaitingPanel
              session={session}
              provider={selected}
              onReset={reset}
            />
          )}
        </View>
      </ScrollView>
    </>
  );
}

function AwaitingPanel({
  session,
  provider,
  onReset,
}: {
  session: UssdSession;
  provider: UssdProvider | null;
  onReset: () => void;
}) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const expiresIn = Math.max(0, new Date(session.expiresAt).getTime() - now);
  const mm = Math.floor(expiresIn / 60_000)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor((expiresIn % 60_000) / 1_000)
    .toString()
    .padStart(2, "0");

  return (
    <>
      <View className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-brand/15">
            <Text className="text-lg font-extrabold text-brand">
              {session.providerLabel.slice(0, 1)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
              Dial now
            </Text>
            <Text className="font-mono text-2xl font-bold text-neutral-50">
              {session.shortCode}
            </Text>
          </View>
          <Pressable
            onPress={() => copy(session.shortCode, "Short code")}
            className="rounded-md border border-neutral-800 bg-neutral-950 p-2"
          >
            <Copy size={14} color="#A3A3A3" />
          </Pressable>
        </View>
      </View>

      <View className="mt-3 rounded-2xl border border-brand/40 bg-brand/5 p-4">
        <Text className="text-[10px] uppercase tracking-wider text-brand">
          Your linking code
        </Text>
        <View className="mt-2 flex-row items-center gap-3">
          <Text className="font-mono text-3xl font-extrabold tracking-[0.4em] text-neutral-50">
            {session.code}
          </Text>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto border-neutral-800"
            onPress={() => copy(session.code, "Linking code")}
            textClassName="text-neutral-200"
          >
            <Copy size={12} color="#FAFAFA" />
            Copy
          </Button>
        </View>
        <Text className="mt-3 text-xs text-neutral-400">
          When the {session.providerLabel} menu asks for a code, type the digits
          above.
        </Text>
      </View>

      <View className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
        <Text className="text-sm font-semibold text-neutral-100">
          Step by step
        </Text>
        <View className="mt-3 gap-2">
          {(provider?.steps ?? []).map((step, i) => (
            <View key={i} className="flex-row items-start gap-3">
              <View className="h-6 w-6 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950">
                <Text className="text-xs font-bold text-brand">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-sm text-neutral-300">{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-3 flex-row gap-2">
        <View className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
          <View className="flex-row items-center gap-2">
            <Loader2 size={14} color="#7DD3FC" />
            <Text className="text-sm font-semibold text-neutral-100">
              Checking…
            </Text>
          </View>
          <Text className="mt-1 text-[11px] text-neutral-400">
            Polling every 5s.
          </Text>
        </View>
        <View className="flex-1 rounded-xl border border-amber-500/20 bg-neutral-900/40 p-3">
          <View className="flex-row items-center gap-2">
            <Timer size={14} color="#FCD34D" />
            <Text className="text-sm font-semibold text-amber-300">
              {mm}:{ss}
            </Text>
          </View>
          <Text className="mt-1 text-[11px] text-neutral-500">
            Expires in
          </Text>
        </View>
      </View>

      <Button
        variant="outline"
        className="mt-4 border-neutral-800"
        onPress={onReset}
        textClassName="text-neutral-300"
      >
        Cancel and pick another network
      </Button>
    </>
  );
}
