import { Text, View } from "react-native";
import { Stack } from "expo-router";

import { TopNavbar } from "@/components/home/top-navbar";
import { LibraryTabs } from "@/components/library/library-tabs";

export default function LibraryScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-background">
        <TopNavbar />
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-foreground">Library</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            Continue watching, saved VODs, downloads, and history.
          </Text>
        </View>
        <View className="flex-1 px-4 pt-2">
          <LibraryTabs />
        </View>
      </View>
    </>
  );
}
