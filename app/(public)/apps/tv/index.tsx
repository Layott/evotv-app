import * as React from "react";
import { Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import {
  ArrowLeft,
  Bell,
  Sparkles,
  Tv,
} from "lucide-react-native";

import {
  getAppPlatform,
  startTvPairing,
  type AppStatus,
} from "@/lib/mock/apps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/apps/platform-bits";

const FEATURES = [
  {
    title: "Built for the remote",
    body: "D-pad-first navigation. Every screen designed for one-thumb-on-the-couch operation.",
  },
  {
    title: "Picture-quality first",
    body: "4K HDR-ready playback on supported devices, with auto-bitrate that respects your network.",
  },
  {
    title: "Live + library",
    body: "One unified hub for live tournaments, on-demand recaps, and EVO Originals.",
  },
];

function ScreenshotStrip({ shots }: { shots: string[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
    >
      {shots.map((s, i) => (
        <View
          key={`shot-${i}`}
          style={{ width: 280, aspectRatio: 16 / 9 }}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <Image
            source={s}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>
      ))}
    </ScrollView>
  );
}

function NotifyForm({ platformLabel }: { platformLabel: string }) {
  const [email, setEmail] = React.useState("");
  return (
    <View className="rounded-2xl border border-border bg-card p-5 gap-3">
      <View className="flex-row items-center gap-2">
        <Bell size={16} color="#fbbf24" />
        <Text className="text-base font-semibold text-foreground">
          Notify me on launch
        </Text>
      </View>
      <Text className="text-sm text-muted-foreground">
        Get an email the moment {platformLabel} ships.
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@example.com"
        placeholderTextColor="#737373"
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
      <Button
        className="bg-brand"
        textClassName="text-black font-semibold"
        onPress={() => {
          if (!email.trim()) {
            toast.error("Add an email address");
            return;
          }
          toast.success("On the list", {
            description: "We'll notify you on launch.",
          });
          setEmail("");
        }}
      >
        Notify me
      </Button>
    </View>
  );
}

function TvPairing() {
  const [code, setCode] = React.useState<string | null>(null);

  const start = useMutation({
    mutationFn: () => startTvPairing(),
    onSuccess: (r) => {
      setCode(r.code);
      toast.success("Pairing code generated");
    },
    onError: () => toast.error("Could not generate code"),
  });

  return (
    <View className="rounded-2xl border border-border bg-card p-5 gap-3">
      <View className="flex-row items-center gap-2">
        <Tv size={16} color="#2CD7E3" />
        <Text className="text-base font-semibold text-foreground">
          Pair this phone with your TV
        </Text>
      </View>
      <Text className="text-sm text-muted-foreground">
        On your TV, install EVO TV, then enter the pairing code from the app to
        connect this phone.
      </Text>
      {code ? (
        <View
          className="rounded-xl border border-brand p-5 items-center"
          style={{ backgroundColor: "rgba(44,215,227,0.08)" }}
        >
          <Text className="text-xs uppercase text-muted-foreground">
            Pairing code
          </Text>
          <Text
            className="text-3xl font-extrabold text-foreground mt-1"
            style={{ letterSpacing: 4 }}
          >
            {code}
          </Text>
          <Text className="text-xs text-muted-foreground mt-2">
            Expires in 5:00
          </Text>
        </View>
      ) : null}
      <Button
        onPress={() => start.mutate()}
        disabled={start.isPending}
        className="bg-brand"
        textClassName="text-black font-semibold"
      >
        {code ? "Generate new code" : "Generate pairing code"}
      </Button>
    </View>
  );
}

export default function AppsTvScreen() {
  const router = useRouter();
  const { data: app, isLoading } = useQuery({
    queryKey: ["apps", "tv"],
    queryFn: () => getAppPlatform("tv"),
  });

  if (isLoading || !app) {
    return (
      <>
        <Stack.Screen options={{ title: "Smart TV" }} />
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ padding: 16, gap: 12 }}
        >
          <Skeleton style={{ height: 32, width: "60%" }} />
          <Skeleton style={{ height: 200, borderRadius: 16 }} />
          <Skeleton style={{ height: 80, borderRadius: 16 }} />
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Smart TV" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 pt-4">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-1 active:opacity-70"
          >
            <ArrowLeft size={13} color="#a3a3a3" />
            <Text className="text-xs text-muted-foreground">All apps</Text>
          </Pressable>
        </View>

        <View className="px-4 pt-4 gap-3">
          <Badge
            variant="outline"
            className="border-brand"
            textClassName="text-brand"
          >
            <Tv size={11} color="#2CD7E3" /> Built for the big screen
          </Badge>
          <Text className="text-3xl font-bold text-foreground">
            EVO TV. <Text style={{ color: "#2CD7E3" }}>On your TV.</Text>
          </Text>
          <Text className="text-sm text-muted-foreground">
            The lean-back EVO experience. 4K-ready, optimized for the remote, and
            fully D-pad navigable. Drop straight into a live tournament — no
            hunting for the right input.
          </Text>
          <View className="flex-row items-center gap-3 mt-1">
            <StatusPill status={app.status as AppStatus} />
            <Text className="text-xs text-muted-foreground">
              v{app.version ?? "0.9.0"} · {app.size}
            </Text>
          </View>
        </View>

        <View className="mt-6">
          <ScreenshotStrip shots={app.screenshots} />
        </View>

        {app.subPlatforms && app.subPlatforms.length > 0 ? (
          <View className="px-4 pt-8 gap-3">
            <Text className="text-sm font-semibold uppercase text-muted-foreground" style={{ letterSpacing: 0.5 }}>
              Supported platforms
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {app.subPlatforms.map((sp) => (
                <View
                  key={sp.id}
                  className="flex-row items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5"
                >
                  <Text className="text-xs font-semibold text-foreground">
                    {sp.name}
                  </Text>
                  <StatusPill status={sp.status} />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View className="px-4 pt-8 gap-3">
          {FEATURES.map((f) => (
            <View
              key={f.title}
              className="rounded-2xl border border-border bg-card p-5 gap-2"
            >
              <Sparkles size={18} color="#fbbf24" />
              <Text className="text-base font-semibold text-foreground">
                {f.title}
              </Text>
              <Text className="text-sm text-muted-foreground">{f.body}</Text>
            </View>
          ))}
        </View>

        <View className="px-4 pt-8 gap-4">
          <TvPairing />
          <NotifyForm platformLabel="EVO TV for Smart TV" />
        </View>

        <View className="mx-4 mt-8 rounded-2xl border border-border bg-card p-6 gap-3 items-center">
          <Text className="text-base font-semibold text-foreground text-center">
            Want it sooner?
          </Text>
          <Text className="text-sm text-muted-foreground text-center">
            The web app already works on any TV browser. Just open evo.tv in
            your TV's browser and you're in.
          </Text>
          <Button
            className="bg-brand"
            textClassName="text-black font-semibold"
            onPress={() => Linking.openURL("https://evo.tv")}
          >
            Open the web app
          </Button>
        </View>
      </ScrollView>
    </>
  );
}
