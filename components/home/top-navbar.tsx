import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";

const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/evotv%20colored-cLVxaAns95OoPRdSwAHZUktQ6y8MTs.png";

interface TopNavbarProps {
  onSearchPress?: () => void;
}

export default function TopNavbar({ onSearchPress }: TopNavbarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSearch = () => {
    if (onSearchPress) onSearchPress();
    else router.push("/discover");
  };

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: "#000000",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(44, 215, 227, 0.2)",
      }}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Image
            source={LOGO_URL}
            style={{ width: 32, height: 32 }}
            contentFit="contain"
          />
          <Text className="text-lg font-bold text-white">EVO TV</Text>
        </View>
        <Pressable
          onPress={handleSearch}
          accessibilityRole="button"
          accessibilityLabel="Search"
          className="rounded-lg p-2 active:opacity-70"
        >
          <Search size={24} color="#2CD7E3" />
        </Pressable>
      </View>
    </View>
  );
}

export { TopNavbar };
