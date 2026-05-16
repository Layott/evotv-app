import * as React from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { toast } from "sonner-native";
import {
  ArrowRight,
  Check,
  Code2,
  Copy,
  Gamepad2,
  Globe,
  Headphones,
  Info,
  Layers,
  type LucideIcon,
  Shield,
  Sparkles,
  Tv,
  Zap,
} from "lucide-react-native";

import { Badge } from "@/components/ui/badge";
import { EMBED_SIZE_PRESETS, buildEmbedSnippet } from "@/lib/mock/embed";

const BRAND = "#2CD7E3";
const BRAND_RGBA = (a: number) => `rgba(44,215,227,${a})`;

const PILLAR_CARDS: {
  pillar: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  tint: string;
}[] = [
  {
    pillar: "Esports",
    title: "Live matches + tournament VODs",
    blurb:
      "Drop a live esports stream or finals VOD into your match report, league site, or fantasy hub.",
    icon: Gamepad2,
    tint: "#a78bfa",
  },
  {
    pillar: "Anime",
    title: "Reaction streams + watch-alongs",
    blurb:
      "Embed anime reaction shows, cosplay streams, and otaku podcasts into your fan community.",
    icon: Sparkles,
    tint: "#f472b6",
  },
  {
    pillar: "Lifestyle",
    title: "Podcasts + talk shows",
    blurb:
      "Surface lifestyle podcasts, news shows, and creator-led talk shows alongside your articles.",
    icon: Headphones,
    tint: "#facc15",
  },
];

const STEPS: { n: number; title: string; body: string }[] = [
  {
    n: 1,
    title: "Pick the content",
    body:
      "Grab the share link of any live stream, VOD, or clip on EVO TV.",
  },
  {
    n: 2,
    title: "Paste the snippet",
    body:
      "Use our iframe code or hit the “Embed” button on any video page to copy it instantly.",
  },
  {
    n: 3,
    title: "Ship anywhere",
    body:
      "Renders on web, blogs, Notion, Webflow, Ghost, WordPress, and every CMS that allows iframes.",
  },
];

const USE_CASES: { title: string; body: string; icon: LucideIcon }[] = [
  {
    icon: Globe,
    title: "Gaming + esports blogs",
    body:
      "Pair match recaps with the actual highlight clip. Readers stay on your page, watch on EVO TV.",
  },
  {
    icon: Sparkles,
    title: "Anime + manga communities",
    body:
      "Embed creator reactions next to episode discussions. No DMCA risk — UGC commentary only.",
  },
  {
    icon: Headphones,
    title: "Lifestyle + culture sites",
    body:
      "Bring podcast guests to life with the actual interview. Lifestyle creators get more reach.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is the embed free?",
    a: "Yes. Public-facing streams, VODs, and clips are free to embed on any site. Rate-limited per origin to prevent abuse.",
  },
  {
    q: "Can I customize the player?",
    a: "Pass query params for autoplay, muted, and theme (dark / light / auto). Chat is hidden by default for embeds.",
  },
  {
    q: "What about private content?",
    a: "Subscriber-only and channel-locked content is not embeddable. Only public content surfaces in the embed picker.",
  },
  {
    q: "How does monetization work?",
    a: "Ads + tips fire inside the iframe. Creators keep the same revenue share as on EVO TV itself.",
  },
];

function PillarCard({
  item,
}: {
  item: (typeof PILLAR_CARDS)[number];
}) {
  const Icon = item.icon;
  return (
    <View
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <View
        className="px-4 py-3 flex-row items-center gap-3"
        style={{ backgroundColor: `${item.tint}15` }}
      >
        <View
          className="h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${item.tint}25` }}
        >
          <Icon size={18} color={item.tint} />
        </View>
        <View className="flex-1">
          <Text
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: item.tint }}
          >
            {item.pillar}
          </Text>
          <Text className="text-sm font-semibold text-foreground">
            {item.title}
          </Text>
        </View>
      </View>
      <View className="px-4 py-3">
        <Text className="text-sm text-muted-foreground">{item.blurb}</Text>
      </View>
    </View>
  );
}

