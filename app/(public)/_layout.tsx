import { Tabs, useRouter } from "expo-router";
import { useTokens } from "@/lib/theme/tokens";
import {
  CalendarRange,
  Compass,
  Home,
  Library,
  Trophy,
  User,
} from "lucide-react-native";

export default function PublicLayout() {
  const t = useTokens();
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // No borderTop: a 1px rule across the tab bar is exactly the hairline
        // the product stopped drawing. The bar separates by sitting on its own
        // surface, not by a line.
        tabBarStyle: {
          backgroundColor: t.bg,
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: t.brand,
        tabBarInactiveTintColor: t.muted,
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
        name="schedule/index"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <CalendarRange color={color} size={size} />
          ),
        }}
      />
      {/* No tabPress override: the tab renders the Library screen itself now,
          rather than intercepting the press to push a Stack screen from
          another group over the top of the tab bar. */}
      <Tabs.Screen
        name="library-tab/index"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => <Library color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile-tab/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push("/profile" as never);
          },
        }}
      />

      {/* Hidden public routes - exist as routes, not in tab bar */}
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
      <Tabs.Screen name="vod/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="upgrade/index" options={{ href: null }} />
      <Tabs.Screen name="shop/index" options={{ href: null }} />
      <Tabs.Screen name="privacy/index" options={{ href: null }} />
      <Tabs.Screen name="terms/index" options={{ href: null }} />
      <Tabs.Screen name="u/[handle]/index" options={{ href: null }} />
      <Tabs.Screen name="originals/index" options={{ href: null }} />
      <Tabs.Screen name="show/[slug]/index" options={{ href: null }} />
      <Tabs.Screen
        name="show/[slug]/[season]/[episode]/index"
        options={{ href: null }}
      />
    </Tabs>
  );
}
