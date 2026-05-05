import { ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

export default function ProfileByHandleScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  return (
    <>
      <Stack.Screen options={{ title: "Profile" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-6">
          <Text className="text-2xl font-bold text-brand">Profile</Text>
          <Text className="mt-2 text-muted-foreground">handle: {handle}</Text>
          <Text className="mt-4 text-foreground">Coming soon — port from web.</Text>
        </View>
      </ScrollView>
    </>
  );
}
