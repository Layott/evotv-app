import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useMockAuth } from "@/components/providers";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ReportButton } from "@/components/common/report-button";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import {
  getUserByHandle,
  listFollows,
  listPlayers,
  listTeams,
} from "@/lib/mock";
import type { Player, Profile, Team } from "@/lib/types";

export default function PublicProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const { isFollowing, toggleFollow } = useMockAuth();

  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [missing, setMissing] = React.useState(false);

  React.useEffect(() => {
    if (!handle) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const p = await getUserByHandle(handle);
      if (cancelled) return;
      if (!p) {
        setMissing(true);
        setLoading(false);
        return;
      }
      setProfile(p);
      const [follows, allTeams, allPlayers] = await Promise.all([
        listFollows(p.id),
        listTeams(),
        listPlayers(),
      ]);
      if (cancelled) return;
      const teamIds = new Set(
        follows.filter((f) => f.targetType === "team").map((f) => f.targetId),
      );
      const playerIds = new Set(
        follows
          .filter((f) => f.targetType === "player")
          .map((f) => f.targetId),
      );
      setTeams(allTeams.filter((t) => teamIds.has(t.id)));
      setPlayers(allPlayers.filter((p) => playerIds.has(p.id)));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Profile" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  if (missing || !profile) {
    return (
      <>
        <Stack.Screen options={{ title: "Profile" }} />
        <View className="flex-1 items-center justify-center bg-background px-4">
          <Text className="text-base font-semibold text-foreground">
            Profile not found
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            @{handle} doesn't exist on EVO TV.
          </Text>
          <Button
            onPress={() => router.replace("/(authed)/profile")}
            className="mt-5 bg-brand"
            textClassName="text-black"
          >
            Back to your profile
          </Button>
        </View>
      </>
    );
  }

  const followingProfile = isFollowing("streamer", profile.id);

  return (
    <>
      <Stack.Screen options={{ title: `@${profile.handle}` }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-12"
      >
        <View className="px-4 pt-4">
          <ProfileHeader
            profile={profile}
            canEdit={false}
            isFollowing={followingProfile}
            onFollowToggle={() => toggleFollow("streamer", profile.id)}
          />
          <View className="mt-3 flex-row justify-end">
            <ReportButton targetType="user" targetId={profile.id} />
          </View>
        </View>

        <View className="mt-6 px-4">
          <Tabs defaultValue="overview" className="gap-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="followed">Followed</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <View className="gap-4">
                {profile.bio ? (
                  <View className="rounded-xl border border-border bg-card p-4">
                    <Text className="text-sm font-semibold text-foreground">
                      About
                    </Text>
                    <Text className="mt-2 text-sm text-foreground/80">
                      {profile.bio}
                    </Text>
                  </View>
                ) : null}
                <View className="rounded-xl border border-border bg-card p-4">
                  <Text className="text-sm font-semibold text-foreground">
                    Details
                  </Text>
                  <View className="mt-2 gap-2">
                    <Row label="Country" value={profile.country} />
                    <Row label="Handle" value={`@${profile.handle}`} />
                    <Row label="Role" value={profile.role} />
                    <Row
                      label="Joined"
                      value={new Date(profile.createdAt).toLocaleDateString()}
                    />
                  </View>
                </View>
              </View>
            </TabsContent>

            <TabsContent value="content">
              <ProfileTabs profile={profile} />
            </TabsContent>

            <TabsContent value="followed">
              <FollowedGrid teams={teams} players={players} />
            </TabsContent>
          </Tabs>
        </View>
      </ScrollView>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-xs text-foreground">{value}</Text>
    </View>
  );
}

function FollowedGrid({
  teams,
  players,
}: {
  teams: Team[];
  players: Player[];
}) {
  const router = useRouter();
  if (teams.length === 0 && players.length === 0) {
    return (
      <View className="rounded-2xl border border-dashed border-border bg-card p-8">
        <Text className="text-center text-sm text-muted-foreground">
          Not following anyone yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {teams.length > 0 ? (
        <View>
          <Text className="mb-2 text-sm font-semibold text-foreground">
            Teams ({teams.length})
          </Text>
          <View className="gap-2">
            {teams.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/(public)/team/${t.slug}`)}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:opacity-80"
              >
                <View className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                  <Image
                    source={t.logoUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="contain"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    {t.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {t.tag} · {t.region.toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {players.length > 0 ? (
        <View>
          <Text className="mb-2 text-sm font-semibold text-foreground">
            Players ({players.length})
          </Text>
          <View className="gap-2">
            {players.map((p) => (
              <View
                key={p.id}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <View className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                  <Image
                    source={p.avatarUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    {p.handle}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {p.realName} · KDA {p.kda.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
