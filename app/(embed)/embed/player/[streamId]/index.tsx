import { ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

export default function EmbedPlayerScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-6">
          <Text className="text-2xl font-bold text-brand">Embed Player</Text>
          <Text className="mt-2 text-muted-foreground">streamId: {streamId}</Text>
          <Text className="mt-4 text-foreground">Coming soon — port from web.</Text>
        </View>
      </ScrollView>
    </>
  );
}
