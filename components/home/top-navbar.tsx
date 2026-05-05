import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Menu, Search } from "lucide-react-native";

import { FeatureDrawer } from "./feature-drawer";

const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/evotv%20colored-cLVxaAns95OoPRdSwAHZUktQ6y8MTs.png";

interface TopNavbarProps {
  onSearchPress?: () => void;
}

export default function TopNavbar({ onSearchPress }: TopNavbarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleSearch = () => {
    if (onSearchPress) onSearchPress();
    else router.push("/discover");
  };

  return (
    <>
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: "#000000",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(44, 215, 227, 0.2)",
        }}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => setDrawerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            hitSlop={8}
            className="rounded-lg p-1 active:opacity-70"
          >
            <Menu size={24} color="#FAFAFA" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/home")}
            accessibilityRole="button"
            accessibilityLabel="EVO TV home"
            className="flex-row items-center gap-2"
          >
            <Image
              source={LOGO_URL}
              style={{ width: 28, height: 28 }}
              contentFit="contain"
            />
            <Text className="text-base font-bold text-white">EVO TV</Text>
          </Pressable>

          <Pressable
            onPress={handleSearch}
            accessibilityRole="button"
            accessibilityLabel="Search"
            className="rounded-lg p-1 active:opacity-70"
          >
            <Search size={24} color="#2CD7E3" />
          </Pressable>
        </View>
      </View>

      <FeatureDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

export { TopNavbar };
