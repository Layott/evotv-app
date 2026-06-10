import * as React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Gamepad2,
  Radio,
  Sparkles,
  Tv,
  Users,
  X,
} from "lucide-react-native";

import { BASE_URL } from "@/lib/api/_client";
import { PRIVACY_BODY } from "@/lib/legal/privacy";
import { TERMS_BODY } from "@/lib/legal/terms";

const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/evotv%20colored-cLVxaAns95OoPRdSwAHZUktQ6y8MTs.png";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

type WaitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "done"; username: string }
  | { kind: "error"; message: string };

export function Landing() {
  const { width } = useWindowDimensions();
  const narrow = width < 760;
  const [legal, setLegal] = React.useState<null | "privacy" | "terms">(null);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 64 }}>
        <View style={{ width: "100%", maxWidth: 1120, paddingHorizontal: 24 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between py-6">
            <View className="flex-row items-center gap-2">
              <Image source={LOGO_URL} style={{ width: 34, height: 34 }} contentFit="contain" />
              <Text className="text-lg font-bold text-white">EVO TV</Text>
            </View>
            <Text className="text-xs text-muted-foreground">Launching soon</Text>
          </View>

          {/* Hero */}
          <View className="items-center pt-10">
            <View
              className="flex-row items-center gap-2 rounded-full border border-cyan-500/30 px-3 py-1"
              style={{ backgroundColor: "rgba(44,215,227,0.08)" }}
            >
              <Sparkles size={13} color="#2CD7E3" />
              <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
                Africa's streaming home
              </Text>
            </View>
            <Text
              className="mt-5 text-center font-bold text-white"
              style={{ fontSize: narrow ? 38 : 60, lineHeight: narrow ? 44 : 66, maxWidth: 880 }}
            >
              Esports, anime & lifestyle.{"\n"}
              <Text style={{ color: "#2CD7E3" }}>Live 24/7.</Text>
            </Text>
            <Text
              className="mt-4 text-center text-base text-muted-foreground"
              style={{ maxWidth: 560 }}
            >
              One channel for the culture — tournaments, originals, podcasts and
              shows, streaming around the clock. The app drops soon. Reserve your
              username now and claim it on day one.
            </Text>
          </View>

          {/* Waitlist */}
          <View className="mt-9 w-full items-center">
            <WaitlistCard />
          </View>

          {/* Pillars */}
          <View
            className="mt-16"
            style={{ flexDirection: narrow ? "column" : "row", gap: 14 }}
          >
            <Pillar
              tint="#2CD7E3"
              Icon={Gamepad2}
              title="Esports"
              body="Live tournaments, scrims and watch-alongs from across Africa."
            />
            <Pillar
              tint="#A855F7"
              Icon={Sparkles}
              title="Anime"
              body="Simulcasts, marathons and originals — subtitled and on schedule."
            />
            <Pillar
              tint="#F59E0B"
              Icon={Tv}
              title="Lifestyle"
              body="Talk shows, podcasts and culture, programmed all day long."
            />
          </View>

          {/* What you get */}
          <View className="mt-16 items-center">
            <Text className="text-center text-2xl font-bold text-white">
              Built like a TV channel
            </Text>
            <View
              className="mt-6"
              style={{ flexDirection: narrow ? "column" : "row", gap: 14, width: "100%" }}
            >
              <Feature Icon={Radio} title="Always-on channel" body="A non-stop linear feed — open the app and something's already airing." />
              <Feature Icon={Bell} title="Schedule + reminders" body="See what's on today and get pinged before it starts." />
              <Feature Icon={Users} title="Watch together" body="Watch parties, live chat and a community that shows up." />
            </View>
          </View>

          {/* Footer */}
          <View className="mt-20 border-t border-border pt-6">
            <View
              style={{ flexDirection: narrow ? "column" : "row", gap: 10 }}
              className="items-center justify-between"
            >
              <Text className="text-xs text-muted-foreground">
                © {"2026"} EVO TV. All rights reserved.
              </Text>
              <View className="flex-row items-center gap-5">
                <Pressable onPress={() => setLegal("privacy")}>
                  <Text className="text-xs text-muted-foreground">Privacy</Text>
                </Pressable>
                <Pressable onPress={() => setLegal("terms")}>
                  <Text className="text-xs text-muted-foreground">Terms</Text>
                </Pressable>
                <Text className="text-xs text-muted-foreground">hello@evo.tv</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <LegalModal which={legal} onClose={() => setLegal(null)} />
    </View>
  );
}

