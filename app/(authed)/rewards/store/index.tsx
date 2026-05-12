import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { toast } from "sonner-native";
import { Coins, Loader2, Search, Sparkles } from "lucide-react-native";

import {
  getXpAndTier,
  listDrops,
  redeemDrop,
  type Drop,
  type DropKind,
  type XpTierInfo,
} from "@/lib/api/rewards";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DropCard, TierBadge } from "@/components/engagement/drop-card";
import { cn } from "@/lib/utils";

const KIND_TABS: Array<{ value: "all" | DropKind; label: string }> = [
  { value: "all", label: "All" },
  { value: "cosmetic", label: "In-game" },
  { value: "premium-trial", label: "Premium" },
  { value: "merch-voucher", label: "Vouchers" },
];

type SortKey = "featured" | "low" | "high" | "new";

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "low", label: "Cost ↑" },
  { value: "high", label: "Cost ↓" },
  { value: "new", label: "Newest" },
];

export default function RewardsStoreScreen() {
  const { user } = useMockAuth();
  const [info, setInfo] = React.useState<XpTierInfo | null>(null);
  const [drops, setDrops] = React.useState<Drop[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [kind, setKind] = React.useState<"all" | DropKind>("all");
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [sort, setSort] = React.useState<SortKey>("featured");
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
      const [tierInfo, d] = await Promise.all([
        getXpAndTier(user.id),
        listDrops(),
      ]);
      if (cancelled) return;
      setInfo(tierInfo);
      setDrops(d);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    drops.forEach((d) => set.add(d.category));
    return Array.from(set).sort();
  }, [drops]);

  const filtered = React.useMemo(() => {
    let list = drops.slice();
    if (kind !== "all") list = list.filter((d) => d.kind === kind);
    if (category !== "all") list = list.filter((d) => d.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.partner.toLowerCase().includes(q),
      );
    }
    if (sort === "low") list.sort((a, b) => a.cost - b.cost);
    else if (sort === "high") list.sort((a, b) => b.cost - a.cost);
    else if (sort === "new")
      list.sort((a, b) =>
        (b.expiresAt ?? "").localeCompare(a.expiresAt ?? ""),
      );
    return list;
  }, [drops, kind, category, search, sort]);

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

  return (
    <>
      <Stack.Screen options={{ title: "Drops Store" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-end justify-between gap-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-neutral-50">
                Drops store
              </Text>
              <Text className="mt-1 text-sm text-neutral-400">
                Spend EVO Coins on in-game items, premium trials, and merch.
              </Text>
            </View>
            {info ? (
              <View className="flex-row items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2">
                <TierBadge tier={info.tier} size="sm" />
                <View className="flex-row items-center gap-1">
                  <Coins size={14} color="#FCD34D" />
                  <Text className="text-base font-bold text-amber-300">
                    {info.coinsBalance.toLocaleString()}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <Tabs
            value={kind}
            onValueChange={(v) => setKind(v as typeof kind)}
            className="mt-5"
          >
            <TabsList>
              {KIND_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  <Text className="text-sm font-medium text-neutral-300">
                    {t.label}
                  </Text>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <View className="mt-3 flex-row items-center gap-2">
            <View className="relative flex-1">
              <View className="absolute left-2 top-2.5 z-10">
                <Search size={14} color="#A3A3A3" />
              </View>
              <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Search drops or partners"
                className="border-neutral-800 bg-neutral-900 pl-8"
              />
            </View>
          </View>

          <Text className="mt-4 text-[10px] uppercase tracking-wider text-neutral-500">
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2"
          >
            <Pressable
              onPress={() => setCategory("all")}
              className={cn(
                "mr-2 rounded-full border px-3 py-1.5",
                category === "all"
                  ? "border-brand/50 bg-brand/10"
                  : "border-neutral-800 bg-neutral-900",
              )}
            >
              <Text
                className={cn(
                  "text-xs font-medium",
                  category === "all" ? "text-brand" : "text-neutral-400",
                )}
              >
                All
              </Text>
            </Pressable>
            {categories.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                className={cn(
                  "mr-2 rounded-full border px-3 py-1.5",
                  category === c
                    ? "border-brand/50 bg-brand/10"
                    : "border-neutral-800 bg-neutral-900",
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-medium",
                    category === c ? "text-brand" : "text-neutral-400",
                  )}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text className="mt-4 text-[10px] uppercase tracking-wider text-neutral-500">
            Sort
          </Text>
          <View className="mt-2 flex-row gap-2">
            {SORT_OPTIONS.map((s) => (
              <Pressable
                key={s.value}
                onPress={() => setSort(s.value)}
                className={cn(
                  "flex-1 rounded-md border py-2",
                  sort === s.value
                    ? "border-brand/50 bg-brand/10"
                    : "border-neutral-800 bg-neutral-900",
                )}
              >
                <Text
                  className={cn(
                    "text-center text-xs font-medium",
                    sort === s.value ? "text-brand" : "text-neutral-400",
                  )}
                >
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="mt-3 text-xs text-neutral-500">
            {filtered.length} drops
          </Text>

          {loading ? (
            <View className="mt-3 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </View>
          ) : filtered.length === 0 ? (
            <View className="mt-3 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10">
              <View className="items-center">
                <Sparkles size={36} color="#525252" />
              </View>
              <Text className="mt-3 text-center text-sm font-semibold text-neutral-200">
                No drops match these filters.
              </Text>
            </View>
          ) : (
            <View className="mt-3 gap-3">
              {filtered.map((drop) => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  balance={info?.coinsBalance ?? 0}
                  onRedeem={(d) => setPendingDrop(d)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Dialog
        open={!!pendingDrop}
        onOpenChange={(o) => !o && setPendingDrop(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem {pendingDrop?.name}?</DialogTitle>
            <DialogDescription>
              {pendingDrop?.cost.toLocaleString()} EVO Coins will be deducted.
            </DialogDescription>
          </DialogHeader>
          {pendingDrop ? (
            <View className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-neutral-500">Cost</Text>
                <Text className="text-amber-300">
                  {pendingDrop.cost.toLocaleString()} coins
                </Text>
              </View>
              <View className="mt-1 flex-row items-center justify-between">
                <Text className="text-xs text-neutral-500">Balance after</Text>
                <Text className="text-neutral-200">
                  {Math.max(
                    0,
                    (info?.coinsBalance ?? 0) - pendingDrop.cost,
                  ).toLocaleString()}{" "}
                  coins
                </Text>
              </View>
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
                Code
              </Text>
              <Text className="mt-2 text-center font-mono text-lg font-bold text-amber-100">
                {successCode.code}
              </Text>
            </View>
          ) : null}
          <DialogFooter>
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
