import * as React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import {
  AlertTriangle,
  Eye,
  ScanLine,
  Search,
  ShieldCheck,
  X,
} from "lucide-react-native";
import { toast } from "sonner-native";
import Svg, { Rect } from "react-native-svg";

import {
  listForensicMarks,
  getForensicMark,
  searchForensicMarksByCode,
  type ForensicAction,
  type ForensicMark,
} from "@/lib/mock/forensic";
import { listLiveStreams } from "@/lib/api/streams";
import type { Stream } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { timeAgo } from "./utils";

const ACTION_TONES: Record<
  ForensicAction,
  "neutral" | "amber" | "red" | "violet"
> = {
  none: "neutral",
  warned: "amber",
  "session-revoked": "amber",
  "account-suspended": "red",
  "legal-takedown": "violet",
};

const ACTION_LABELS: Record<ForensicAction, string> = {
  none: "No action",
  warned: "Warned",
  "session-revoked": "Session revoked",
  "account-suspended": "Account suspended",
  "legal-takedown": "Legal takedown",
};

const SOURCE_LABELS: Record<ForensicMark["source"], string> = {
  "telegram-leak": "Telegram leak",
  "twitter-clip": "Twitter clip",
  "torrent-tracker": "Torrent tracker",
  "youtube-mirror": "YouTube mirror",
};

