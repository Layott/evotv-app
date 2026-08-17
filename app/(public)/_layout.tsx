import { Tabs, useRouter } from "expo-router";
import {
  CalendarRange,
  Compass,
  Home,
  Library,
  Trophy,
  User,
} from "lucide-react-native";

export default function PublicLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#05191B",
          borderTopColor: "#1F1F1F",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#46E3CE",
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
