import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Check,
  Shield,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { listGames, listTeams } from "@/lib/mock";
import type { Game, Team, UserPrefs } from "@/lib/types";
import { useMockAuth } from "@/components/providers";

type NotifKey = keyof UserPrefs["notifOptIn"];

interface WizardState {
  games: string[];
  teams: string[];
  notif: UserPrefs["notifOptIn"];
  theme: UserPrefs["theme"];
  language: UserPrefs["language"];
  quality: UserPrefs["playback"]["defaultQuality"];
}

const INITIAL_STATE: WizardState = {
  games: [],
  teams: [],
  notif: {
    goLive: true,
    eventReminder: true,
    newVod: true,
    weeklyDigest: false,
  },
  theme: "dark",
  language: "en",
  quality: "auto",
};

const LANGUAGES: { code: UserPrefs["language"]; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
  { code: "sw", label: "Kiswahili" },
];

const QUALITIES: UserPrefs["playback"]["defaultQuality"][] = [
  "auto",
  "1080p",
  "720p",
  "480p",
  "360p",
];

const NOTIF_ITEMS: { key: NotifKey; title: string; body: string }[] = [
  {
    key: "goLive",
    title: "Go-live alerts",
    body: "Get pinged when teams or streamers you follow start broadcasting.",
  },
  {
    key: "eventReminder",
    title: "Event reminders",
    body: "Heads-up 15 minutes before tournaments and finals start.",
  },
  {
    key: "newVod",
    title: "New VOD drops",
    body: "When a highlight or full VOD publishes from your favourites.",
  },
  {
    key: "weeklyDigest",
    title: "Weekly digest",
    body: "A Sunday recap of matches, standings, and upcoming events.",
  },
];

const STEP_TITLES: ReadonlyArray<{
  title: string;
  subtitle: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Pick your games",
    subtitle: "Choose at least one to personalize your feed.",
    Icon: Shield,
  },
  {
    title: "Follow teams",
    subtitle: "Track squads across your selected games.",
    Icon: Users,
  },
  {
    title: "Stay in the loop",
    subtitle: "We only ping you when it matters.",
    Icon: BellRing,
  },
  {
    title: "Make it yours",
    subtitle: "Language, theme and playback defaults.",
    Icon: SlidersHorizontal,
  },
];

