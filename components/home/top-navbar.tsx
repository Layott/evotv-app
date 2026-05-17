import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, Search } from "lucide-react-native";

import { FeatureDrawer } from "./feature-drawer";
import { useAuth } from "@/components/providers";
import { getNotificationsSummary } from "@/lib/api/notifications";

const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/evotv%20colored-cLVxaAns95OoPRdSwAHZUktQ6y8MTs.png";

interface TopNavbarProps {
  onSearchPress?: () => void;
}

export default function TopNavbar({ onSearchPress }: TopNavbarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { isAuthenticated } = useAuth();

  const handleSearch = () => {
    if (onSearchPress) onSearchPress();
    else router.push("/discover");
  };

  // Notification bell is a soft polling target — every 90s while signed in.
  // Cheap-enough query that backs the unread badge without an SSE channel.
  const summaryQ = useQuery({
    queryKey: ["notifications", "summary"],
    enabled: isAuthenticated,
    queryFn: () => getNotificationsSummary(),
    refetchInterval: isAuthenticated ? 90_000 : false,
  });
  const unread = summaryQ.data?.unread ?? 0;

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

          <View className="flex-row items-center gap-1">
            {isAuthenticated ? (
              <Pressable
                onPress={() => router.push("/notifications" as never)}
                accessibilityRole="button"
                accessibilityLabel={
                  unread > 0
                    ? `Notifications, ${unread} unread`
                    : "Notifications"
                }
                className="relative rounded-lg p-1 active:opacity-70"
                hitSlop={8}
              >
                <Bell size={22} color="#FAFAFA" />
                {unread > 0 ? (
                  <View
                    className="absolute items-center justify-center rounded-full bg-brand"
                    style={{
                      top: 0,
                      right: 0,
                      minWidth: 16,
                      height: 16,
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      className="text-[10px] font-bold text-black"
                      numberOfLines={1}
                    >
                      {unread > 9 ? "9+" : unread}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ) : null}
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
      </View>

      <FeatureDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

export { TopNavbar };