function StepItem({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <View className="flex-row gap-3 rounded-2xl border border-border bg-card p-4">
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{
          backgroundColor: BRAND_RGBA(0.12),
          borderWidth: 1,
          borderColor: BRAND_RGBA(0.4),
        }}
      >
        <Text style={{ color: BRAND, fontWeight: "700", fontSize: 14 }}>
          {step.n}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">
          {step.title}
        </Text>
        <Text className="mt-1 text-xs text-muted-foreground">{step.body}</Text>
      </View>
    </View>
  );
}

function SnippetBlock() {
  const [copied, setCopied] = React.useState(false);
  const snippet = React.useMemo(
    () =>
      buildEmbedSnippet({
        streamId: "demo-stream-id",
        width: 720,
        height: 405,
        autoplay: false,
        muted: false,
        theme: "dark",
      }),
    [],
  );

  const onCopy = React.useCallback(async () => {
    try {
      await Clipboard.setStringAsync(snippet);
      setCopied(true);
      toast.success("Snippet copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed — long-press the snippet to copy manually.");
    }
  }, [snippet]);

  return (
    <View className="rounded-2xl border border-border bg-card overflow-hidden">
      <View className="flex-row items-center justify-between border-b border-border px-4 py-2.5">
        <View className="flex-row items-center gap-2">
          <Code2 size={14} color={BRAND} />
          <Text
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: BRAND }}
          >
            iframe snippet
          </Text>
        </View>
        <Pressable
          onPress={onCopy}
          className="flex-row items-center gap-1.5 rounded-md border border-border px-2.5 py-1 active:opacity-70"
          style={{
            backgroundColor: copied ? BRAND_RGBA(0.12) : "transparent",
            borderColor: copied ? BRAND_RGBA(0.4) : "#262626",
          }}
        >
          {copied ? (
            <Check size={12} color={BRAND} />
          ) : (
            <Copy size={12} color="#a3a3a3" />
          )}
          <Text
            className="text-[11px] font-medium"
            style={{ color: copied ? BRAND : "#a3a3a3" }}
          >
            {copied ? "Copied" : "Copy"}
          </Text>
        </Pressable>
      </View>
      <View
        className="px-4 py-3"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <Text
          selectable
          style={{
            fontFamily: "GeistMono",
            fontSize: 11,
            lineHeight: 18,
            color: "#d4d4d4",
          }}
        >
          {snippet}
        </Text>
      </View>
    </View>
  );
}