function WaitlistCard() {
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [avail, setAvail] = React.useState<null | "checking" | "free" | "taken">(null);
  const [state, setState] = React.useState<WaitState>({ kind: "idle" });

  const normUser = username.trim().toLowerCase();
  const userValid = USERNAME_RE.test(normUser);

  async function checkUsername() {
    if (!userValid) {
      setAvail(null);
      return;
    }
    setAvail("checking");
    try {
      const res = await fetch(`${BASE_URL}/api/waitlist?username=${encodeURIComponent(normUser)}`);
      const json = await res.json();
      setAvail(json.available ? "free" : "taken");
    } catch {
      setAvail(null);
    }
  }

  async function submit() {
    setState({ kind: "submitting" });
    try {
      const res = await fetch(`${BASE_URL}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), username: normUser }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setState({ kind: "done", username: json.username ?? normUser });
      } else {
        setState({ kind: "error", message: json.error ?? "Something went wrong." });
      }
    } catch {
      setState({ kind: "error", message: "Network error. Try again." });
    }
  }

  if (state.kind === "done") {
    return (
      <View
        className="w-full items-center rounded-2xl border border-cyan-500/40 bg-card p-7"
        style={{ maxWidth: 460 }}
      >
        <CheckCircle2 size={40} color="#2CD7E3" />
        <Text className="mt-3 text-center text-lg font-bold text-white">You're on the list!</Text>
        <Text className="mt-1 text-center text-sm text-muted-foreground">
          <Text style={{ color: "#2CD7E3" }}>@{state.username}</Text> is reserved for you. We'll
          email you the moment the app lands so you can claim it.
        </Text>
      </View>
    );
  }

  const canSubmit =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    userValid &&
    avail !== "taken" &&
    state.kind !== "submitting";

  return (
    <View
      className="w-full rounded-2xl border border-border bg-card p-6"
      style={{ maxWidth: 460 }}
    >
      <Text className="text-sm font-semibold text-white">Reserve your username</Text>
      <Text className="mt-0.5 text-xs text-muted-foreground">
        Free. No spam — one email at launch.
      </Text>

      <Text className="mb-1 mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
        Email
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        placeholderTextColor="#6b7280"
        autoCapitalize="none"
        keyboardType="email-address"
        className="rounded-lg border border-border bg-background px-3 text-sm text-white"
        style={{ height: 44 }}
      />

      <Text className="mb-1 mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        Username
      </Text>
      <View className="flex-row items-center rounded-lg border border-border bg-background px-3" style={{ height: 44 }}>
        <Text className="text-sm text-muted-foreground">@</Text>
        <TextInput
          value={username}
          onChangeText={(v) => {
            setUsername(v);
            setAvail(null);
          }}
          onBlur={checkUsername}
          placeholder="yourname"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          autoCorrect={false}
          className="ml-1 flex-1 text-sm text-white"
        />
        {avail === "free" ? <CheckCircle2 size={16} color="#2CD7E3" /> : null}
        {avail === "taken" ? <X size={16} color="#EF4444" /> : null}
      </View>
      {avail === "taken" ? (
        <Text className="mt-1 text-[11px] text-red-400">That username is taken — try another.</Text>
      ) : username.length > 0 && !userValid ? (
        <Text className="mt-1 text-[11px] text-muted-foreground">
          3-20 chars · lowercase letters, numbers, underscore.
        </Text>
      ) : null}

      {state.kind === "error" ? (
        <Text className="mt-3 text-xs text-red-400">{state.message}</Text>
      ) : null}

      <Pressable
        onPress={submit}
        disabled={!canSubmit}
        className="mt-5 flex-row items-center justify-center gap-2 rounded-lg bg-brand py-3 active:opacity-80"
        style={{ opacity: canSubmit ? 1 : 0.5 }}
      >
        <Text className="text-sm font-bold text-black">
          {state.kind === "submitting" ? "Reserving…" : "Reserve my username"}
        </Text>
        {state.kind !== "submitting" ? <ArrowRight size={16} color="#000" /> : null}
      </Pressable>
    </View>
  );
}

function Pillar({
  tint,
  Icon,
  title,
  body,
}: {
  tint: string;
  Icon: import("lucide-react-native").LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-card/40 p-5">
      <View
        className="h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${tint}1f` }}
      >
        <Icon size={22} color={tint} />
      </View>
      <Text className="mt-3 text-base font-bold text-white">{title}</Text>
      <Text className="mt-1 text-sm text-muted-foreground">{body}</Text>
    </View>
  );
}

function Feature({
  Icon,
  title,
  body,
}: {
  Icon: import("lucide-react-native").LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-card/40 p-5">
      <Icon size={20} color="#2CD7E3" />
      <Text className="mt-3 text-sm font-semibold text-white">{title}</Text>
      <Text className="mt-1 text-xs text-muted-foreground">{body}</Text>
    </View>
  );
}

function LegalModal({
  which,
  onClose,
}: {
  which: null | "privacy" | "terms";
  onClose: () => void;
}) {
  const body = which === "privacy" ? PRIVACY_BODY : which === "terms" ? TERMS_BODY : "";
  return (
    <Modal visible={which !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/70 p-6">
        <View
          className="w-full rounded-2xl border border-border bg-background"
          style={{ maxWidth: 720, maxHeight: "85%" }}
        >
          <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
            <Text className="text-base font-bold text-white">
              {which === "privacy" ? "Privacy Policy" : "Terms of Service"}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color="#A3A3A3" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text className="text-xs leading-5 text-muted-foreground">{body}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default Landing;
