import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { toast } from "sonner-native";
import {
  Calendar,
  Coins,
  Gift,
  History,
  Loader2,
  Sparkles,
  Trophy,
} from "lucide-react-native";

import {
  getXpAndTier,
  listDrops,
  redeemDrop,
  type Drop,
  type XpTierInfo,
} from "@/lib/api/rewards";
import {
  claimQuest,
  listDailyQuests,
  type DailyQuest,
} from "@/lib/mock/rewards";
import { ApiError } from "@/lib/api/_client";
import { useMockAuth } from "@/components/providers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { DropCard, TierBadge } from "@/components/engagement/drop-card";
import { cn } from "@/lib/utils";

function RewardsHero({ info }: { info: XpTierInfo }) {
  return (
    <View className="overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br p-5">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-[10px] uppercase tracking-wider text-neutral-400">
            EVO Rewards
          </Text>
          <View className="mt-2 flex-row items-center gap-2">
            <Coins size={26} color="#FCD34D" />
            <Text className="text-3xl font-extrabold text-amber-300">
              {info.coinsBalance.toLocaleString()}
            </Text>
          </View>
          <Text className="mt-1 text-xs text-neutral-400">EVO Coins</Text>
        </View>
        <View className="items-end gap-1">
          <TierBadge tier={info.tier} />
          <Text className="text-[10px] text-neutral-500">
            {info.totalXp.toLocaleString()} XP
          </Text>
        </View>
      </View>

      <View className="mt-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-neutral-400">
            {info.tier} → {info.nextTier ?? "Max tier"}
          </Text>
          <Text className="text-xs font-semibold text-neutral-200">
            {info.progressPct}%
          </Text>
        </View>
        <Progress className="mt-2 h-2" value={info.progressPct} />
        <Text className="mt-1 text-[10px] text-neutral-500">
          {info.pointsToNextTier.toLocaleString()} XP to next tier
        </Text>
      </View>
    </View>
  );
}

