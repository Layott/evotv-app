import { ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

export default function PickemEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return (
    <>
      <Stack.Screen options={{ title: "Pick'em" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-6">
          <Text className="text-2xl font-bold text-brand">Pick'em</Text>
          <Text className="mt-2 text-muted-foreground">eventId: {eventId}</Text>
          <Text className="mt-4 text-foreground">Coming soon — port from web.</Text>
        </View>
      </ScrollView>
    </>
  );
}
