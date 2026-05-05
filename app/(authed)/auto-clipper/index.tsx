import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { toast } from "sonner-native";
import {
  Activity,
  Check,
  Crown,
  Eye,
  Flag,
  Loader2,
  MessageSquare,
  Settings as SettingsIcon,
  ShieldAlert,
  Target,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react-native";

type LucideIcon = import("lucide-react-native").LucideIcon;

import {
  approveAutoClip,
  discardAutoClip,
  getAutoClipperSettings,
  listAutoClips,
  previewClip,
  updateAutoClipperSettings,
  type AutoClip,
  type AutoClipStatus,
  type AutoClipTrigger,
  type AutoClipperSettings,
} from "@/lib/mock/auto-clips";
import { useMockAuth } from "@/components/providers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const TRIGGER_LABELS: Record<
  AutoClipTrigger,
  { label: string; tone: string; iconColor: string; Icon: any }
> = {
  "chat-spike": {
    label: "Chat spike",
    tone: "bg-amber-500/10 ring-amber-500/30",
    iconColor: "#FCD34D",
    Icon: MessageSquare,
  },
  "score-event": {
    label: "Score event",
    tone: "bg-brand/10 ring-brand/30",
    iconColor: "#7DD3FC",
    Icon: Trophy,
  },
  killstreak: {
    label: "Killstreak",
    tone: "bg-red-500/10 ring-red-500/30",
    iconColor: "#F87171",
    Icon: Target,
  },
  "highlight-tag": {
    label: "Caster tag",
    tone: "bg-blue-500/10 ring-blue-500/30",
    iconColor: "#60A5FA",
    Icon: Flag,
  },
  "casters-hyped": {
    label: "Casters hyped",
    tone: "bg-violet-500/10 ring-violet-500/30",
    iconColor: "#A78BFA",
    Icon: Crown,
  },
};

function timeAgo(iso: string): string {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatTile({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  tone: "amber" | "emerald" | "neutral" | "violet";
}) {
  const ring =
    tone === "amber"
      ? "border-amber-500/30"
      : tone === "emerald"
        ? "border-emerald-500/30"
        : tone === "violet"
          ? "border-violet-500/30"
          : "border-neutral-800";
  const color =
    tone === "amber"
      ? "#FCD34D"
      : tone === "emerald"
        ? "#34D399"
        : tone === "violet"
          ? "#A78BFA"
          : "#A3A3A3";
  return (
    <View
      className={cn(
        "flex-1 rounded-xl border bg-neutral-900/40 p-3",
        ring,
      )}
    >
      <View className="flex-row items-center gap-1.5">
        <Icon size={12} color={color} />
        <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
          {label}
        </Text>
      </View>
      <Text className="mt-1 text-2xl font-semibold text-neutral-50">
        {value}
      </Text>
    </View>
  );
}

function AutoClipRow({
  clip,
  busy,
  onPreview,
  onApprove,
  onDiscard,
}: {
  clip: AutoClip;
  busy: boolean;
  onPreview: () => void;
  onApprove: () => void;
  onDiscard: () => void;
}) {
  const trig = TRIGGER_LABELS[clip.trigger];
  const TrigIcon = trig.Icon;
  const conf = Math.round(clip.confidence * 100);
  const statusTone =
    clip.status === "pending"
      ? "border-amber-500/40 bg-amber-500/10"
      : clip.status === "approved"
        ? "border-emerald-500/40 bg-emerald-500/10"
        : "border-neutral-700 bg-neutral-900";
  const statusText =
    clip.status === "pending"
      ? "text-amber-300"
      : clip.status === "approved"
        ? "text-emerald-300"
        : "text-neutral-400";

  return (
    <View className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <Pressable onPress={onPreview} className="flex-row gap-3 active:opacity-80">
        <View
          style={{
            width: 100,
            aspectRatio: 16 / 9,
            borderRadius: 6,
            overflow: "hidden",
            backgroundColor: "#171717",
          }}
        >
          <Image
            source={clip.thumbnailUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <View className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5">
            <Text className="text-[9px] font-medium text-white">
              {clip.endSec - clip.startSec}s
            </Text>
          </View>
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <View
            className={cn(
              "flex-row items-center gap-1 self-start rounded-md px-2 py-0.5 ring-1",
              trig.tone,
            )}
          >
            <TrigIcon size={11} color={trig.iconColor} />
            <Text className="text-[10px] font-bold uppercase text-neutral-100">
              {trig.label}
            </Text>
          </View>
          <Text
            className="text-sm font-medium text-neutral-100"
            numberOfLines={1}
          >
            {clip.streamTitle}
          </Text>
          <Text className="text-[11px] text-neutral-500" numberOfLines={2}>
            {clip.caption}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-800">
              <View
                className={cn(
                  "h-full rounded-full",
                  conf >= 90
                    ? "bg-emerald-400"
                    : conf >= 75
                      ? "bg-sky-400"
                      : "bg-amber-400",
                )}
                style={{ width: `${conf}%` }}
              />
            </View>
            <Text className="text-[10px] text-neutral-400">{conf}%</Text>
            <Text className="text-[10px] text-neutral-500">
              · {timeAgo(clip.detectedAt)}
            </Text>
          </View>
        </View>
      </Pressable>
      <View className="mt-2 flex-row items-center justify-between">
        <View
          className={cn(
            "rounded-md border px-2 py-0.5",
            statusTone,
          )}
        >
          <Text className={cn("text-[10px] uppercase", statusText)}>
            {clip.status === "pending"
              ? "Pending review"
              : clip.status === "approved"
                ? "Approved"
                : "Discarded"}
          </Text>
        </View>
        {clip.status === "pending" ? (
          <View className="flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-neutral-700"
              disabled={busy}
              onPress={onApprove}
              textClassName="text-emerald-300"
            >
              {busy ? <Loader2 size={12} color="#A3A3A3" /> : <Check size={12} color="#34D399" />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onPress={onDiscard}
              textClassName="text-red-300"
            >
              <Trash2 size={12} color="#FCA5A5" />
              Discard
            </Button>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function AutoClipperScreen() {
  const router = useRouter();
  const { role } = useMockAuth();

  const [filter, setFilter] = React.useState<AutoClipStatus | "all">("pending");
  const [clips, setClips] = React.useState<AutoClip[] | null>(null);
  const [previewing, setPreviewing] = React.useState<AutoClip | null>(null);
  const [settings, setSettings] = React.useState<AutoClipperSettings | null>(
    null,
  );
  const [updating, setUpdating] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  function refresh() {
    setClips(null);
    listAutoClips(filter === "all" ? undefined : { status: filter }).then(
      setClips,
    );
  }

  React.useEffect(() => {
    if (role !== "admin") return;
    refresh();
    getAutoClipperSettings().then(setSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  React.useEffect(() => {
    if (role !== "admin") return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, role]);

  if (role !== "admin") {
    return (
      <>
        <Stack.Screen options={{ title: "Auto-clipper" }} />
        <View className="flex-1 items-center justify-center bg-background p-8">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <ShieldAlert size={22} color="#F87171" />
          </View>
          <Text className="mt-3 text-lg font-semibold text-neutral-100">
            Admin only
          </Text>
          <Text className="mt-1 text-center text-sm text-neutral-400">
            The auto-clipper console is restricted to EVO TV admins.
          </Text>
          <Button
            className="mt-4 bg-brand"
            onPress={() => router.replace("/home")}
            textClassName="text-black"
          >
            Back to home
          </Button>
        </View>
      </>
    );
  }

  async function handleApprove(id: string) {
    setBusy(id);
    try {
      await approveAutoClip(id);
      toast.success("Clip approved");
      refresh();
    } catch {
      toast.error("Could not approve");
    } finally {
      setBusy(null);
    }
  }

  async function handleDiscard(id: string) {
    setBusy(id);
    try {
      await discardAutoClip(id);
      toast("Clip discarded");
      refresh();
    } catch {
      toast.error("Could not discard");
    } finally {
      setBusy(null);
    }
  }

  async function handlePreview(id: string) {
    const c = await previewClip(id);
    setPreviewing(c);
  }

  async function patchSettings(patch: Partial<AutoClipperSettings>) {
    if (!settings) return;
    setUpdating(true);
    try {
      const next = await updateAutoClipperSettings(patch);
      setSettings(next);
      toast.success("Settings saved");
    } catch {
      toast.error("Could not save");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Auto-clipper" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <View className="flex-row items-end justify-between gap-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-neutral-50">
                Auto-clipper
              </Text>
              <Text className="mt-1 text-sm text-neutral-400">
                Watches every live stream for moments worth clipping.
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View
                className={cn(
                  "rounded-md border px-2 py-0.5",
                  settings?.enabled
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-neutral-700 bg-neutral-900",
                )}
              >
                <Text
                  className={cn(
                    "text-[10px] uppercase",
                    settings?.enabled ? "text-emerald-300" : "text-neutral-400",
                  )}
                >
                  {settings?.enabled ? "Running" : "Paused"}
                </Text>
              </View>
              <Switch
                checked={settings?.enabled ?? false}
                disabled={!settings || updating}
                onCheckedChange={(v) => patchSettings({ enabled: v })}
              />
            </View>
          </View>

          {/* Stats */}
          <View className="mt-5 flex-row gap-2">
            <StatTile
              Icon={Activity}
              label="Pending"
              value={(clips ?? []).filter((c) => c.status === "pending").length}
              tone="amber"
            />
            <StatTile
              Icon={Check}
              label="Approved"
              value={(clips ?? []).filter((c) => c.status === "approved").length}
              tone="emerald"
            />
          </View>
          <View className="mt-2 flex-row gap-2">
            <StatTile
              Icon={Trash2}
              label="Discarded"
              value={(clips ?? []).filter((c) => c.status === "discarded").length}
              tone="neutral"
            />
            <StatTile
              Icon={Zap}
              label="Triggers"
              value={settings?.scoreEventTypes.length ?? 0}
              tone="violet"
            />
          </View>

          {/* Filter tabs */}
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
            className="mt-5"
          >
            <TabsList>
              <TabsTrigger value="pending">
                <Text className="text-sm font-medium text-neutral-300">
                  Pending
                </Text>
              </TabsTrigger>
              <TabsTrigger value="approved">
                <Text className="text-sm font-medium text-neutral-300">
                  Approved
                </Text>
              </TabsTrigger>
              <TabsTrigger value="discarded">
                <Text className="text-sm font-medium text-neutral-300">
                  Discarded
                </Text>
              </TabsTrigger>
              <TabsTrigger value="all">
                <Text className="text-sm font-medium text-neutral-300">All</Text>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {clips === null ? (
            <View className="mt-3 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </View>
          ) : clips.length === 0 ? (
            <View className="mt-3 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10">
              <Text className="text-center text-sm text-neutral-400">
                No auto-clips match this filter.
              </Text>
            </View>
          ) : (
            <View className="mt-3 gap-2">
              {clips.map((c) => (
                <AutoClipRow
                  key={c.id}
                  clip={c}
                  busy={busy === c.id}
                  onPreview={() => handlePreview(c.id)}
                  onApprove={() => handleApprove(c.id)}
                  onDiscard={() => handleDiscard(c.id)}
                />
              ))}
            </View>
          )}

          {/* Settings */}
          <View className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
            <View className="flex-row items-center gap-2">
              <SettingsIcon size={14} color="#A3A3A3" />
              <Text className="text-sm font-semibold text-neutral-100">
                Trigger settings
              </Text>
            </View>
            {settings ? (
              <View className="mt-4 gap-4">
                <SettingRow
                  label="Chat spike threshold"
                  hint="Messages per second"
                  value={`${settings.chatSpikeMessagesPerSec}/s`}
                >
                  <Slider
                    value={[settings.chatSpikeMessagesPerSec]}
                    min={4}
                    max={40}
                    step={1}
                    onValueChange={(v) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              chatSpikeMessagesPerSec:
                                v[0] ?? s.chatSpikeMessagesPerSec,
                            }
                          : s,
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 border-neutral-700"
                    onPress={() =>
                      patchSettings({
                        chatSpikeMessagesPerSec: settings.chatSpikeMessagesPerSec,
                      })
                    }
                    textClassName="text-neutral-200"
                  >
                    Save
                  </Button>
                </SettingRow>
                <SettingRow
                  label="Killstreak min kills"
                  hint="Consecutive kills"
                  value={`${settings.killstreakMinKills}`}
                >
                  <Slider
                    value={[settings.killstreakMinKills]}
                    min={2}
                    max={8}
                    step={1}
                    onValueChange={(v) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              killstreakMinKills:
                                v[0] ?? s.killstreakMinKills,
                            }
                          : s,
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 border-neutral-700"
                    onPress={() =>
                      patchSettings({
                        killstreakMinKills: settings.killstreakMinKills,
                      })
                    }
                    textClassName="text-neutral-200"
                  >
                    Save
                  </Button>
                </SettingRow>
                <SettingRow
                  label="Min clip length"
                  hint="Lowest acceptable duration"
                  value={`${settings.minClipDurationSec}s`}
                >
                  <Slider
                    value={[settings.minClipDurationSec]}
                    min={8}
                    max={30}
                    step={1}
                    onValueChange={(v) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              minClipDurationSec:
                                v[0] ?? s.minClipDurationSec,
                            }
                          : s,
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 border-neutral-700"
                    onPress={() =>
                      patchSettings({
                        minClipDurationSec: settings.minClipDurationSec,
                      })
                    }
                    textClassName="text-neutral-200"
                  >
                    Save
                  </Button>
                </SettingRow>
                <SettingRow
                  label="Max clip length"
                  hint="Hard cap on detected clips"
                  value={`${settings.maxClipDurationSec}s`}
                >
                  <Slider
                    value={[settings.maxClipDurationSec]}
                    min={30}
                    max={120}
                    step={5}
                    onValueChange={(v) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              maxClipDurationSec:
                                v[0] ?? s.maxClipDurationSec,
                            }
                          : s,
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 border-neutral-700"
                    onPress={() =>
                      patchSettings({
                        maxClipDurationSec: settings.maxClipDurationSec,
                      })
                    }
                    textClassName="text-neutral-200"
                  >
                    Save
                  </Button>
                </SettingRow>
                <SettingRow
                  label="Auto-approve confidence"
                  hint="Above this, clips publish without review"
                  value={`${Math.round(
                    settings.autoApproveAboveConfidence * 100,
                  )}%`}
                >
                  <Slider
                    value={[
                      Math.round(settings.autoApproveAboveConfidence * 100),
                    ]}
                    min={75}
                    max={99}
                    step={1}
                    onValueChange={(v) =>
                      setSettings((s) =>
                        s
                          ? {
                              ...s,
                              autoApproveAboveConfidence:
                                (v[0] ?? 90) / 100,
                            }
                          : s,
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 border-neutral-700"
                    onPress={() =>
                      patchSettings({
                        autoApproveAboveConfidence:
                          settings.autoApproveAboveConfidence,
                      })
                    }
                    textClassName="text-neutral-200"
                  >
                    Save
                  </Button>
                </SettingRow>

                <View className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
                  <Text className="text-xs font-semibold text-neutral-200">
                    Score event types
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-neutral-500">
                    Which game-state events fire a clip
                  </Text>
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {(["ace", "clutch", "comeback", "first-blood"] as const).map(
                      (kind) => {
                        const active =
                          settings.scoreEventTypes.includes(kind);
                        return (
                          <Pressable
                            key={kind}
                            onPress={() => {
                              const next = active
                                ? settings.scoreEventTypes.filter(
                                    (s) => s !== kind,
                                  )
                                : [...settings.scoreEventTypes, kind];
                              patchSettings({ scoreEventTypes: next });
                            }}
                            className={cn(
                              "rounded-full border px-2.5 py-0.5",
                              active
                                ? "border-brand/50 bg-brand/10"
                                : "border-neutral-800 bg-neutral-900/60",
                            )}
                          >
                            <Text
                              className={cn(
                                "text-[11px] font-medium",
                                active ? "text-brand" : "text-neutral-400",
                              )}
                            >
                              {kind}
                            </Text>
                          </Pressable>
                        );
                      },
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View className="mt-4 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Preview dialog */}
      <Dialog
        open={!!previewing}
        onOpenChange={(o) => !o && setPreviewing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewing?.caption ?? "Clip preview"}</DialogTitle>
            {previewing ? (
              <DialogDescription>
                {previewing.streamTitle} ·{" "}
                {previewing.endSec - previewing.startSec}s ·{" "}
                {TRIGGER_LABELS[previewing.trigger].label}
              </DialogDescription>
            ) : null}
          </DialogHeader>
          {previewing ? (
            <>
              <View
                style={{
                  aspectRatio: 16 / 9,
                  borderRadius: 8,
                  overflow: "hidden",
                  backgroundColor: "#000",
                }}
              >
                <Image
                  source={previewing.thumbnailUrl}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
                <View className="absolute inset-0 items-center justify-center bg-black/30">
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-white/20">
                    <Eye size={26} color="#FAFAFA" />
                  </View>
                </View>
                <View className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-0.5">
                  <Text className="text-[10px] font-medium text-white">
                    Preview · auto-generated
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2">
                <PreviewMini label="Trigger">
                  {TRIGGER_LABELS[previewing.trigger].label}
                </PreviewMini>
                <PreviewMini label="Confidence">
                  {Math.round(previewing.confidence * 100)}%
                </PreviewMini>
                <PreviewMini label="Window">
                  {`${previewing.startSec}s → ${previewing.endSec}s`}
                </PreviewMini>
                <PreviewMini label="Detected">
                  {timeAgo(previewing.detectedAt)}
                </PreviewMini>
              </View>
              {previewing.status === "pending" ? (
                <View className="mt-2 flex-row justify-end gap-2">
                  <Button
                    variant="ghost"
                    onPress={() => {
                      handleDiscard(previewing.id);
                      setPreviewing(null);
                    }}
                    textClassName="text-red-300"
                  >
                    Discard
                  </Button>
                  <Button
                    className="bg-brand"
                    onPress={() => {
                      handleApprove(previewing.id);
                      setPreviewing(null);
                    }}
                    textClassName="text-black"
                  >
                    <Check size={14} color="#000" />
                    Approve
                  </Button>
                </View>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SettingRow({
  label,
  hint,
  value,
  children,
}: {
  label: string;
  hint?: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xs font-semibold text-neutral-200">
            {label}
          </Text>
          {hint ? (
            <Text className="mt-0.5 text-[11px] text-neutral-500">{hint}</Text>
          ) : null}
        </View>
        {value ? (
          <Text className="text-xs font-bold tabular-nums text-neutral-100">
            {value}
          </Text>
        ) : null}
      </View>
      <View className="mt-3">{children}</View>
    </View>
  );
}

function PreviewMini({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950/40 p-2">
      <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </Text>
      <Text className="mt-1 text-xs font-semibold text-neutral-100">
        {children}
      </Text>
    </View>
  );
}
