import * as React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Plus, Search, Trash2, X } from "lucide-react-native";
import { toast } from "sonner-native";

import { ads as adsSource } from "@/lib/mock/ads";
import type { Ad, AdPlacement } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatDate, formatNumber } from "./utils";

const PLACEMENTS: { value: AdPlacement; label: string }[] = [
  { value: "home_banner", label: "Home banner" },
  { value: "stream_preroll", label: "Stream preroll" },
  { value: "sidebar", label: "Sidebar" },
  { value: "between_content", label: "Between content" },
];

function placementLabel(p: AdPlacement) {
  return PLACEMENTS.find((x) => x.value === p)?.label ?? p;
}

export function AdsManagerPage() {
  const [all, setAll] = React.useState<Ad[]>(() => [...adsSource]);
  const [search, setSearch] = React.useState("");
  const [placementFilter, setPlacementFilter] =
    React.useState<string>("all");
  const [editing, setEditing] = React.useState<Ad | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<Ad | null>(null);

  const filtered = React.useMemo(() => {
    let rows = all;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((a) => a.advertiser.toLowerCase().includes(q));
    }
    if (placementFilter !== "all")
      rows = rows.filter((a) => a.placement === placementFilter);
    return rows;
  }, [all, search, placementFilter]);

  function handleToggleActive(id: string, active: boolean) {
    setAll((prev) => prev.map((a) => (a.id === id ? { ...a, active } : a)));
    toast.success(active ? "Ad activated" : "Ad paused");
  }

  function handleSave(ad: Ad) {
    setAll((prev) => {
      const exists = prev.some((a) => a.id === ad.id);
      return exists ? prev.map((a) => (a.id === ad.id ? ad : a)) : [ad, ...prev];
    });
    toast.success(editing ? "Ad updated" : "Ad created");
    setEditing(null);
    setCreateOpen(false);
  }

  function handleDelete() {
    if (!confirmDelete) return;
    setAll((prev) => prev.filter((a) => a.id !== confirmDelete.id));
    toast.success(`Deleted ${confirmDelete.advertiser}`);
    setConfirmDelete(null);
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Ads"
          description="Campaign creatives, placements, performance."
          actions={
            <Button
              className="bg-cyan-500"
              onPress={() => setCreateOpen(true)}
            >
              <Plus size={14} color="#000" />
              <Text className="text-sm font-medium text-black">New</Text>
            </Button>
          }
        />

        <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
          <Search size={14} color="#A3A3A3" />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search advertiser"
            className="h-9 flex-1 border-0 bg-transparent px-0"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setPlacementFilter("all")}
              className={`rounded-full border px-3 py-1 ${
                placementFilter === "all"
                  ? "border-cyan-500 bg-cyan-500/10"
                  : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-xs ${
                  placementFilter === "all"
                    ? "text-cyan-300"
                    : "text-muted-foreground"
                }`}
              >
                All
              </Text>
            </Pressable>
            {PLACEMENTS.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => setPlacementFilter(p.value)}
                className={`rounded-full border px-3 py-1 ${
                  placementFilter === p.value
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-border bg-card"
                }`}
              >
                <Text
                  className={`text-xs ${
                    placementFilter === p.value
                      ? "text-cyan-300"
                      : "text-muted-foreground"
                  }`}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text className="mb-2 text-xs text-muted-foreground">
          {filtered.length} campaigns
        </Text>

        {filtered.map((row) => {
          const ctr =
            row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
          return (
            <Pressable
              key={row.id}
              onPress={() => setEditing(row)}
              className="mb-2 rounded-xl border border-border bg-card/40 p-3"
            >
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-20 overflow-hidden rounded bg-muted">
                  <Image
                    source={row.mediaUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">
                    {row.advertiser}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-xs text-muted-foreground"
                  >
                    {row.clickUrl}
                  </Text>
                  <View className="mt-1 flex-row gap-1.5">
                    <StatusBadge tone="violet">
                      {placementLabel(row.placement)}
                    </StatusBadge>
                    {row.active ? (
                      <StatusBadge tone="emerald" dot>
                        Active
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Paused</StatusBadge>
                    )}
                  </View>
                </View>
              </View>
              <View className="mt-2 flex-row items-center gap-3">
                <Stat label="Impr" value={formatNumber(row.impressions)} />
                <Stat label="Clicks" value={formatNumber(row.clicks)} />
                <Stat label="CTR" value={`${ctr.toFixed(1)}%`} />
                <View className="ml-auto flex-row items-center gap-2">
                  <Switch
                    checked={row.active}
                    onCheckedChange={(v) => handleToggleActive(row.id, v)}
                  />
                  <Pressable
                    onPress={() => setConfirmDelete(row)}
                    hitSlop={8}
                  >
                    <Trash2 size={16} color="#A3A3A3" />
                  </Pressable>
                </View>
              </View>
              <Text className="mt-1 text-[10px] text-muted-foreground">
                {formatDate(row.startAt)} — {formatDate(row.endAt)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {(editing || createOpen) && (
        <AdForm
          initial={editing}
          onClose={() => {
            setEditing(null);
            setCreateOpen(false);
          }}
          onSave={handleSave}
        />
      )}

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete ad?</DialogTitle>
            <DialogDescription>
              Permanently remove campaign from {confirmDelete?.advertiser}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onPress={() => setConfirmDelete(null)}>
              <Text className="text-sm text-foreground">Cancel</Text>
            </Button>
            <Button variant="destructive" onPress={handleDelete}>
              <Text className="text-sm text-white">Delete</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-[10px] text-muted-foreground">{label}</Text>
      <Text
        className="text-xs text-foreground"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
    </View>
  );
}

function AdForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Ad | null;
  onClose: () => void;
  onSave: (ad: Ad) => void;
}) {
  const [form, setForm] = React.useState<Ad>(
    initial ?? {
      id: `ad_new_${Date.now()}`,
      placement: "home_banner",
      mediaUrl: "/placeholder.svg?height=200&width=1200&text=New+Creative",
      clickUrl: "https://example.com",
      advertiser: "",
      active: true,
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      weight: 100,
      impressions: 0,
      clicks: 0,
    },
  );

  const disabled = !form.advertiser.trim() || !form.clickUrl.trim();

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/50">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[92%] rounded-t-2xl border border-border bg-background"
        >
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View className="mb-4 flex-row items-start justify-between">
              <Text className="text-lg font-semibold text-foreground">
                {initial ? "Edit ad" : "New ad"}
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={20} color="#A3A3A3" />
              </Pressable>
            </View>

            <Text className="mb-1.5 text-xs text-muted-foreground">
              Creative
            </Text>
            <View className="mb-3 overflow-hidden rounded-lg border border-border bg-card">
              <Image
                source={form.mediaUrl}
                style={{ width: "100%", aspectRatio: 6 }}
                contentFit="cover"
              />
            </View>
            <Input
              value={form.mediaUrl}
              onChangeText={(v) => setForm({ ...form, mediaUrl: v })}
              className="mb-3 bg-card"
              placeholder="Media URL"
            />

            <Text className="mb-1.5 text-xs text-muted-foreground">
              Advertiser
            </Text>
            <Input
              value={form.advertiser}
              onChangeText={(v) => setForm({ ...form, advertiser: v })}
              className="mb-3 bg-card"
            />

            <Text className="mb-1.5 text-xs text-muted-foreground">
              Click URL
            </Text>
            <Input
              value={form.clickUrl}
              onChangeText={(v) => setForm({ ...form, clickUrl: v })}
              className="mb-3 bg-card"
            />

            <Text className="mb-1.5 text-xs text-muted-foreground">
              Placement
            </Text>
            <View className="mb-3 flex-row flex-wrap gap-1.5">
              {PLACEMENTS.map((p) => (
                <Pressable
                  key={p.value}
                  onPress={() => setForm({ ...form, placement: p.value })}
                  className={`rounded-md border px-2.5 py-1.5 ${
                    form.placement === p.value
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-border bg-card"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      form.placement === p.value
                        ? "text-cyan-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mb-1.5 text-xs text-muted-foreground">
              Weight: {form.weight}
            </Text>
            <View className="mb-3 flex-row gap-1.5">
              {[25, 50, 100, 150, 200].map((w) => (
                <Pressable
                  key={w}
                  onPress={() => setForm({ ...form, weight: w })}
                  className={`flex-1 rounded-md border px-2 py-1.5 ${
                    form.weight === w
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-border bg-card"
                  }`}
                >
                  <Text
                    className={`text-center text-xs ${
                      form.weight === w
                        ? "text-cyan-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {w}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row items-center justify-between rounded-lg border border-border bg-card/40 p-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">
                  Active
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Campaign is eligible to serve.
                </Text>
              </View>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </View>

            <View className="mt-5 flex-row gap-2">
              <Button variant="outline" className="flex-1" onPress={onClose}>
                <Text className="text-sm text-foreground">Cancel</Text>
              </Button>
              <Button
                disabled={disabled}
                className="flex-1 bg-cyan-500"
                onPress={() => onSave(form)}
              >
                <Text className="text-sm font-medium text-black">Save ad</Text>
              </Button>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