const compactNumber = new Intl.NumberFormat("en", { notation: "compact" });

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useMockAuth();

  const [step, setStep] = React.useState(1);
  const [state, setState] = React.useState<WizardState>(INITIAL_STATE);
  const [submitting, setSubmitting] = React.useState(false);

  const [games, setGames] = React.useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = React.useState(true);

  const [teams, setTeams] = React.useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setGamesLoading(true);
    listGames().then((g) => {
      if (!cancelled) {
        setGames(g);
        setGamesLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (step !== 2 || state.games.length === 0) return;
    let cancelled = false;
    setTeamsLoading(true);
    Promise.all(
      state.games.map((gameId) => listTeams({ gameId })),
    ).then((results) => {
      if (cancelled) return;
      const flat = results.flat();
      const dedup = Array.from(new Map(flat.map((t) => [t.id, t])).values());
      dedup.sort((a, b) => a.ranking - b.ranking);
      setTeams(dedup);
      setTeamsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [step, state.games]);

  const toggleGame = (id: string) =>
    setState((s) => ({
      ...s,
      games: s.games.includes(id)
        ? s.games.filter((g) => g !== id)
        : [...s.games, id],
      teams: s.games.includes(id)
        ? s.teams.filter((teamId) => {
            const t = teams.find((x) => x.id === teamId);
            return t ? t.gameId !== id : true;
          })
        : s.teams,
    }));

  const toggleTeam = (id: string) =>
    setState((s) => ({
      ...s,
      teams: s.teams.includes(id)
        ? s.teams.filter((t) => t !== id)
        : [...s.teams, id],
    }));

  const toggleNotif = (key: NotifKey) =>
    setState((s) => ({
      ...s,
      notif: { ...s.notif, [key]: !s.notif[key] },
    }));

  const canProceed =
    step === 1 ? state.games.length >= 1 : step === 4 ? !submitting : true;

  const handleNext = async () => {
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      completeOnboarding();
      toast.success("You're all set", {
        description: "Welcome to EVO TV.",
      });
      router.replace("/(public)/home");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const progressPct = (step / 4) * 100;
  const current = STEP_TITLES[step - 1];
  const Icon = current.Icon;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-6 pb-10 pt-12"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Step {step} of 4
          </Text>
          <Link href="/(public)/home" asChild>
            <Pressable
              onPress={() => completeOnboarding()}
              hitSlop={8}
            >
              <Text className="text-xs font-medium text-muted-foreground">
                Skip for now
              </Text>
            </Pressable>
          </Link>
        </View>

        <Progress
          value={progressPct}
          className="h-1.5"
          indicatorClassName="bg-brand"
        />

        <View className="mt-6 mb-4">
          <View className="flex-row items-center gap-2">
            <Icon color="#2CD7E3" size={20} />
            <Text className="text-2xl font-bold text-foreground">
              {current.title}
            </Text>
          </View>
          <Text className="mt-1 text-sm text-muted-foreground">
            {current.subtitle}
          </Text>
        </View>

        <View className="rounded-2xl border border-border bg-card/40 p-5">
          {step === 1 ? (
            <StepGames
              games={games}
              loading={gamesLoading}
              selected={state.games}
              onToggle={toggleGame}
            />
          ) : step === 2 ? (
            <StepTeams
              loading={teamsLoading}
              teams={teams}
              gamesLookup={new Map(games.map((g) => [g.id, g]))}
              selected={state.teams}
              onToggle={toggleTeam}
            />
          ) : step === 3 ? (
            <StepNotifications
              notif={state.notif}
              onToggle={toggleNotif}
            />
          ) : (
            <StepPreferences
              theme={state.theme}
              language={state.language}
              quality={state.quality}
              onThemeChange={(theme) => setState((s) => ({ ...s, theme }))}
              onLanguageChange={(language) =>
                setState((s) => ({ ...s, language }))
              }
              onQualityChange={(quality) =>
                setState((s) => ({ ...s, quality }))
              }
            />
          )}
        </View>

        <View className="mt-6 flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            onPress={handleBack}
            disabled={step === 1 || submitting}
            className="h-11 flex-1"
          >
            <ArrowLeft color="#FAFAFA" size={16} />
            <Text className="text-sm font-medium text-foreground">Back</Text>
          </Button>
          <Button
            onPress={handleNext}
            disabled={!canProceed || submitting}
            className="h-11 flex-1 bg-brand"
            textClassName="font-semibold text-black"
          >
            {submitting ? (
              <View className="flex-row items-center gap-2">
                <Spinner color="#000000" />
                <Text className="font-semibold text-black">Finishing...</Text>
              </View>
            ) : step === 4 ? (
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-black">Finish</Text>
                <Check color="#000000" size={16} />
              </View>
            ) : (
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-black">Continue</Text>
                <ArrowRight color="#000000" size={16} />
              </View>
            )}
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

/* ------------------------------- Step 1: Games ------------------------------ */

function StepGames({
  games,
  loading,
  selected,
  onToggle,
}: {
  games: Game[];
  loading: boolean;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (loading) {
    return (
      <View className="gap-3">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className="h-32 rounded-xl"
            style={{ backgroundColor: "#171717" }}
          />
        ))}
      </View>
    );
  }
  return (
    <View className="gap-3">
      {games.map((g) => {
        const isSelected = selected.includes(g.id);
        return (
          <Pressable
            key={g.id}
            onPress={() => onToggle(g.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={cn(
              "overflow-hidden rounded-xl border bg-background",
              isSelected ? "border-brand" : "border-border",
            )}
            style={
              isSelected
                ? {
                    borderColor: "#2CD7E3",
                    borderWidth: 2,
                  }
                : undefined
            }
          >
            <View
              style={{
                aspectRatio: 16 / 9,
                width: "100%",
                position: "relative",
              }}
            >
              <Image
                source={{ uri: g.coverUrl }}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                contentFit="cover"
                transition={200}
              />
              {isSelected ? (
                <View
                  className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-brand"
                >
                  <Check color="#000000" size={14} />
                </View>
              ) : null}
            </View>
            <View className="gap-1 p-3">
              <View className="flex-row items-center gap-2">
                <Text
                  className="flex-1 text-sm font-semibold text-foreground"
                  numberOfLines={1}
                >
                  {g.shortName}
                </Text>
                <View className="rounded bg-muted px-1.5 py-0.5">
                  <Text className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {g.platform}
                  </Text>
                </View>
              </View>
              <Text className="text-[11px] text-muted-foreground">
                {compactNumber.format(g.activePlayers)} active players
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------ Step 2: Teams ------------------------------- */

function StepTeams({
  loading,
  teams,
  gamesLookup,
  selected,
  onToggle,
}: {
  loading: boolean;
  teams: Team[];
  gamesLookup: Map<string, Game>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (loading) {
    return (
      <View className="gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            className="h-16 rounded-lg"
            style={{ backgroundColor: "#171717" }}
          />
        ))}
      </View>
    );
  }
  if (teams.length === 0) {
    return (
      <Text className="text-sm text-muted-foreground">
        No teams available for your selected games.
      </Text>
    );
  }
  return (
    <View className="gap-2">
      {teams.map((t) => {
        const isSelected = selected.includes(t.id);
        const game = gamesLookup.get(t.gameId);
        return (
          <Pressable
            key={t.id}
            onPress={() => onToggle(t.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={cn(
              "flex-row items-center gap-3 rounded-lg border bg-background p-3",
              isSelected ? "border-brand" : "border-border",
            )}
            style={
              isSelected
                ? { borderColor: "#2CD7E3", borderWidth: 2 }
                : undefined
            }
          >
            <View
              className="overflow-hidden rounded-md"
              style={{
                width: 40,
                height: 40,
                backgroundColor: "#262626",
              }}
            >
              <Image
                source={{ uri: t.logoUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className="flex-shrink text-sm font-semibold text-foreground"
                  numberOfLines={1}
                >
                  {t.name}
                </Text>
                <View className="rounded bg-muted px-1.5 py-0.5">
                  <Text className="font-mono text-[10px] font-semibold text-muted-foreground">
                    {t.tag}
                  </Text>
                </View>
              </View>
              <Text
                className="text-[11px] text-muted-foreground"
                numberOfLines={1}
              >
                {game?.shortName ?? "Unknown"} · {t.country} · #{t.ranking}
              </Text>
            </View>
            <View
              className="h-5 w-5 items-center justify-center rounded-full"
              style={{
                borderWidth: 1,
                borderColor: isSelected ? "#2CD7E3" : "#404040",
                backgroundColor: isSelected ? "#2CD7E3" : "transparent",
              }}
            >
              {isSelected ? <Check color="#000000" size={12} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/* --------------------------- Step 3: Notifications -------------------------- */

function StepNotifications({
  notif,
  onToggle,
}: {
  notif: UserPrefs["notifOptIn"];
  onToggle: (k: NotifKey) => void;
}) {
  return (
    <View className="gap-3">
      {NOTIF_ITEMS.map((n) => {
        const checked = notif[n.key];
        return (
          <View
            key={n.key}
            className="flex-row items-start gap-4 rounded-lg border border-border bg-background p-4"
          >
            <View className="min-w-0 flex-1">
              <Label className="text-sm font-semibold text-foreground">
                {n.title}
              </Label>
              <Text className="mt-1 text-xs text-muted-foreground">
                {n.body}
              </Text>
            </View>
            <Switch
              checked={checked}
              onCheckedChange={() => onToggle(n.key)}
            />
          </View>
        );
      })}
    </View>
  );
}

/* --------------------------- Step 4: Preferences ---------------------------- */

function StepPreferences({
  theme,
  language,
  quality,
  onThemeChange,
  onLanguageChange,
  onQualityChange,
}: {
  theme: UserPrefs["theme"];
  language: UserPrefs["language"];
  quality: UserPrefs["playback"]["defaultQuality"];
  onThemeChange: (t: UserPrefs["theme"]) => void;
  onLanguageChange: (l: UserPrefs["language"]) => void;
  onQualityChange: (q: UserPrefs["playback"]["defaultQuality"]) => void;
}) {
  return (
    <View className="gap-6">
      <View className="gap-2">
        <Label className="font-semibold text-foreground">Theme</Label>
        <View className="flex-row gap-2">
          {(["system", "light", "dark"] as const).map((opt) => {
            const active = theme === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => onThemeChange(opt)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className={cn(
                  "flex-1 items-center justify-center rounded-lg border bg-background px-3 py-2.5",
                  active ? "border-brand" : "border-border",
                )}
                style={
                  active ? { borderColor: "#2CD7E3", borderWidth: 2 } : undefined
                }
              >
                <Text
                  className={cn(
                    "text-sm capitalize",
                    active ? "text-brand" : "text-foreground",
                  )}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <Label className="font-semibold text-foreground">Language</Label>
        <Select
          value={language}
          onValueChange={(v) => onLanguageChange(v as UserPrefs["language"])}
        >
          <SelectTrigger className="h-11 w-full border border-border bg-card">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                <View className="flex-row items-center gap-2">
                  <Text className="font-mono text-xs text-muted-foreground">
                    {l.code}
                  </Text>
                  <Text className="text-foreground">{l.label}</Text>
                </View>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </View>

      <View className="gap-2">
        <Label className="font-semibold text-foreground">
          Default playback quality
        </Label>
        <View className="flex-row gap-2">
          {QUALITIES.map((q) => {
            const active = quality === q;
            return (
              <Pressable
                key={q}
                onPress={() => onQualityChange(q)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={cn(
                  "flex-1 items-center justify-center rounded-lg border bg-background py-2",
                  active ? "border-brand" : "border-border",
                )}
                style={
                  active ? { borderColor: "#2CD7E3", borderWidth: 2 } : undefined
                }
              >
                <Text
                  className={cn(
                    "text-xs font-semibold",
                    active ? "text-brand" : "text-muted-foreground",
                  )}
                >
                  {q}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        className="flex-row items-start gap-2 rounded-lg p-3"
        style={{
          backgroundColor: "rgba(44,215,227,0.05)",
          borderWidth: 1,
          borderColor: "rgba(44,215,227,0.20)",
        }}
      >
        <Checkbox
          checked
          disabled
          className="mt-0.5"
        />
        <Text className="flex-1 text-xs text-foreground">
          Your preferences save to this device. Sign in anywhere to sync them
          across EVO TV.
        </Text>
      </View>
    </View>
  );
}
