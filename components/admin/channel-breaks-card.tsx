import * as React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/_client";
import { useTokens } from "@/lib/theme/tokens";
import {
  LowerThird,
  UpNextCard,
  type OverlayStyle,
  type UpNextStyle,
} from "@/components/stream/channel-overlays";

/**
 * When the on-air cards show, how often, and which of them.
 *
 * The owner asked for all ten layouts in rotation and a place to manage when
 * they appear. That place existed on the website's Ads page and nowhere on the
 * phone, which is the wrong way round for a channel that gets run from the
 * gallery rather than a desk.
 *
 * Same endpoint as the website, so the two cannot disagree: whatever is saved
 * here is what both the site and the app draw, with no release in between.
 */

interface Breaks {
  enabled: boolean;
  adIntervalMin: number;
  adMaxSec: number;
  overlayIntervalMin: number;
  overlayDurationSec: number;
  fillerOnDrop: boolean;
  lowerThirdStyles: OverlayStyle[];
  lowerThirdStyle: OverlayStyle;
  lowerThirdUrl: string;
  upNextStyles: UpNextStyle[];
  upNextStyle: UpNextStyle;
  upNextUrl: string;
  upNextLeadMin: number;
  upNextSec: number;
}

const LOWER_THIRD_LABELS: Record<OverlayStyle, string> = {
  bar: "Bar · full width strip",
  slab: "Slab · time block then name",
  ticker: "Ticker · one line in brand colour",
  plate: "Plate · carries the poster",
  stack: "Stack · on now, then up next",
};

const UP_NEXT_LABELS: Record<UpNextStyle, string> = {
  centre: "Centre · name and time only",
  band: "Band · artwork with a solid band",
  split: "Split · words left, artwork right",
  countdown: "Countdown · a clock that runs",
  lineup: "Line-up · the next four",
};

/** The words the preview stands in with, so the layout can be judged. */
const PREVIEW = {
  title: "NEED FOR SPEED",
  subtitle: "Apex Legends",
  startLabel: "20:00",
  durationMin: 120,
  pillar: "esports",
  nowTitle: "Morning Run",
  lineup: [
    { startLabel: "20:00", title: "NEED FOR SPEED" },
    { startLabel: "22:00", title: "EAFC" },
  ],
};