function QuestRow({
  quest,
  userId,
  onChange,
}: {
  quest: DailyQuest;
  userId: string;
  onChange: (next: DailyQuest, delta: { coins: number; xp: number }) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const pct = Math.min(
    100,
    Math.round((quest.progress / quest.target) * 100),
  );
  const complete = quest.progress >= quest.target;

  async function onClaim() {
    setBusy(true);
    const res = await claimQuest(quest.id, userId);
    setBusy(false);
    if (res.success) {
      toast.success(`+${res.rewardCoins} coins, +${res.rewardXp} XP`);
      onChange({ ...quest, claimed: true }, {
        coins: res.rewardCoins,
        xp: res.rewardXp,
      });
    } else {
      toast.error(res.reason ?? "Could not claim");
    }
  }

  return (
    <View className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-neutral-100">
            {quest.label}
          </Text>
          <Text className="mt-0.5 text-[11px] text-neutral-400" numberOfLines={2}>
            {quest.description}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <View className="flex-row items-center gap-1">
            <Coins size={11} color="#FCD34D" />
            <Text className="text-xs font-bold text-amber-300">
              +{quest.rewardCoins}
            </Text>
          </View>
          <Text className="text-[10px] text-neutral-500">
            +{quest.rewardXp} XP
          </Text>
        </View>
      </View>
      <Progress className="mt-2 h-1.5" value={pct} />
      <View className="mt-1 flex-row items-center justify-between">
        <Text className="text-[10px] text-neutral-500">
          {quest.progress} / {quest.target} {quest.unit}
        </Text>
        {quest.claimed ? (
          <Text className="text-[10px] text-emerald-300">Claimed</Text>
        ) : complete ? (
          <Button
            size="sm"
            className="bg-amber-500"
            disabled={busy}
            onPress={onClaim}
            textClassName="text-amber-950"
          >
            {busy ? "Claiming…" : "Claim"}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const [info, setInfo] = React.useState<XpTierInfo | null>(null);
  const [quests, setQuests] = React.useState<DailyQuest[]>([]);
  const [drops, setDrops] = React.useState<Drop[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pendingDrop, setPendingDrop] = React.useState<Drop | null>(null);
  const [redeeming, setRedeeming] = React.useState(false);
  const [successCode, setSuccessCode] = React.useState<{
    code: string;
    drop: Drop;
  } | null>(null);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [tierInfo, q, d] = await Promise.all([
        getXpAndTier(user.id),
        listDailyQuests(user.id),
        listDrops(),
      ]);
      if (cancelled) return;
      setInfo(tierInfo);
      setQuests(q);
      setDrops(d);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function performRedeem() {
    if (!user || !pendingDrop) return;
    setRedeeming(true);
    const redeemed = pendingDrop;
    try {
      const redemption = await redeemDrop(redeemed.id, user.id);
      setDrops((prev) =>
        prev.map((d) =>
          d.id === redeemed.id ? { ...d, stock: Math.max(0, d.stock - 1) } : d,
        ),
      );
      setInfo((prev) =>
        prev
          ? { ...prev, coinsBalance: prev.coinsBalance - redeemed.cost }
          : prev,
      );
      setSuccessCode({ code: redemption.code, drop: redeemed });
      setPendingDrop(null);
      toast.success(`Redeemed: ${redeemed.name}`);
    } catch (err) {
      const msg =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Redemption failed";
      toast.error(msg);
    } finally {
      setRedeeming(false);
    }
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Loader2 size={24} color="#525252" />
      </View>
    );
  }

  const todayDrops = drops.slice(0, 6);

  return (
    <>
      <Stack.Screen options={{ title: "Rewards" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-end justify-between gap-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-neutral-50">Rewards</Text>
              <Text className="mt-1 text-sm text-neutral-400">
                Watch, complete quests, level up.
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-800"
                onPress={() => router.push("/rewards/store")}
                textClassName="text-neutral-200"
              >
                <Gift size={13} color="#FAFAFA" />
                Store
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-800"
                onPress={() => router.push("/rewards/history")}
                textClassName="text-neutral-200"
              >
                <History size={13} color="#FAFAFA" />
                History
              </Button>
            </View>
          </View>

          {loading || !info ? (
            <View className="mt-5 gap-3">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </View>
          ) : (
            <View className="mt-5 gap-5">
              <RewardsHero info={info} />

              <View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Calendar size={16} color="#7DD3FC" />
                    <Text className="text-base font-semibold text-neutral-100">
                      Today's drops
                    </Text>
                  </View>
                  <Pressable onPress={() => router.push("/rewards/store")}>
                    <Text className="text-xs text-brand">See all →</Text>
                  </Pressable>
                </View>
                <View className="mt-3 gap-3">
                  {todayDrops.map((drop) => (
                    <DropCard
                      key={drop.id}
                      drop={drop}
                      balance={info.coinsBalance}
                      onRedeem={(d) => setPendingDrop(d)}
                    />
                  ))}
                </View>
              </View>

              <View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Sparkles size={16} color="#FCD34D" />
                    <Text className="text-base font-semibold text-neutral-100">
                      Daily quests
                    </Text>
                  </View>
                  <Badge variant="outline">
                    <Text className="text-[10px] text-neutral-400">
                      Resets in 24h
                    </Text>
                  </Badge>
                </View>
                <View className="mt-3 gap-2">
                  {quests.map((q) => (
                    <QuestRow
                      key={q.id}
                      quest={q}
                      userId={user.id}
                      onChange={(next, delta) => {
                        setQuests((prev) =>
                          prev.map((x) => (x.id === next.id ? next : x)),
                        );
                        setInfo((prev) =>
                          prev
                            ? {
                                ...prev,
                                coinsBalance: prev.coinsBalance + delta.coins,
                                totalXp: prev.totalXp + delta.xp,
                              }
                            : prev,
                        );
                      }}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Confirm redemption */}
      <Dialog
        open={!!pendingDrop}
        onOpenChange={(o) => !o && setPendingDrop(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem {pendingDrop?.name}?</DialogTitle>
            <DialogDescription>
              {pendingDrop?.cost.toLocaleString()} EVO Coins will be deducted.
              Redemptions cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          {pendingDrop ? (
            <View className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
              <Text className="text-xs text-neutral-500">
                Balance after redemption
              </Text>
              <Text className="mt-1 text-lg font-bold text-amber-300">
                {Math.max(
                  0,
                  (info?.coinsBalance ?? 0) - pendingDrop.cost,
                ).toLocaleString()}{" "}
                <Text className="text-xs font-normal text-neutral-500">
                  EVO Coins
                </Text>
              </Text>
            </View>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              className="flex-1 border-neutral-700"
              onPress={() => setPendingDrop(null)}
              textClassName="text-neutral-200"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-amber-500"
              disabled={redeeming}
              onPress={performRedeem}
              textClassName="text-amber-950"
            >
              {redeeming ? "…" : "Confirm redeem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success code */}
      <Dialog
        open={!!successCode}
        onOpenChange={(o) => !o && setSuccessCode(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redemption successful</DialogTitle>
            <DialogDescription>{successCode?.drop.name}</DialogDescription>
          </DialogHeader>
          {successCode ? (
            <View className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <Text className="text-center text-[10px] uppercase tracking-[0.3em] text-amber-300">
                Redemption code
              </Text>
              <Text className="mt-2 text-center font-mono text-lg font-bold text-amber-100">
                {successCode.code}
              </Text>
            </View>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              className="flex-1 border-neutral-700"
              onPress={() => {
                setSuccessCode(null);
                router.push("/rewards/history");
              }}
              textClassName="text-neutral-200"
            >
              View history
            </Button>
            <Button
              className="flex-1 bg-brand"
              onPress={() => setSuccessCode(null)}
              textClassName="text-black"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
