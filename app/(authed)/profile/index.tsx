import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LogOut, Settings } from "lucide-react-native";

import { TopNavbar } from "@/components/home/top-navbar";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useMockAuth } from "@/components/providers";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useMockAuth();

  const handleLogout = React.useCallback(() => {
    signOut();
    router.replace("/(auth)/login");
  }, [signOut, router]);

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-background items-center justify-center">
          <Spinner size="large" />
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
            <Pressable
              onPress={() => router.push("/(authed)/settings")}
              className="h-10 w-10 rounded-full bg-card items-center justify-center border border-border"
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              hitSlop={8}
            >
              <Settings color="#FAFAFA" size={18} />
            </Pressable>
          </View>

          <View className="px-4 pt-2">
            <ProfileHeader profile={user} />
          </View>

          <View className="mt-6 px-4">
            <ProfileTabs profile={user} />
          </View>

          <View className="mt-8 px-4">
            <Button
              variant="outline"
              onPress={handleLogout}
              className="h-11 w-full border-destructive/40"
            >
              <LogOut color="#EF4444" size={16} />
              <Text className="text-sm font-medium text-destructive">Sign out</Text>
            </Button>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
