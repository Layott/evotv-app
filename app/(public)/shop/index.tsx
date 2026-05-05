import { ScrollView, Text, View } from "react-native";

export default function ShopScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold text-brand">Shop</Text>
        <Text className="mt-4 text-foreground">Coming soon — port from web.</Text>
      </View>
    </ScrollView>
  );
}
