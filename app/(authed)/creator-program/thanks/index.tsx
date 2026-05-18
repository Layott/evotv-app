import * as React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react-native";

import { useMockAuth } from "@/components/providers";
import { listGames } from "@/lib/api/games";
import { getMyApplication } from "@/lib/api/creator-program";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function CreatorProgramThanksScreen() {
  const router = useRouter();
  const { user } = useMockAuth();

  const appQ = useQuery({
    queryKey: ["creator-program", "application", user?.id ?? ""],
    queryFn: () => getMyApplication(),
    enabled: !!user,
  });
  const gamesQ = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const games = gamesQ.data ?? [];

  React.useEffect(() => {
    if (appQ.isSuccess && !appQ.data) {
      router.replace("/(authed)/creator-program");
    }
  }, [appQ.isSuccess, appQ.data, router]);

  if (!user || appQ.isLoading || !appQ.data) {
    return (
      <>
        <Stack.Screen options={{ title: "Application status" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  const app = appQ.data;
  const gameName =
    games.find((g) => g.id === app.primaryGameId)?.shortName ?? app.primaryGameId;

  return (
    <>
      <Stack.Screen options={{ title: "Application status" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-4 py-6 pb-24"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 flex-row items-center gap-3">
          <Pressable
            onPress={() => router.push("/(authed)/creator-program")}
            className="h-9 w-9 items-center justify-center rounded-md border border-border bg-card"
            accessibilityRole="button"
            accessibilityLabel="Back to creator program"
          >
            <ArrowLeft size={16} color="#FAFAFA" />
          </Pressable>
          <Text className="text-lg font-bold text-foreground">
            Application status
          </Text>
        </View>

        <View className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8">
          <View className="mx-auto h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
            <CheckCircle2 size={28} color="#022C22" />
          </View>
          <Text className="mt-4 text-center text-2xl font-bold text-foreground">
            Thanks — we got it.
          </Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Your application is in our review queue. Most decisions land within 5 working days.
          </Text>
          <View className="mt-3 flex-row justify-center">
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10"
              textClassName="text-emerald-200"
            >
              {app.status === "submitted"
                ? "Status: Submitted"
                : `Status: ${app.status.replace(/_/g, " ")}`}
            </Badge>
          </View>
        </View>

        <View className="mt-6 rounded-2xl border border-border bg-card/40 p-5">
          <Text className="text-sm font-semibold text-foreground">
            Application snapshot
          </Text>
          <View className="mt-3 gap-3">
            <SnapRow label="Country">{app.country}</SnapRow>
            <SnapRow label="Primary game">{gameName}</SnapRow>
            <SnapRow label="Platform">{app.socialPlatform}</SnapRow>
            <SnapRow label="Handle">{app.socialHandle}</SnapRow>
            <SnapRow label="Followers">{app.followerCount.toLocaleString()}</SnapRow>
            <SnapRow label="Submitted">
              {new Date(app.submittedAt).toLocaleString()}
            </SnapRow>
          </View>
          <View className="mt-4 rounded-lg border border-border bg-background p-3">
            <Text className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Bio
            </Text>
            <Text className="mt-1 text-sm text-foreground">{app.bio}</Text>
          </View>
        </View>

        <View className="mt-6 gap-3">
          <ActionTile
            icon={BarChart3}
            iconColor="#7DD3FC"
            title="Preview your dashboard"
            desc="See what tips, payouts, and audience views will look like."
            onPress={() => router.push("/(authed)/creator-dashboard")}
          />
          <ActionTile
            icon={Mail}
            iconColor="#FCD34D"
            title="Reach a manager"
            desc="Email creators@evo.tv to fast-track or ask follow-up questions."
            onPress={() => Linking.openURL("mailto:creators@evo.tv").catch(() => {})}
          />
          <ActionTile
            icon={Sparkles}
            iconColor="#F0ABFC"
            title="Browse top creators"
            desc="Get inspired by top-performing African creators while you wait."
            onPress={() => router.push("/(public)/discover" as never)}
          />
        </View>

        <View className="mt-6 flex-row items-center justify-center gap-1.5">
          <Text className="text-[11px] text-muted-foreground">
            Need urgent help? Reach the on-duty manager via the
          </Text>
          <MessageCircle size={12} color="#A3A3A3" />
          <Text className="text-[11px] text-foreground">Discord</Text>
          <Text className="text-[11px] text-muted-foreground">creator channel.</Text>
        </View>

        <View className="mt-6">
          <Button
            variant="outline"
            onPress={() => router.push("/(authed)/creator-program")}
            className="h-11"
          >
            <ArrowLeft size={16} color="#FAFAFA" />
            <Text className="text-sm font-medium text-foreground">
              Back to program
            </Text>
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

function SnapRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="rounded-lg border border-border bg-background p-3">
      <Text className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </Text>
      <Text className="mt-0.5 text-sm text-foreground">
        {typeof children === "string" || typeof children === "number"
          ? String(children)
          : null}
      </Text>
    </View>
  );
}

function ActionTile({
  icon: Icon,
  iconColor,
  title,
  desc,
  onPress,
}: {
  icon: import("lucide-react-native").LucideIcon;
  iconColor: string;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-border bg-card/40 p-5 active:opacity-80"
    >
      <Icon size={22} color={iconColor} />
      <Text className="mt-3 text-sm font-semibold text-foreground">{title}</Text>
      <Text className="mt-1 text-xs text-muted-foreground">{desc}</Text>
    </Pressable>
  );
}
