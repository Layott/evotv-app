import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { toast } from "sonner-native";
import { Coins, Heart, Send, Trophy } from "lucide-react-native";

import { formatDate } from "@/lib/utils";

import {
  SAMPLE_STREAMERS,
  getCoinBalance,
  listAllReceivedForCurrentCreator,
  listSentTips,
  sendTip,
  topTippers,
  type Tip,
  type TopTipper,
} from "@/lib/api/tips";
import { useMockAuth } from "@/components/providers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

function TipRow({
  tip,
  perspective,
}: {
  tip: Tip;
  perspective: "sent" | "received";
}) {
  const counterparty =
    perspective === "sent"
      ? {
          handle: tip.toStreamerHandle,
          name: tip.toStreamerName,
          avatar: tip.toStreamerAvatarUrl,
        }
      : {
          handle: tip.fromHandle,
          name: tip.fromHandle.replace(/_/g, " "),
          avatar: tip.fromAvatarUrl,
        };
  return (
    <View className="flex-row items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src={counterparty.avatar} />
        <AvatarFallback>
          {counterparty.handle.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className="text-sm font-semibold text-neutral-100"
            numberOfLines={1}
          >
            {perspective === "sent" ? "→ " : "← "}
            {counterparty.name}
          </Text>
          <View className="flex-row items-center gap-1">
            <Coins size={11} color="#FCD34D" />
            <Text className="text-sm font-bold tabular-nums text-amber-300">
              {tip.amountCoins.toLocaleString()}
            </Text>
          </View>
        </View>
        {tip.message ? (
          <Text className="mt-1 text-xs text-neutral-300" numberOfLines={2}>
            "{tip.message}"
          </Text>
        ) : null}
        <Text className="mt-1 text-[10px] text-neutral-500">
          {formatDate(tip.atIso, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {tip.streamTitle ? ` · ${tip.streamTitle}` : ""}
        </Text>
      </View>
    </View>
  );
}

function TopTippersList({
  tippers,
  highlightHandle,
}: {
  tippers: TopTipper[];
  highlightHandle?: string;
}) {
  return (
    <View className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <View className="flex-row items-center gap-2">
        <Trophy size={16} color="#FCD34D" />
        <Text className="text-sm font-semibold text-neutral-100">
          Top tippers · 30 days
        </Text>
      </View>
      <View className="mt-3 gap-2">
        {tippers.length === 0 ? (
          <Text className="py-4 text-center text-xs text-neutral-500">
            No tippers yet.
          </Text>
        ) : (
          tippers.map((t, i) => {
            const me = highlightHandle && t.handle === highlightHandle;
            return (
              <View
                key={t.handle}
                className={cn(
                  "flex-row items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2",
                  me && "border-brand/40 bg-brand/5",
                )}
              >
                <Text className="w-6 text-sm font-bold text-neutral-400">
                  {i + 1}
                </Text>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={t.avatarUrl} />
                  <AvatarFallback>
                    {t.handle.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <View className="min-w-0 flex-1">
                  <Text
                    className={cn(
                      "text-sm",
                      me ? "text-brand font-semibold" : "text-neutral-100",
                    )}
                    numberOfLines={1}
                  >
                    @{t.handle}
                  </Text>
                  <Text className="text-[10px] text-neutral-500">
                    {t.tipCount} tips
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Coins size={11} color="#FCD34D" />
                  <Text className="text-sm font-bold text-amber-300">
                    {t.totalCoins.toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

function SendTipForm({
  balance,
  onSent,
}: {
  balance: number;
  onSent: (newBalance: number) => void;
}) {
  const { user } = useMockAuth();
  const [streamer, setStreamer] = React.useState(SAMPLE_STREAMERS[0]?.handle ?? "");
  const [amount, setAmount] = React.useState(100);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function onSend() {
    if (!user) {
      toast.error("Sign in first");
      return;
    }
    if (amount <= 0) {
      toast.error("Pick an amount");
      return;
    }
    if (amount > balance) {
      toast.error("Not enough EVO Coins");
      return;
    }
    setBusy(true);
    const inferred = SAMPLE_STREAMERS.find((s) => s.handle === streamer);
    const res = await sendTip(streamer, null, amount, message, {
      fromUserId: user.id,
      fromHandle: user.handle,
      fromAvatarUrl: user.avatarUrl,
      toStreamerName: inferred?.name,
      toStreamerAvatarUrl: inferred?.avatar,
    });
    setBusy(false);
    if (res.success && res.tip) {
      toast.success(`Tipped ${amount} coins to ${inferred?.name ?? streamer}`);
      setMessage("");
      onSent(res.balance ?? balance - amount);
    } else {
      toast.error(res.reason ?? "Could not send tip");
    }
  }

  return (
    <View className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <View className="flex-row items-center gap-2">
        <Send size={16} color="#7DD3FC" />
        <Text className="text-sm font-semibold text-neutral-100">
          Send a tip
        </Text>
      </View>

      <Text className="mt-3 text-[10px] uppercase tracking-wider text-neutral-500">
        Streamer
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-2"
      >
        {SAMPLE_STREAMERS.map((s) => (
          <Pressable
            key={s.handle}
            onPress={() => setStreamer(s.handle)}
            className={cn(
              "mr-2 flex-row items-center gap-2 rounded-full border px-3 py-1.5",
              streamer === s.handle
                ? "border-brand/50 bg-brand/10"
                : "border-neutral-800 bg-neutral-900",
            )}
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={s.avatar} />
              <AvatarFallback>{s.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <Text
              className={cn(
                "text-xs font-medium",
                streamer === s.handle ? "text-brand" : "text-neutral-300",
              )}
            >
              {s.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text className="mt-4 text-[10px] uppercase tracking-wider text-neutral-500">
        Amount
      </Text>
      <View className="mt-2 flex-row gap-2">
        {QUICK_AMOUNTS.map((a) => (
          <Pressable
            key={a}
            onPress={() => setAmount(a)}
            className={cn(
              "flex-1 rounded-md border py-2",
              amount === a
                ? "border-amber-500/50 bg-amber-500/10"
                : "border-neutral-800 bg-neutral-950",
            )}
          >
            <Text
              className={cn(
                "text-center text-xs font-semibold",
                amount === a ? "text-amber-300" : "text-neutral-300",
              )}
            >
              {a}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="mt-4 text-[10px] uppercase tracking-wider text-neutral-500">
        Message (optional)
      </Text>
      <Input
        className="mt-2 border-neutral-800 bg-neutral-950"
        placeholder="GG! Massive clutch!"
        value={message}
        maxLength={80}
        onChangeText={setMessage}
      />

      <Button
        className="mt-4 bg-brand"
        disabled={busy || amount <= 0 || amount > balance}
        onPress={onSend}
        textClassName="text-black"
      >
        <Heart size={14} color="#000" fill="#000" />
        {busy ? "Sending…" : `Send ${amount} coins`}
      </Button>
    </View>
  );
}

export default function TipsScreen() {
  const { user, role } = useMockAuth();
  const [sent, setSent] = React.useState<Tip[]>([]);
  const [received, setReceived] = React.useState<Tip[]>([]);
  const [tippers, setTippers] = React.useState<TopTipper[]>([]);
  const [balance, setBalance] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const canViewReceived = role === "admin" || role === "premium";

  const refresh = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [s, top, bal] = await Promise.all([
      listSentTips(user.id),
      topTippers(10),
      getCoinBalance(user.id),
    ]);
    setSent(s);
    setTippers(top);
    setBalance(bal);
    if (canViewReceived) {
      const r = await listAllReceivedForCurrentCreator();
      setReceived(r);
    }
    setLoading(false);
  }, [user, canViewReceived]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const totalSent = sent.reduce((sum, t) => sum + t.amountCoins, 0);
  const totalReceived = received.reduce((sum, t) => sum + t.amountCoins, 0);

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: "Tips" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Text className="text-sm text-neutral-400">Sign in to tip.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Tips & Cheers" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Heart size={22} color="#F472B6" fill="#F472B6" />
                <Text className="text-2xl font-bold text-neutral-50">
                  Tips & cheers
                </Text>
              </View>
              <Text className="mt-1 text-sm text-neutral-400">
                Tipping activity and the leaderboard.
              </Text>
            </View>
            <View className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2">
              <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                Balance
              </Text>
              <View className="flex-row items-center gap-1">
                <Coins size={14} color="#FCD34D" />
                <Text className="text-base font-bold text-amber-300">
                  {balance.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-5">
            <SendTipForm balance={balance} onSent={(b) => {
              setBalance(b);
              void refresh();
            }} />
          </View>

          <View className="mt-5">
            <Tabs defaultValue="sent">
              <TabsList>
                <TabsTrigger value="sent">
                  <Text className="text-sm font-medium text-neutral-300">
                    Sent ({sent.length})
                  </Text>
                </TabsTrigger>
                <TabsTrigger value="received" disabled={!canViewReceived}>
                  <Text className="text-sm font-medium text-neutral-300">
                    Received {canViewReceived ? `(${received.length})` : ""}
                  </Text>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sent">
                <View className="flex-row items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
                  <Text className="text-sm text-neutral-400">Total sent</Text>
                  <Text className="text-sm font-bold text-amber-300">
                    {totalSent.toLocaleString()} coins
                  </Text>
                </View>
                {loading ? (
                  <View className="mt-2 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                  </View>
                ) : sent.length === 0 ? (
                  <View className="mt-2 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8">
                    <Text className="text-center text-sm text-neutral-400">
                      You haven't sent any tips yet.
                    </Text>
                  </View>
                ) : (
                  <View className="mt-2 gap-2">
                    {sent.map((t) => (
                      <TipRow key={t.id} tip={t} perspective="sent" />
                    ))}
                  </View>
                )}
              </TabsContent>

              <TabsContent value="received">
                {!canViewReceived ? (
                  <View className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
                    <Text className="text-center text-sm font-semibold text-neutral-100">
                      Creator-only view
                    </Text>
                    <Text className="mt-1 text-center text-xs text-neutral-400">
                      Apply to the creator program to see fan tips.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View className="flex-row items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
                      <Text className="text-sm text-neutral-400">
                        Total received
                      </Text>
                      <Text className="text-sm font-bold text-amber-300">
                        {totalReceived.toLocaleString()} coins
                      </Text>
                    </View>
                    {loading ? (
                      <View className="mt-2 gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-20 rounded-xl" />
                        ))}
                      </View>
                    ) : (
                      <View className="mt-2 gap-2">
                        {received.map((t) => (
                          <TipRow key={t.id} tip={t} perspective="received" />
                        ))}
                      </View>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </View>

          <View className="mt-5">
            {loading ? (
              <Skeleton className="h-72 rounded-2xl" />
            ) : (
              <TopTippersList tippers={tippers} highlightHandle={user.handle} />
            )}
          </View>

          <View className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <Text className="text-sm font-semibold text-neutral-100">
              How tipping works
            </Text>
            <View className="mt-3 gap-1.5">
              <Text className="text-xs text-neutral-400">
                · Tips use EVO Coins from quests & watch-time.
              </Text>
              <Text className="text-xs text-neutral-400">
                · Streamers get 70% of every tip (creator program).
              </Text>
              <Text className="text-xs text-neutral-400">
                · Messages appear live in chat with a coin badge.
              </Text>
              <Text className="text-xs text-neutral-400">
                · No real money — coins are virtual.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