export function ForensicPage() {
  const [marks, setMarks] = React.useState<ForensicMark[] | null>(null);
  const [streams, setStreams] = React.useState<Stream[]>([]);
  const [streamFilter, setStreamFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [openMark, setOpenMark] = React.useState<ForensicMark | null>(null);

  React.useEffect(() => {
    listLiveStreams().then(setStreams);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setMarks(null);
    listForensicMarks(streamFilter === "all" ? undefined : streamFilter).then(
      (list) => {
        if (!cancelled) setMarks(list);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [streamFilter]);

  const filteredMarks = React.useMemo(() => {
    if (!marks) return [];
    if (!search.trim()) return marks;
    const q = search.toLowerCase().replace(/[-\s]/g, "");
    return marks.filter(
      (m) =>
        m.code.toLowerCase().replace(/-/g, "").includes(q) ||
        m.userHandle.toLowerCase().includes(q) ||
        m.sessionId.toLowerCase().includes(q),
    );
  }, [marks, search]);

  React.useEffect(() => {
    if (!openId) {
      setOpenMark(null);
      return;
    }
    let cancelled = false;
    getForensicMark(openId).then((m) => {
      if (!cancelled) setOpenMark(m);
    });
    return () => {
      cancelled = true;
    };
  }, [openId]);

  async function searchByCode() {
    if (!search.trim()) return;
    const list = await searchForensicMarksByCode(search.trim());
    if (list.length === 0) {
      toast.info("No matching watermark");
      return;
    }
    toast.success(`${list.length} match${list.length === 1 ? "" : "es"}`);
  }

  const stats = React.useMemo(() => {
    const list = marks ?? [];
    return {
      total: list.length,
      pending: list.filter(
        (m) => m.action === "none" || m.action === "warned",
      ).length,
      legal: list.filter((m) => m.action === "legal-takedown").length,
    };
  }, [marks]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Forensic watermark"
          description="Per-session manifests embed a unique code so leaks trace back to the originating viewer."
          actions={
            <StatusBadge tone="emerald" dot>
              Live tracing
            </StatusBadge>
          }
        />

        <View className="flex-row flex-wrap gap-3">
          <StatCard
            icon={ShieldCheck}
            label="Marks (30d)"
            value={stats.total.toString()}
            tone="emerald"
          />
          <StatCard
            icon={Eye}
            label="Pending"
            value={stats.pending.toString()}
            tone="amber"
          />
          <StatCard
            icon={AlertTriangle}
            label="Legal"
            value={stats.legal.toString()}
            tone="red"
          />
        </View>

        <View className="mt-5 rounded-xl border border-border bg-card/40 p-4">
          <Text className="mb-3 text-sm font-semibold text-foreground">
            How it works
          </Text>
          <View className="gap-2">
            {[
              {
                n: "1",
                title: "Per-session manifest",
                body: "Each viewer gets a slightly-shifted HLS variant; ads are encoded with a unique fingerprint.",
              },
              {
                n: "2",
                title: "Detect & match",
                body: "Crawlers scan Telegram, Twitter, torrents — fingerprint match surfaces the originating session.",
              },
              {
                n: "3",
                title: "Action",
                body: "Mod team revokes the session, suspends the account, or escalates to legal.",
              },
            ].map((step) => (
              <View
                key={step.n}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <View className="flex-row items-center gap-2">
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20">
                    <Text className="text-[10px] font-bold text-cyan-300">
                      {step.n}
                    </Text>
                  </View>
                  <Text className="text-sm text-foreground">{step.title}</Text>
                </View>
                <Text className="mt-1 text-xs text-muted-foreground">
                  {step.body}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-5">
          <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
            <Search size={14} color="#A3A3A3" />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search code, handle, session…"
              className="h-9 flex-1 border-0 bg-transparent px-0"
            />
            <Pressable
              onPress={searchByCode}
              hitSlop={8}
              className="rounded-md bg-cyan-500 px-2.5 py-1"
            >
              <ScanLine size={14} color="#000" />
            </Pressable>
          </View>

          <Text className="mb-1.5 text-xs text-muted-foreground">Stream</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            <View className="flex-row gap-1.5">
              <Pressable
                onPress={() => setStreamFilter("all")}
                className={`rounded-full border px-3 py-1 ${
                  streamFilter === "all"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-border bg-card"
                }`}
              >
                <Text
                  className={`text-xs ${
                    streamFilter === "all"
                      ? "text-cyan-300"
                      : "text-muted-foreground"
                  }`}
                >
                  All streams
                </Text>
              </Pressable>
              {streams.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setStreamFilter(s.id)}
                  className={`rounded-full border px-3 py-1 ${
                    streamFilter === s.id
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-border bg-card"
                  }`}
                >
                  <Text
                    numberOfLines={1}
                    className={`text-xs ${
                      streamFilter === s.id
                        ? "text-cyan-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {marks === null ? (
            <Text className="text-sm text-muted-foreground">Loading…</Text>
          ) : filteredMarks.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border p-6">
              <Text className="text-center text-sm text-muted-foreground">
                No watermark captures match this filter.
              </Text>
            </View>
          ) : null}

          {filteredMarks.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => setOpenId(row.id)}
              className="mb-2 rounded-xl border border-border bg-card/40 p-3"
            >
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="font-mono text-[11px] text-foreground">
                    {row.sessionId}
                  </Text>
                  <Text className="font-mono text-[10px] text-muted-foreground">
                    @{row.userHandle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-1 text-sm text-foreground"
                  >
                    {row.streamTitle}
                  </Text>
                  <Text className="mt-0.5 font-mono text-[10px] text-cyan-300">
                    {row.code}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <StatusBadge tone={ACTION_TONES[row.action]}>
                    {ACTION_LABELS[row.action]}
                  </StatusBadge>
                  <Text className="text-[10px] text-muted-foreground">
                    {Math.round(row.matchConfidence * 100)}%
                  </Text>
                  <Text className="text-[10px] text-muted-foreground">
                    {timeAgo(row.capturedAt)}
                  </Text>
                </View>
              </View>
              <Text className="mt-1 text-[10px] text-muted-foreground">
                Source: {SOURCE_LABELS[row.source]}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={!!openId}
        transparent
        animationType="slide"
        onRequestClose={() => setOpenId(null)}
      >
        <Pressable
          onPress={() => setOpenId(null)}
          className="flex-1 justify-end bg-black/50"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="max-h-[90%] rounded-t-2xl border border-border bg-background"
          >
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <View className="mb-4 flex-row items-start justify-between">
                <View>
                  <Text className="text-lg font-semibold text-foreground">
                    Watermark capture
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted-foreground">
                    Forensic detail. Drill in to confirm before action.
                  </Text>
                </View>
                <Pressable onPress={() => setOpenId(null)} hitSlop={8}>
                  <X size={20} color="#A3A3A3" />
                </Pressable>
              </View>

              {openMark ? (
                <View>
                  <View className="rounded-xl border border-border bg-background/60 p-4">
                    <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Code
                    </Text>
                    <Text className="mt-1 font-mono text-base text-cyan-300">
                      {openMark.code}
                    </Text>
                  </View>

                  <ManifestVisual code={openMark.code} />

                  <Section label="Session">
                    <DetailRow
                      label="ID"
                      value={openMark.sessionId}
                      mono
                    />
                    <DetailRow
                      label="User"
                      value={`@${openMark.userHandle} (${openMark.userId})`}
                    />
                    <DetailRow label="Stream" value={openMark.streamTitle} />
                  </Section>

                  <Section label="Detection">
                    <DetailRow
                      label="Source"
                      value={SOURCE_LABELS[openMark.source]}
                    />
                    <DetailRow
                      label="Confidence"
                      value={`${Math.round(openMark.matchConfidence * 100)}%`}
                    />
                    <DetailRow
                      label="Captured"
                      value={timeAgo(openMark.capturedAt)}
                    />
                  </Section>

                  <Section label="Action taken">
                    <View className="flex-row items-center gap-2">
                      <StatusBadge tone={ACTION_TONES[openMark.action]}>
                        {ACTION_LABELS[openMark.action]}
                      </StatusBadge>
                      {openMark.action === "none" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onPress={() =>
                            toast.success("Action queued for moderator review")
                          }
                        >
                          <Text className="text-xs text-foreground">
                            Queue review
                          </Text>
                        </Button>
                      ) : null}
                    </View>
                  </Section>
                </View>
              ) : (
                <View className="h-32 animate-pulse rounded-xl bg-muted/60" />
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: import("lucide-react-native").LucideIcon;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "red";
}) {
  const ringClass =
    tone === "emerald"
      ? "border-cyan-500/30"
      : tone === "amber"
        ? "border-amber-500/30"
        : "border-red-500/30";
  const iconColor =
    tone === "emerald" ? "#67E8F0" : tone === "amber" ? "#FCD34D" : "#FCA5A5";
  return (
    <View
      className={`min-w-[30%] flex-1 rounded-xl border border-border bg-card/40 p-4 ${ringClass}`}
    >
      <View className="flex-row items-center gap-2">
        <Icon size={14} color={iconColor} />
        <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </Text>
      </View>
      <Text
        className="mt-2 text-2xl font-semibold text-foreground"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
    </View>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-4">
      <Text className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <View className="rounded-xl border border-border bg-card/40 p-3">
        {children}
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3 border-t border-border/50 py-2 first:border-t-0 first:pt-0">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text
        numberOfLines={2}
        className={`max-w-[60%] text-right text-sm text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </Text>
    </View>
  );
}

function ManifestVisual({ code }: { code: string }) {
  const bars = Array.from({ length: 24 }).map((_, i) => {
    const seed = code.charCodeAt(i % code.length) + i;
    const intensity = (seed % 100) / 100;
    return { intensity };
  });
  return (
    <View className="mt-4 rounded-xl border border-border bg-background/80 p-4">
      <View className="mb-2 flex-row items-center gap-1.5">
        <ScanLine size={12} color="#A3A3A3" />
        <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Manifest fingerprint
        </Text>
      </View>
      <Svg viewBox="0 0 240 60" height={64} width="100%">
        {bars.map((b, i) => {
          const fill =
            i % 5 === 0 ? "#FBBF24" : i % 4 === 0 ? "#2CD7E3" : "#525252";
          return (
            <Rect
              key={i}
              x={i * 10}
              y={30 - b.intensity * 25}
              width={6}
              height={b.intensity * 50 + 6}
              rx={1}
              fill={fill}
            />
          );
        })}
      </Svg>
      <Text className="mt-2 text-[11px] text-muted-foreground">
        Highlighted bars are this viewer's per-session A/B segment offsets.
      </Text>
    </View>
  );
}
