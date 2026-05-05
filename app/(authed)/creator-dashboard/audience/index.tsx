import { ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";

export default function CreatorAudienceScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Audience" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-6">
          <Text className="text-2xl font-bold text-brand">Audience</Text>
          <Text className="mt-4 text-foreground">Coming soon — port from web.</Text>
        </View>
      </ScrollView>
    </>
  );
}
