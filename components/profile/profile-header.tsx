import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Edit, MapPin, ShieldCheck, Star } from "lucide-react-native";

import type { Profile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ProfileStats {
  followers?: number;
  following?: number;
  videos?: number;
}

interface ProfileHeaderProps {
  profile: Profile;
  bannerUrl?: string;
  stats?: ProfileStats;
  canEdit?: boolean;
  onEdit?: () => void;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
}

function formatCount(n: number | undefined): string {
  if (n === undefined) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatCell({
  label,
  value,
}: {
  label: string;
  value: number | undefined;
}) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-base font-bold text-foreground">
        {formatCount(value)}
      </Text>
      <Text className="text-[11px] text-muted-foreground">{label}</Text>
    </View>
  );
}

export function ProfileHeader({
  profile,
  bannerUrl,
  stats,
  canEdit = false,
  onEdit,
  isFollowing,
  onFollowToggle,
}: ProfileHeaderProps) {
  const isPremium = profile.role === "premium";
  const isAdmin = profile.role === "admin";

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <View style={{ height: 96, backgroundColor: "#0E5F64" }}>
        {bannerUrl ? (
          <Image
            source={bannerUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : null}
      </View>

      <View className="px-5 pb-5">
        <View className="-mt-10 mb-3 flex-row items-end justify-between">
          <Pressable
            onPress={canEdit ? onEdit : undefined}
            disabled={!canEdit}
            accessibilityLabel={canEdit ? "Edit avatar" : "Avatar"}
            className="relative"
          >
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                borderWidth: 3,
                borderColor: "#0A0A0A",
                overflow: "hidden",
                backgroundColor: "#262626",
              }}
            >
              <Image
                source={profile.avatarUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
            {canEdit ? (
              <View
                className="absolute -bottom-0.5 -right-0.5 rounded-full p-1.5"
                style={{
                  backgroundColor: "#262626",
                  borderWidth: 1,
                  borderColor: "#404040",
                }}
              >
                <Edit size={14} color="#2CD7E3" />
              </View>
            ) : null}
          </Pressable>

          <View className="mb-2 flex-row gap-2">
            {canEdit ? (
              <Button
                variant="outline"
                size="sm"
                onPress={onEdit}
                className="border-border"
              >
                <Edit size={14} color="#2CD7E3" />
                <Text className="text-sm font-medium text-foreground">
                  Edit
                </Text>
              </Button>
            ) : onFollowToggle ? (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onPress={onFollowToggle}
                className={isFollowing ? "border-border" : ""}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: isFollowing ? "#FAFAFA" : "#0A0A0A" }}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </Button>
            ) : null}
          </View>
        </View>

        <View className="flex-row flex-wrap items-center gap-2">
          <Text
            className="text-2xl font-bold text-foreground"
            numberOfLines={1}
          >
            {profile.displayName}
          </Text>
          {isPremium ? (
            <Badge
              className="border"
              style={{
                borderColor: "rgba(245,158,11,0.4)",
                backgroundColor: "rgba(245,158,11,0.15)",
              }}
            >
              <Star size={10} color="#fcd34d" />
              <Text
                className="text-xs font-medium"
                style={{ color: "#fcd34d" }}
              >
                Premium
              </Text>
            </Badge>
          ) : null}
          {isAdmin ? (
            <Badge
              className="border"
              style={{
                borderColor: "rgba(44,215,227,0.4)",
                backgroundColor: "rgba(44,215,227,0.15)",
              }}
            >
              <ShieldCheck size={10} color="#67e8f9" />
              <Text
                className="text-xs font-medium"
                style={{ color: "#67e8f9" }}
              >
                Admin
              </Text>
            </Badge>
          ) : null}
        </View>

        <Text className="text-sm text-muted-foreground">
          @{profile.handle}
        </Text>

        <View className="mt-1 flex-row flex-wrap items-center gap-3">
          <View className="flex-row items-center gap-1">
            <MapPin size={12} color="#737373" />
            <Text className="text-xs text-muted-foreground">
              {profile.country}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground">
            Joined {new Date(profile.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {profile.bio ? (
          <Text className="mt-3 text-sm text-neutral-300">{profile.bio}</Text>
        ) : null}

        {stats ? (
          <View className="mt-4 flex-row rounded-xl border border-border bg-background py-3">
            <StatCell label="Followers" value={stats.followers} />
            <View style={{ width: 1, backgroundColor: "#262626" }} />
            <StatCell label="Following" value={stats.following} />
            <View style={{ width: 1, backgroundColor: "#262626" }} />
            <StatCell label="Videos" value={stats.videos} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default ProfileHeader;
