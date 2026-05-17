import * as React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Code2, Copy, Lock, Sparkles } from "lucide-react-native";
import { toast } from "sonner-native";
import * as Clipboard from "expo-clipboard";

import { useMockAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { HLSPlayer } from "@/components/stream/hls-player";
import {
  buildEmbedSnippet,
  EMBED_SIZE_PRESETS,
  listEmbedSources,
  type EmbedConfig,
  type EmbedSource,
  type EmbedTheme,
} from "@/lib/mock/embed";
import { listLiveStreams } from "@/lib/api/streams";
import { listVods } from "@/lib/api/vods";

const SAMPLE_HLS = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export default function EmbedScreen() {
  const { role } = useMockAuth();
  const isPremium = role === "premium" || role === "admin";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1 bg-neutral-950"
        contentContainerStyle={{ paddingBottom: 64 }}
      >
        <Header />
        <View className="px-4 py-6">
          <Hero />
          {isPremium ? <EmbedGenerator /> : <PremiumGate />}
        </View>
      </ScrollView>
    </>
  );
}

/* ----------------------------------------------------------------- */
/* Header                                                             */
/* ----------------------------------------------------------------- */

function Header() {
  const router = useRouter();
  return (
    <View className="border-b border-neutral-900 bg-neutral-950 px-4 py-3 flex-row items-center justify-between">
      <Pressable
        onPress={() => router.push("/home")}
        accessibilityRole="link"
        className="flex-row items-center gap-2"
      >
        <View
          className="items-center justify-center rounded-md"
          style={{
            width: 28,
            height: 28,
            backgroundColor: "rgba(44,215,227,0.15)",
          }}
        >
          <Code2 size={14} color="#2CD7E3" />
        </View>
        <Text className="text-sm font-semibold text-neutral-100">
          EVO TV embeds
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/home")}
        accessibilityRole="link"
      >
        <Text className="text-xs text-neutral-400">Back to EVO TV →</Text>
      </Pressable>
    </View>
  );
}

/* ----------------------------------------------------------------- */
/* Hero                                                               */
/* ----------------------------------------------------------------- */

function Hero() {
  return (
    <View className="items-center">
      <View
        className="flex-row items-center gap-1 rounded-full border px-3 py-1"
        style={{
          borderColor: "rgba(245,158,11,0.4)",
          backgroundColor: "rgba(245,158,11,0.1)",
        }}
      >
        <Sparkles size={12} color="#FCD34D" />
        <Text
          className="text-[10px] font-semibold uppercase"
          style={{ color: "#FCD34D", letterSpacing: 1 }}
        >
          Premium feature
        </Text>
      </View>
      <Text className="mt-4 text-center text-3xl font-bold text-neutral-50">
        Put EVO TV anywhere on the web.
      </Text>
      <Text className="mt-3 text-center text-sm text-neutral-400">
        Embed any live stream or recent VOD on your blog, your team site, or
        your sponsor's landing page. One iframe. Zero friction.
      </Text>
    </View>
  );
}

/* ----------------------------------------------------------------- */
/* Premium Gate                                                       */
/* ----------------------------------------------------------------- */

function PremiumGate() {
  const router = useRouter();
  return (
    <View
      className="mt-10 items-center rounded-2xl p-8"
      style={{
        borderWidth: 1,
        borderColor: "rgba(44,215,227,0.2)",
        backgroundColor: "rgba(20,20,20,0.6)",
      }}
    >
      <View
        className="items-center justify-center rounded-xl"
        style={{
          width: 48,
          height: 48,
          borderWidth: 1,
          borderColor: "rgba(44,215,227,0.3)",
          backgroundColor: "rgba(44,215,227,0.15)",
        }}
      >
        <Lock size={20} color="#2CD7E3" />
      </View>
      <Text className="mt-4 text-xl font-semibold text-neutral-50">
        Embeds are a Premium feature
      </Text>
      <Text className="mt-2 max-w-md text-center text-sm text-neutral-400">
        Upgrade to embed live tournaments and VODs on any site you control.
        Stay in your brand, keep your audience close.
      </Text>
      <View className="mt-5 w-full gap-3">
        <Button
          onPress={() => router.push("/upgrade")}
          className="bg-[#2CD7E3]"
          textClassName="text-neutral-950 font-semibold"
        >
          Upgrade to Premium
        </Button>
        <Button
          variant="outline"
          onPress={() => router.push("/discover")}
          className="border-neutral-800"
        >
          Browse free content
        </Button>
      </View>
    </View>
  );
}