export function ChannelBreaksCard() {
  const palette = useTokens();
  const qc = useQueryClient();
  const breaksQ = useQuery({
    queryKey: ["admin", "channel-breaks"],
    queryFn: () => api<Breaks>("/api/admin/channel-breaks"),
  });

  const [draft, setDraft] = React.useState<Breaks | null>(null);
  React.useEffect(() => {
    if (breaksQ.data) setDraft(breaksQ.data);
  }, [breaksQ.data]);

  const save = useMutation({
    mutationFn: (next: Breaks) =>
      api<Breaks>("/api/admin/channel-breaks", { method: "PUT", body: next }),
    onSuccess: () => {
      toast.success("Saved. The channel picks it up on the next card.");
      void qc.invalidateQueries({ queryKey: ["admin", "channel-breaks"] });
      void qc.invalidateQueries({ queryKey: ["channel", "breaks"] });
    },
    onError: (err) =>
      toast.error("Could not save", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  if (breaksQ.isError) {
    // A spinner that never stops is how a failed read looks if you only ever
    // check `isLoading`, and the person then waits for something that is not
    // coming.
    return (
      <View className="py-6">
        <Text className="text-center text-sm text-red-400">
          Could not read the channel settings.{" "}
          {breaksQ.error instanceof Error ? breaksQ.error.message : ""}
        </Text>
      </View>
    );
  }

  if (breaksQ.isLoading || !draft) {
    return (
      <View className="py-8">
        <Spinner />
      </View>
    );
  }

  const set = <K extends keyof Breaks>(key: K, value: Breaks[K]) =>
    setDraft({ ...draft, [key]: value });

  /** In rotation, or not. An empty list is the card switched off. */
  function toggleLower(style: OverlayStyle) {
    const on = draft!.lowerThirdStyles.includes(style);
    set(
      "lowerThirdStyles",
      on
        ? draft!.lowerThirdStyles.filter((s) => s !== style)
        : [...draft!.lowerThirdStyles, style],
    );
  }

  function toggleUpNext(style: UpNextStyle) {
    const on = draft!.upNextStyles.includes(style);
    set(
      "upNextStyles",
      on
        ? draft!.upNextStyles.filter((s) => s !== style)
        : [...draft!.upNextStyles, style],
    );
  }

  const lowerPreview = draft.lowerThirdStyles[0] ?? draft.lowerThirdStyle ?? "bar";
  const upNextPreview = draft.upNextStyles[0] ?? draft.upNextStyle ?? "centre";

  return (
    <View className="gap-4">
      <View>
        <Text className="text-base font-semibold text-foreground">On-air cards</Text>
        <Text className="mt-0.5 text-[11px] text-muted-foreground">
          What the channel says over the picture, and how often it says it. The
          same settings drive the website.
        </Text>
      </View>

      <Toggle
        label="Channel breaks"
        hint="The master switch for ad breaks and the lower third. Filler for a dropped feed has its own switch and ignores this one."
        value={draft.enabled}
        onChange={(v) => set("enabled", v)}
      />

      <View className="flex-row gap-3">
        <Number
          label="Ad break every"
          suffix="min"
          hint="0 turns breaks off"
          value={draft.adIntervalMin}
          onChange={(v) => set("adIntervalMin", clamp(v, 0, 240))}
        />
        <Number
          label="Longest an ad holds"
          suffix="sec"
          hint="Then the feed returns"
          value={draft.adMaxSec}
          onChange={(v) => set("adMaxSec", clamp(v, 5, 180))}
        />
      </View>

      <View className="flex-row gap-3">
        <Number
          label="Lower third every"
          suffix="min"
          hint="0 turns the card off"
          value={draft.overlayIntervalMin}
          onChange={(v) => set("overlayIntervalMin", clamp(v, 0, 240))}
        />
        <Number
          label="It stays for"
          suffix="sec"
          hint="Long enough to read"
          value={draft.overlayDurationSec}
          onChange={(v) => set("overlayDurationSec", clamp(v, 3, 60))}
        />
      </View>

      <Toggle
        label="Cover a dropped feed with filler"
        hint="Works even with breaks off. When the manifest dies, the filler creatives loop instead of a black rectangle."
        value={draft.fillerOnDrop}
        onChange={(v) => set("fillerOnDrop", v)}
      />

      <Chips
        title="Lower thirds in rotation"
        hint="Tap to add or remove. Nothing selected turns the lower third off; the channel cycles the rest in this order."
        options={Object.keys(LOWER_THIRD_LABELS) as OverlayStyle[]}
        labels={LOWER_THIRD_LABELS}
        selected={draft.lowerThirdStyles}
        onToggle={toggleLower}
      />

      <View>
        <Text className="mb-1.5 text-xs text-muted-foreground">Preview</Text>
        <View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#111", borderRadius: 10, overflow: "hidden" }}>
          <LowerThird
            key={lowerPreview}
            style={lowerPreview}
            copy={{ ...PREVIEW, templateUrl: draft.lowerThirdUrl || undefined }}
          />
        </View>
      </View>

      <Chips
        title="Full-screen cards in rotation"
        hint="Shown once per programme, before it starts."
        options={Object.keys(UP_NEXT_LABELS) as UpNextStyle[]}
        labels={UP_NEXT_LABELS}
        selected={draft.upNextStyles}
        onToggle={toggleUpNext}
      />

      <View className="flex-row gap-3">
        <Number
          label="Minutes before it plays"
          suffix="min"
          hint="0 turns it off"
          value={draft.upNextLeadMin}
          onChange={(v) => set("upNextLeadMin", clamp(v, 0, 60))}
        />
        <Number
          label="How long it holds"
          suffix="sec"
          hint="Once per programme"
          value={draft.upNextSec}
          onChange={(v) => set("upNextSec", clamp(v, 3, 60))}
        />
      </View>

      <View>
        <Text className="mb-1.5 text-xs text-muted-foreground">Preview</Text>
        <View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#111", borderRadius: 10, overflow: "hidden" }}>
          <UpNextCard
            key={upNextPreview}
            style={upNextPreview}
            copy={{ ...PREVIEW, templateUrl: draft.upNextUrl || undefined }}
            secondsToStart={95}
          />
        </View>
      </View>

      <Button
        style={{ backgroundColor: palette.brand }}
        disabled={save.isPending}
        onPress={() => save.mutate(draft)}
      >
        <Text className="text-sm font-semibold" style={{ color: palette.bg }}>
          {save.isPending ? "Saving…" : "Save channel breaks"}
        </Text>
      </Button>
    </View>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const palette = useTokens();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      className="flex-row items-center justify-between rounded-lg p-3"
      style={{ backgroundColor: palette.surface }}
    >
      <View className="flex-1 pr-3">
        <Text className="text-sm text-foreground">{label}</Text>
        <Text className="text-[11px] text-muted-foreground">{hint}</Text>
      </View>
      <View
        className="h-6 w-10 justify-center rounded-full px-0.5"
        style={{ backgroundColor: value ? palette.brand : palette.subtle }}
      >
        <View
          className={`h-5 w-5 rounded-full bg-white ${value ? "self-end" : "self-start"}`}
        />
      </View>
    </Pressable>
  );
}

function Number({
  label,
  suffix,
  hint,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  hint: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const palette = useTokens();
  return (
    <View className="flex-1">
      <Text className="mb-1.5 text-xs text-muted-foreground">
        {label}, {suffix}
      </Text>
      <TextInput
        keyboardType="number-pad"
        value={String(value)}
        onChangeText={(t) => onChange(globalThis.Number(t) || 0)}
        className="rounded-md px-3 py-2 text-sm text-foreground"
        style={{ backgroundColor: palette.surface }}
        placeholderTextColor={palette.muted}
      />
      <Text className="mt-1 text-[10px] text-muted-foreground">{hint}</Text>
    </View>
  );
}

function Chips<T extends string>({
  title,
  hint,
  options,
  labels,
  selected,
  onToggle,
}: {
  title: string;
  hint: string;
  options: T[];
  labels: Record<T, string>;
  selected: T[];
  onToggle: (style: T) => void;
}) {
  const palette = useTokens();
  return (
    <View>
      <Text className="mb-1.5 text-sm text-foreground">{title}</Text>
      <View className="flex-row flex-wrap gap-1.5">
        {options.map((style) => {
          const on = selected.includes(style);
          return (
            <Pressable
              key={style}
              onPress={() => onToggle(style)}
              className="rounded-full px-3 py-1.5"
              style={{ backgroundColor: on ? palette.brandDim : palette.surface }}
            >
              <Text
                className="text-[11px]"
                style={{ color: on ? palette.brand : palette.muted }}
              >
                {labels[style]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-1.5 text-[11px] text-muted-foreground">{hint}</Text>
    </View>
  );
}

export default ChannelBreaksCard;