function SizesGrid() {
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Size presets
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {EMBED_SIZE_PRESETS.map((s) => (
          <View
            key={s.label}
            className="rounded-xl border border-border bg-card px-3 py-2"
          >
            <Text className="text-xs font-medium text-foreground">
              {s.width} × {s.height}
            </Text>
            <Text className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {s.label.split(" ")[0]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function UseCaseCard({ item }: { item: (typeof USE_CASES)[number] }) {
  const Icon = item.icon;
  return (
    <View className="rounded-2xl border border-border bg-card p-4 flex-row gap-3">
      <View
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: BRAND_RGBA(0.12) }}
      >
        <Icon size={18} color={BRAND} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">
          {item.title}
        </Text>
        <Text className="mt-1 text-xs text-muted-foreground">{item.body}</Text>
      </View>
    </View>
  );
}

function FaqRow({ row, last }: { row: (typeof FAQ)[number]; last: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      className={"px-4 py-3" + (last ? "" : " border-b border-border")}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-sm font-medium text-foreground">
          {row.q}
        </Text>
        <Text
          style={{
            color: open ? BRAND : "#737373",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {open ? "−" : "+"}
        </Text>
      </View>
      {open ? (
        <Text className="mt-2 text-xs text-muted-foreground">{row.a}</Text>
      ) : null}
    </Pressable>
  );
}

export default function EmbedMarketingScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: "Embed" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* HERO */}
        <View className="px-4 pt-6 gap-3">
          <Badge
            variant="outline"
            className="border-brand"
            textClassName="text-brand"
          >
            <Tv size={11} color={BRAND} /> Embed EVO TV
          </Badge>
          <Text className="text-2xl font-bold leading-tight text-foreground">
            Embed any EVO TV stream, VOD, or clip — anywhere on the web.
          </Text>
          <Text className="text-sm text-muted-foreground">
            Esports matches, anime reaction shows, lifestyle podcasts. Drop them
            into your blog, fan community, or media site in three lines of
            iframe.
          </Text>

          <View className="flex-row gap-2 pt-1">
            <Pressable
              onPress={() => router.push("/api-access" as never)}
              className="flex-row items-center gap-1.5 rounded-xl px-4 py-2.5 active:opacity-80"
              style={{ backgroundColor: BRAND }}
            >
              <Text
                style={{
                  color: "#0a0a0a",
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                Get API access
              </Text>
              <ArrowRight size={14} color="#0a0a0a" />
            </Pressable>
            <Pressable
              onPress={() => router.push("/api-access/docs" as never)}
              className="flex-row items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 active:opacity-70"
            >
              <Text className="text-sm font-medium text-foreground">
                Read the docs
              </Text>
            </Pressable>
          </View>
        </View>

        {/* PILLAR CARDS */}
        <View className="px-4 pt-8 gap-3">
          <View className="flex-row items-center gap-2">
            <Layers size={14} color={BRAND} />
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              What you can embed
            </Text>
          </View>
          {PILLAR_CARDS.map((item) => (
            <PillarCard key={item.pillar} item={item} />
          ))}
        </View>

        {/* HOW IT WORKS */}
        <View className="px-4 pt-8 gap-3">
          <View className="flex-row items-center gap-2">
            <Zap size={14} color={BRAND} />
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              How it works
            </Text>
          </View>
          {STEPS.map((s) => (
            <StepItem key={s.n} step={s} />
          ))}
        </View>

        {/* SNIPPET */}
        <View className="px-4 pt-8 gap-3">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Example
          </Text>
          <SnippetBlock />
          <Text className="text-[11px] text-muted-foreground">
            Replace <Text style={{ fontFamily: "GeistMono" }}>demo-stream-id</Text>{" "}
            with the actual stream, VOD, or clip ID from the share menu.
          </Text>
        </View>

        {/* SIZES */}
        <View className="px-4 pt-8">
          <SizesGrid />
        </View>

        {/* USE CASES */}
        <View className="px-4 pt-8 gap-3">
          <View className="flex-row items-center gap-2">
            <Globe size={14} color={BRAND} />
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Built for
            </Text>
          </View>
          {USE_CASES.map((u) => (
            <UseCaseCard key={u.title} item={u} />
          ))}
        </View>

        {/* FAQ */}
        <View className="px-4 pt-8 gap-3">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            FAQ
          </Text>
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            {FAQ.map((row, i) => (
              <FaqRow key={row.q} row={row} last={i === FAQ.length - 1} />
            ))}
          </View>
        </View>

        {/* COMPLIANCE FOOTER */}
        <View className="mx-4 mt-8 rounded-2xl border border-border bg-card p-5 flex-row gap-3">
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: BRAND_RGBA(0.15) }}
          >
            <Shield size={18} color={BRAND} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">
              Fair-use embedding
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              Embedding obeys creator + EVO TV terms. Subscriber-only and
              channel-locked content is not embeddable. Rate-limited per origin
              to prevent scraping. Don’t use embeds to wrap our player inside a
              competing product — see{" "}
              <Text
                style={{ color: BRAND }}
                onPress={() => Linking.openURL("https://evo.tv/legal/terms")}
              >
                Terms
              </Text>
              .
            </Text>
          </View>
        </View>

        <View className="mx-4 mt-3 flex-row items-start gap-2 rounded-lg border border-border bg-card p-3">
          <Info size={13} color="#737373" />
          <Text className="flex-1 text-xs text-muted-foreground">
            Need higher rate limits, custom branding, or analytics on embedded
            views? Apply for an API partnership from the API access page.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
