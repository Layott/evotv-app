import { Tabs } from "expo-router";
import {
  Compass,
  Home,
  Library,
  ShoppingBag,
  Trophy,
  User,
} from "lucide-react-native";

export default function PublicLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopColor: "#1F1F1F",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#2CD7E3",
        tabBarInactiveTintColor: "#666666",
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "GeistMedium",
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="events/index"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="discover/index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="shop/index"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="library-tab/index"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => <Library color={color} size={size} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("library" as never);
          },
        })}
      />
      <Tabs.Screen
        name="profile-tab/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("profile" as never);
          },
        })}
      />

      {/* Hidden public routes — exist as routes, not in tab bar */}
      <Tabs.Screen name="categories/index" options={{ href: null }} />
      <Tabs.Screen name="categories/[slug]/index" options={{ href: null }} />
      <Tabs.Screen name="channel/index" options={{ href: null }} />
      <Tabs.Screen name="c/[slug]/index" options={{ href: null }} />
      <Tabs.Screen name="clips/index" options={{ href: null }} />
      <Tabs.Screen name="clips/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="events/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="events/[id]/bracket/index" options={{ href: null }} />
      <Tabs.Screen name="shop/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="team/index" options={{ href: null }} />
      <Tabs.Screen name="team/[slug]/index" options={{ href: null }} />
      <Tabs.Screen name="stream/[id]/index" options={{ href: null }} />
      <Tabs.Screen
        name="stream/[id]/co-stream/index"
        options={{ href: null }}
      />
      <Tabs.Screen name="vod/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="apps/index" options={{ href: null }} />
      <Tabs.Screen name="apps/tv/index" options={{ href: null }} />
      <Tabs.Screen name="apps/android/index" options={{ href: null }} />
      <Tabs.Screen name="apps/ios/index" options={{ href: null }} />
      <Tabs.Screen name="apps/desktop/index" options={{ href: null }} />
      <Tabs.Screen name="upgrade/index" options={{ href: null }} />
      <Tabs.Screen name="api-access/index" options={{ href: null }} />
      <Tabs.Screen name="api-access/keys/index" options={{ href: null }} />
      <Tabs.Screen name="api-access/docs/index" options={{ href: null }} />
      <Tabs.Screen name="api-access/usage/index" options={{ href: null }} />
      <Tabs.Screen name="calendar/index" options={{ href: null }} />
      <Tabs.Screen name="partners/index" options={{ href: null }} />
    </Tabs>
  );
}
