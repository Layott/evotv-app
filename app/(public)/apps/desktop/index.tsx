import * as React from "react";
import { Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import {
  ArrowLeft,
  Bell,
  Download,
  Monitor,
} from "lucide-react-native";

import {
  listAppPlatforms,
  type AppKind,
  type AppPlatform,
} from "@/lib/mock/apps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformIcon, StatusPill } from "@/components/apps/platform-bits";

const FAKE_BUILD_URLS: Record<AppKind, string> = {
  windows: "https://downloads.evo.tv/desktop/EVOTV-Setup-0.7.1.exe",
  macos: "https://downloads.evo.tv/desktop/EVOTV-0.7.1.dmg",
  linux: "https://downloads.evo.tv/desktop/EVOTV-0.7.1.AppImage",
  tv: "",
  android: "",
  ios: "",
};

const PLATFORM_LABEL: Record<AppKind, string> = {
  windows: "Windows 10/11 · 64-bit",
  macos: "Universal · Apple Silicon + Intel",
  linux: "AppImage · Ubuntu/Debian",
  tv: "",
  android: "",
  ios: "",
};

interface PlatformCardProps {
  app: AppPlatform;
}

function PlatformCard({ app }: PlatformCardProps) {
  const url = FAKE_BUILD_URLS[app.kind];
  const onDownload = () => {
    if (app.status === "coming-soon") {
      toast(`${app.name} not ready yet`, {
        description: "We'll email you the moment it lands.",
      });
      return;
    }
    Linking.openURL(url).catch(() => {
      toast.error("Could not start download");
    });
    toast.success(`Downloading ${app.name}`);
  };

  return (
    <View className="rounded-2xl border border-border bg-card p-5 gap-3">
      <View className="flex-row items-center justify-between">
        <View
          className="h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: "rgba(64,64,64,0.6)" }}
        >
          <PlatformIcon kind={app.kind} size={22} />
        </View>
        <StatusPill status={app.status} />
      </View>
      <View>
        <Text className="text-base font-semibold text-foreground">
          {app.name}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {PLATFORM_LABEL[app.kind]}
        </Text>
      </View>
      <Text
        className="text-sm text-muted-foreground"
        numberOfLines={3}
      >
        {app.blurb}
      </Text>
      <View className="flex-row items-center justify-between border-t border-border pt-3">
        <Text className="text-xs text-muted-foreground">
          v{app.version} · {app.size}
        </Text>
        <Button
          size="sm"
          className="bg-brand"
          textClassName="text-black font-semibold"
          onPress={onDownload}
          disabled={app.status === "coming-soon"}
        >
          <Download size={14} color="#000" />
          Download
        </Button>
      </View>
    </View>
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
          toast.success("On the list");
          setEmail("");
        }}
      >
        Notify me
      </Button>
    </View>
  );
}

export default function AppsDesktopScreen() {
  const router = useRouter();
  const { data: apps, isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: () => listAppPlatforms(),
  });

  if (isLoading || !apps) {
    return (
      <>
        <Stack.Screen options={{ title: "Desktop" }} />
        <View className="flex-1 bg-background gap-3 p-4">
          <Skeleton style={{ height: 32, width: "60%" }} />
          <Skeleton style={{ height: 200, borderRadius: 16 }} />
        </View>
      </>
    );
  }

  const desktops = apps.filter((a) => a.family === "desktop");
  const sample = desktops[0];

  return (
    <>
      <Stack.Screen options={{ title: "Desktop" }} />
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

        <View className="px-4 pt-4 gap-3 items-start">
          <Badge
            variant="outline"
            className="border-brand"
            textClassName="text-brand"
          >
            <Monitor size={11} color="#2CD7E3" /> Desktop apps
          </Badge>
          <Text className="text-3xl font-bold text-foreground">
            EVO TV for the desk.
          </Text>
          <Text className="text-sm text-muted-foreground">
            A dedicated player for Windows, macOS, and Linux. Slim chat dock,
            global hotkeys, mini-player mode for second monitors. Built for the
            multi-screen pro.
          </Text>
        </View>

        {sample ? (
          <View className="mt-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
            >
              {sample.screenshots.map((s, i) => (
                <View
                  key={`shot-${i}`}
                  style={{ width: 280, aspectRatio: 16 / 10 }}
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
          </View>
        ) : null}

        <View className="px-4 pt-8 gap-3">
          <Text className="text-base font-semibold text-foreground">
            Pick your platform
          </Text>
          {desktops.map((a) => (
            <PlatformCard key={a.id} app={a} />
          ))}
        </View>

        <View className="px-4 pt-8 gap-4">
          <View className="rounded-2xl border border-border bg-card p-5 gap-2">
            <Text className="text-base font-semibold text-foreground">
              Built for power users
            </Text>
            <View className="gap-1.5 mt-1">
              {[
                "Always-on-top mini player for second monitors",
                "Global hotkeys (mute, pause, swap stream)",
                "Native notifications when a tracked team goes live",
                "System tray quick-launch",
              ].map((line) => (
                <Text
                  key={line}
                  className="text-sm text-muted-foreground"
                >
                  · {line}
                </Text>
              ))}
            </View>
          </View>
          <NotifyForm platformLabel="EVO TV for Linux" />
        </View>
      </ScrollView>
    </>
  );
}