/* ----------------------------------------------------------------- */
/* Embed Generator                                                    */
/* ----------------------------------------------------------------- */

function EmbedGenerator() {
  const sourcesQ = useQuery({
    queryKey: ["embed", "sources"],
    queryFn: listEmbedSources,
  });
  const streamsQ = useQuery({
    queryKey: ["streams", "live", "embed"],
    queryFn: () => listLiveStreams(),
  });
  const vodsQ = useQuery({
    queryKey: ["vods", "embed"],
    queryFn: () => listVods({ limit: 30 }),
  });
  const streams = streamsQ.data ?? [];
  const vods = vodsQ.data ?? [];

  const [streamId, setStreamId] = React.useState<string>("");
  const [width, setWidth] = React.useState<number>(720);
  const [height, setHeight] = React.useState<number>(405);
  const [autoplay, setAutoplay] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const [theme, setTheme] = React.useState<EmbedTheme>("dark");
  const [copied, setCopied] = React.useState(false);
  const [manualId, setManualId] = React.useState<string>("");

  React.useEffect(() => {
    if (!streamId && sourcesQ.data?.[0]) {
      setStreamId(sourcesQ.data[0].id);
    }
  }, [streamId, sourcesQ.data]);

  const config: EmbedConfig = {
    streamId,
    width,
    height,
    autoplay,
    muted,
    theme,
  };

  const snippet = React.useMemo(() => buildEmbedSnippet(config), [config]);
  const sources = sourcesQ.data ?? [];
  const grouped = React.useMemo(
    () => ({
      live: sources.filter((s) => s.kind === "live"),
      vod: sources.filter((s) => s.kind === "vod"),
    }),
    [sources],
  );
  const selectedSource = sources.find((s) => s.id === streamId);

  const previewVideoSrc = React.useMemo(() => {
    const stream = streams.find((s) => s.id === streamId);
    if (stream) {
      return {
        src: SAMPLE_HLS,
        poster: stream.thumbnailUrl,
      };
    }
    const vod = vods.find((v) => v.id === streamId);
    if (vod) {
      return {
        src: SAMPLE_HLS,
        poster: vod.thumbnailUrl,
      };
    }
    return null;
  }, [streamId, streams, vods]);

  function applyPreset(preset: { width: number; height: number }) {
    setWidth(preset.width);
    setHeight(preset.height);
  }

  function copyCode() {
    void Clipboard.setStringAsync(snippet)
      .then(() => {
        toast.success("Embed code copied");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Could not copy"));
  }

  function applyManualId() {
    const id = manualId.trim();
    if (!id) {
      toast.error("Enter a stream or VOD ID");
      return;
    }
    const exists =
      streams.some((s) => s.id === id) || vods.some((v) => v.id === id);
    if (!exists) {
      toast.error("ID not found in current catalog");
      return;
    }
    setStreamId(id);
    toast.success("Source updated");
  }

  return (
    <View className="mt-10 gap-5">
      {/* Configure */}
      <View
        className="gap-5 rounded-2xl border border-neutral-800 p-5"
        style={{ backgroundColor: "rgba(20,20,20,0.5)" }}
      >
        <View className="flex-row items-center gap-2">
          <Code2 size={16} color="#2CD7E3" />
          <Text
            className="text-xs font-semibold uppercase text-neutral-300"
            style={{ letterSpacing: 1 }}
          >
            Configure
          </Text>
        </View>

        {/* Manual ID input */}
        <View className="gap-1.5">
          <Label className="text-neutral-200">Paste a stream or VOD ID</Label>
          <View className="flex-row gap-2">
            <Input
              value={manualId}
              onChangeText={setManualId}
              placeholder="e.g. stream_lagos_final"
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 bg-neutral-950"
            />
            <Button
              size="sm"
              onPress={applyManualId}
              className="bg-[#2CD7E3]"
              textClassName="text-neutral-950 font-semibold"
            >
              Apply
            </Button>
          </View>
        </View>

        {/* Source picker */}
        <View className="gap-2">
          <Label className="text-neutral-200">Or pick from catalog</Label>
          {sourcesQ.isLoading ? (
            <View className="h-20 items-center justify-center">
              <Spinner />
            </View>
          ) : (
            <View className="gap-3">
              {grouped.live.length > 0 ? (
                <View className="gap-2">
                  <Text
                    className="text-[10px] font-semibold uppercase"
                    style={{ color: "#F87171", letterSpacing: 1 }}
                  >
                    Live now
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {grouped.live.map((s) => (
                      <SourceChip
                        key={s.id}
                        source={s}
                        active={s.id === streamId}
                        onPress={() => setStreamId(s.id)}
                        live
                      />
                    ))}
                  </View>
                </View>
              ) : null}
              {grouped.vod.length > 0 ? (
                <View className="gap-2">
                  <Text
                    className="text-[10px] font-semibold uppercase text-neutral-400"
                    style={{ letterSpacing: 1 }}
                  >
                    Recent VODs
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {grouped.vod.map((s) => (
                      <SourceChip
                        key={s.id}
                        source={s}
                        active={s.id === streamId}
                        onPress={() => setStreamId(s.id)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* Size presets */}
        <View className="gap-2">
          <Label className="text-neutral-200">Size preset</Label>
          <View className="flex-row flex-wrap gap-2">
            {EMBED_SIZE_PRESETS.map((p) => {
              const active = width === p.width && height === p.height;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => applyPreset(p)}
                  accessibilityRole="button"
                  className="rounded-full border px-3 py-1"
                  style={{
                    borderColor: active
                      ? "rgba(44,215,227,0.5)"
                      : "rgba(38,38,38,1)",
                    backgroundColor: active
                      ? "rgba(44,215,227,0.1)"
                      : "rgba(23,23,23,1)",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: active ? "#2CD7E3" : "#D4D4D4" }}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Width/height */}
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1.5">
            <Label className="text-neutral-200">Width</Label>
            <Input
              keyboardType="number-pad"
              value={String(width)}
              onChangeText={(v) => {
                const n = Math.max(200, Number(v.replace(/\D/g, "")) || 0);
                setWidth(n);
              }}
              className="bg-neutral-950"
            />
          </View>
          <View className="flex-1 gap-1.5">
            <Label className="text-neutral-200">Height</Label>
            <Input
              keyboardType="number-pad"
              value={String(height)}
              onChangeText={(v) => {
                const n = Math.max(113, Number(v.replace(/\D/g, "")) || 0);
                setHeight(n);
              }}
              className="bg-neutral-950"
            />
          </View>
        </View>

        {/* Toggles */}
        <View className="gap-3">
          <ToggleRow
            label="Autoplay"
            description="Start playing as soon as the iframe loads."
            checked={autoplay}
            onChange={setAutoplay}
          />
          <ToggleRow
            label="Start muted"
            description="Required by most browsers when autoplay is on."
            checked={muted}
            onChange={setMuted}
          />
          <View>
            <Label className="text-neutral-200">Theme</Label>
            <View className="mt-1.5 flex-row gap-2">
              {(["dark", "light", "auto"] as EmbedTheme[]).map((t) => {
                const active = theme === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setTheme(t)}
                    accessibilityRole="button"
                    className="flex-1 items-center rounded-lg border px-3 py-1.5"
                    style={{
                      borderColor: active
                        ? "rgba(44,215,227,0.5)"
                        : "rgba(38,38,38,1)",
                      backgroundColor: active
                        ? "rgba(44,215,227,0.1)"
                        : "rgba(23,23,23,1)",
                    }}
                  >
                    <Text
                      className="text-xs font-medium capitalize"
                      style={{ color: active ? "#2CD7E3" : "#D4D4D4" }}
                    >
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* Live preview */}
      <View
        className="rounded-2xl border border-neutral-800 p-5"
        style={{ backgroundColor: "rgba(20,20,20,0.5)" }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text
            className="text-xs font-semibold uppercase text-neutral-300"
            style={{ letterSpacing: 1 }}
          >
            Live preview
          </Text>
          {selectedSource ? (
            <Text
              className="text-[11px] text-neutral-500"
              numberOfLines={1}
              style={{ maxWidth: 180 }}
            >
              {selectedSource.title}
            </Text>
          ) : null}
        </View>
        {previewVideoSrc ? (
          <View
            className="overflow-hidden rounded-lg bg-black"
            style={{
              borderWidth: 1,
              borderColor: "rgba(38,38,38,1)",
              aspectRatio: width / height,
              width: "100%",
            }}
          >
            <HLSPlayer
              src={previewVideoSrc.src}
              poster={previewVideoSrc.poster}
              autoPlay={autoplay}
              muted={muted}
              controls
              className="flex-1"
            />
          </View>
        ) : (
          <View className="h-40 items-center justify-center">
            <Spinner />
          </View>
        )}
      </View>

      {/* Embed code */}
      <View
        className="rounded-2xl border border-neutral-800 p-5"
        style={{ backgroundColor: "rgba(20,20,20,0.5)" }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text
            className="text-xs font-semibold uppercase text-neutral-300"
            style={{ letterSpacing: 1 }}
          >
            Embed code
          </Text>
          <Button
            size="sm"
            onPress={copyCode}
            className="bg-[#2CD7E3]"
            textClassName="text-neutral-950 font-semibold"
          >
            <View className="flex-row items-center gap-1.5">
              {copied ? (
                <Check size={14} color="#0A0A0A" />
              ) : (
                <Copy size={14} color="#0A0A0A" />
              )}
              <Text className="text-xs font-semibold text-neutral-950">
                {copied ? "Copied" : "Copy code"}
              </Text>
            </View>
          </Button>
        </View>
        <View
          className="rounded-lg border border-neutral-800 p-4"
          style={{ backgroundColor: "#0A0A0A" }}
        >
          <TextInput
            value={snippet}
            multiline
            editable={false}
            scrollEnabled={false}
            selectTextOnFocus
            className="text-[11px] text-neutral-200"
            style={{
              fontFamily: Platform.select({
                ios: "Menlo",
                android: "monospace",
                default: "monospace",
              }),
              minHeight: 130,
            }}
          />
        </View>
        <Text className="mt-2 text-[11px] text-neutral-500">
          Paste this anywhere HTML is allowed — Notion, Webflow, Substack, your
          own site.
        </Text>
      </View>

      {/* Feature cards */}
      <View className="mt-2 gap-3">
        {[
          {
            title: "Lightweight",
            body:
              "A single <iframe>. Works in Webflow, WordPress, Notion, Substack and more.",
          },
          {
            title: "Configurable",
            body:
              "Theme, autoplay, muted state and dimensions — set per-embed.",
          },
          {
            title: "Always fresh",
            body:
              "Embeds follow the source: when a stream goes live, the iframe shows it automatically.",
          },
        ].map((f) => (
          <View
            key={f.title}
            className="rounded-2xl border border-neutral-800 p-5"
            style={{ backgroundColor: "rgba(20,20,20,0.5)" }}
          >
            <Text className="font-semibold text-neutral-100">{f.title}</Text>
            <Text className="mt-1 text-sm text-neutral-400">{f.body}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SourceChip({
  source,
  active,
  onPress,
  live,
}: {
  source: EmbedSource;
  active: boolean;
  onPress: () => void;
  live?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
      style={{
        maxWidth: 260,
        borderColor: active ? "rgba(44,215,227,0.5)" : "rgba(38,38,38,1)",
        backgroundColor: active
          ? "rgba(44,215,227,0.1)"
          : "rgba(23,23,23,1)",
      }}
    >
      {live ? (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#EF4444",
          }}
        />
      ) : null}
      <Text
        className="text-xs font-medium"
        numberOfLines={1}
        style={{ color: active ? "#2CD7E3" : "#D4D4D4" }}
      >
        {source.title}
      </Text>
    </Pressable>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      className="flex-row items-start justify-between gap-3 rounded-lg border border-neutral-800 p-3"
      style={{ backgroundColor: "rgba(10,10,10,0.6)" }}
    >
      <View className="flex-1">
        <Text className="text-sm font-medium text-neutral-100">{label}</Text>
        <Text className="text-[11px] text-neutral-500">{description}</Text>
      </View>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Pressable>
  );
}
