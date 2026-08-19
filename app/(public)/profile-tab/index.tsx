import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { toast } from "sonner-native";

import { useTokens } from "@/lib/theme/tokens";
import { hasMinRole } from "@/lib/auth/roles";
import { isStaffRole } from "@/lib/auth/capabilities";
import { LogOut, Settings } from "@/components/icons";
import { TopNavbar } from "@/components/home/top-navbar";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers";
import { pickAndUploadAvatar } from "@/lib/api/profile";

/**
 * Profile, rendered in its tab.
 *
 * This file used to be a stub whose only job was `router.replace("/profile")`
 * into a Stack screen under `(authed)`. Pressing the Profile tab therefore left
 * the tab bar behind and pushed a differently-shaped screen over the top, which
 * is the exact complaint the owner made about Library: "shows like a separate
 * page and you can still go to a new page". Library was moved into its tab last
 * session; Profile had the identical bug and was missed.
 *
 * The tab's `tabPress` listener that did the pushing is gone from
 * `(public)/_layout.tsx` too. Both halves had to go, or the listener would keep
 * navigating away from the screen it now sits on.
 *
 * Living under `(public)` means there is no auth gate above it, so the
 * signed-out case is handled here. It used to render a spinner forever for a
 * guest, since `user` is legitimately null rather than loading.
 */
export default function ProfileScreen() {
  const palette = useTokens();
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuth();
  const [avatarUploading, setAvatarUploading] = React.useState(false);

  const handleLogout = React.useCallback(() => {
    signOut();
    router.replace("/(auth)/login");
  }, [signOut, router]);

  const handleAvatarPress = React.useCallback(async () => {
    if (avatarUploading) return;
    setAvatarUploading(true);
    try {
      const { url } = await pickAndUploadAvatar();
      updateProfile({ avatarUrl: url });
      toast.success("Profile photo updated");
    } catch (err) {
      const code = err instanceof Error ? err.message : "upload_failed";
      if (code === "cancelled") return;
      if (code === "permission_denied") {
        toast.error("Photo permission required", {
          description: "Allow EVO TV to access your photos in Settings.",
        });
        return;
      }
      if (code === "file_too_large") {
        toast.error("Photo too large", {
          description: "Try a smaller image or take a new one.",
        });
        return;
      }
      toast.error("Couldn't update photo", { description: code });
    } finally {
      setAvatarUploading(false);
    }
  }, [avatarUploading, updateProfile]);

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-background">
          <TopNavbar />
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-lg font-semibold text-foreground text-center">
              Sign in to see your profile
            </Text>
            <Text className="mt-2 text-sm text-muted-foreground text-center leading-5">
              Your follows, watch history and downloads live here. Watching does
              not need an account.
            </Text>
            <Button
              className="mt-5 bg-brand"
              textClassName="text-primary-foreground font-semibold"
              onPress={() => router.push("/(auth)/login" as never)}
            >
              Sign in
            </Button>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <TopNavbar />
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-12"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">Profile</Text>
            <View className="flex-row items-center gap-2">
              {/* The only link into the admin section used to be an entry in
                  the home feature drawer, which is why the owner reported that
                  the app admin "can't even open". It is a per-account
                  capability, so it belongs beside the account, and only when
                  the account actually has it. */}
              {isStaffRole(user.role) ? (
                <Pressable
                  onPress={() => router.push("/admin" as never)}
                  className="h-10 rounded-full bg-accent px-4 items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Open admin"
                  hitSlop={8}
                >
                  <Text className="text-sm font-semibold text-foreground">
                    Admin
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => router.push("/(authed)/settings")}
                className="h-10 w-10 rounded-full bg-card items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                hitSlop={8}
              >
                <Settings color={palette.fg} size={18} />
              </Pressable>
            </View>
          </View>

          <View className="px-4 pt-2">
            <ProfileHeader
              profile={user}
              canEdit
              onEdit={() => router.push("/(authed)/profile/edit" as never)}
              onAvatarPress={handleAvatarPress}
              avatarUploading={avatarUploading}
            />
          </View>

          <View className="mt-6 px-4">
            <ProfileTabs profile={user} />
          </View>

          <View className="mt-8 px-4">
            <Button
              variant="outline"
              onPress={handleLogout}
              className="h-11 w-full"
            >
              <LogOut color="#EF4444" size={16} />
              <Text className="text-sm font-medium text-destructive">
                Sign out
              </Text>
            </Button>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
