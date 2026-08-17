import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import {
  Bell,
  CalendarRange,
  Clapperboard,
  Unlock,
  Disc,
  Film,
  Gamepad2,
  Gift,
  Globe,
  Headphones,
  Layers,
  LayoutDashboard,
  Library,
  LineChart,
  ListChecks,
  LogIn,
  LogOut,
  Mic2,
  Phone,
  PiggyBank,
  Play,
  Radio,
  Repeat,
  Settings as SettingsIcon,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Target,
  Tv,
  User as UserIcon,
  Users as UsersIcon,
  Wallet,
  X,
  type Icon,
} from "@/components/icons";

import { useAuth } from "@/components/providers";
import { hasMinRole } from "@/lib/auth/roles";

interface FeatureLink {
  label: string;
  href: string;
  Icon: Icon;
  premium?: boolean;
  adminOnly?: boolean;
}

interface FeatureGroup {
  title: string;
  items: FeatureLink[];
}

const GROUPS: FeatureGroup[] = [
  {
    title: "You",
    items: [
      { label: "Profile", href: "/profile-tab", Icon: UserIcon },
      { label: "Library", href: "/library-tab", Icon: Library },
      { label: "Notifications", href: "/notifications", Icon: Bell },
      { label: "Cart", href: "/cart", Icon: ShoppingBag },
      { label: "Orders", href: "/profile/orders", Icon: ListChecks },
      { label: "Settings", href: "/settings", Icon: SettingsIcon },
      { label: "Billing", href: "/settings/billing", Icon: Wallet },
    ],
  },
  {
    title: "Watch",
    items: [
      { label: "Live channel", href: "/channel", Icon: Radio },
      { label: "Schedule", href: "/schedule", Icon: CalendarRange },
      { label: "Shows", href: "/shows", Icon: Film },
      { label: "Clips", href: "/clips", Icon: Film },
      { label: "Categories", href: "/categories", Icon: Gamepad2 },
      { label: "Teams", href: "/team", Icon: ShieldCheck },
    ],
  },
  {
    title: "Discover",
    items: [
      { label: "Shop", href: "/shop", Icon: ShoppingBag },
      { label: "Upgrade to Premium", href: "/upgrade", Icon: Unlock },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Admin home", href: "/admin", Icon: LayoutDashboard, adminOnly: true },
      { label: "Streams", href: "/admin/streams", Icon: Radio, adminOnly: true },
      { label: "Content", href: "/admin/content", Icon: Film, adminOnly: true },
      { label: "Users", href: "/admin/users", Icon: UsersIcon, adminOnly: true },
      { label: "Analytics", href: "/admin/analytics", Icon: LineChart, adminOnly: true },
      { label: "API keys", href: "/admin/api-keys", Icon: Disc, adminOnly: true },
      { label: "Moderation", href: "/admin/moderation", Icon: ShieldCheck, adminOnly: true },
      { label: "Forensic", href: "/admin/forensic", Icon: Headphones, adminOnly: true },
    ],
  },
];

interface FeatureDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function FeatureDrawer({ open, onClose }: FeatureDrawerProps) {
  const palette = useTokens();
  const router = useRouter();
  const { user, role, login, logout } = useAuth();
  if (!open) return null;

  // Ladder, not equality: a head_admin is more than an admin.
  const isAdmin = hasMinRole(role, "admin");
  // Creator tools only show for creators (and admins). Role is granted from
  // the admin Users screen.
  const isCreator = hasMinRole(role, "creator");
  const handleNav = (item: FeatureLink) => {
    // Every entry navigates now. The drawer used to hold a set of links that
    // opened a "launching soon" blurb instead of a screen; those features and
    // their screens have been removed rather than advertised.
    onClose();
    setTimeout(() => router.push(item.href as never), 50);
  };

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      <Pressable
        onPress={onClose}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
        }}
        accessibilityLabel="Close menu"
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "85%",
          maxWidth: 360,
          backgroundColor: palette.bg,
          borderLeftWidth: 1,
          borderLeftColor: "#1F1F1F",
        }}
      >
        <ScrollView contentContainerClassName="pb-12 pt-12">
          <View className="flex-row items-center justify-between px-4 pb-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              <View
                className="h-10 w-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(70,227,206, 0.15)" }}
              >
                <UserIcon size={18} color={palette.brand} />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground">
                  {user?.displayName ?? "Guest"}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {user ? `@${user.handle} · ${role}` : "Not signed in"}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityLabel="Close menu"
              className="p-1"
            >
              <X size={20} color={palette.muted} />
            </Pressable>
          </View>

          {GROUPS.map((group) => {
            if (group.title === "Admin" && !isAdmin) return null;
            if (group.title === "Creator" && !isCreator) return null;
            return (
              <View key={group.title} className="px-4 pt-5">
                <Text
                  className="text-[10px] text-muted-foreground mb-2"
                  style={{ letterSpacing: 1.4 }}
                >
                  {group.title}
                </Text>
                <View className="rounded-xl overflow-hidden border border-border bg-card/40">
                  {group.items.map((item, idx) => {
                    if (item.adminOnly && !isAdmin) return null;
                    const Icon = item.Icon;
                    return (
                      <Pressable
                        key={item.label}
                        onPress={() => handleNav(item)}
                        className="flex-row items-center gap-3 px-3 py-3 active:bg-muted/40"
                        style={{
                          borderTopWidth: idx === 0 ? 0 : 1,
                          borderTopColor: "#1F1F1F",
                        }}
                      >
                        <View
                          className="h-8 w-8 rounded-md items-center justify-center"
                          style={{ backgroundColor: "rgba(70,227,206, 0.10)" }}
                        >
                          <Icon size={16} color={palette.brand} />
                        </View>
                        <Text className="flex-1 text-sm text-foreground">
                          {item.label}
                        </Text>
                        {item.premium ? (
                          <View
                            className="rounded px-1.5 py-0.5"
                            style={{ backgroundColor: "rgba(234, 179, 8, 0.15)" }}
                          >
                            <Text
                              className="text-[10px] font-semibold"
                              style={{ color: "#EAB308" }}
                            >
                              PRO
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}

          <View className="px-4 pt-6">
            <Text
              className="text-[10px] text-muted-foreground mb-2"
              style={{ letterSpacing: 1.4 }}
            >
              Session
            </Text>
            {user ? (
              <Pressable
                onPress={() => {
                  logout();
                  onClose();
                }}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-card/40 px-3 py-3"
              >
                <View
                  className="h-8 w-8 rounded-md items-center justify-center"
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.12)" }}
                >
                  <LogOut size={16} color="#EF4444" />
                </View>
                <Text className="text-sm font-medium" style={{ color: "#EF4444" }}>
                  Sign out
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  login("user");
                  onClose();
                }}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-card/40 px-3 py-3"
              >
                <View
                  className="h-8 w-8 rounded-md items-center justify-center"
                  style={{ backgroundColor: "rgba(70,227,206, 0.12)" }}
                >
                  <LogIn size={16} color={palette.brand} />
                </View>
                <Text className="text-sm font-medium text-brand">Sign in</Text>
              </Pressable>
            )}

            {!isAdmin ? (
              <Pressable
                onPress={() => {
                  login("admin");
                  onClose();
                }}
                className="mt-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 px-3 py-3"
              >
                <View
                  className="h-8 w-8 rounded-md items-center justify-center"
                  style={{ backgroundColor: "rgba(168, 85, 247, 0.12)" }}
                >
                  <Repeat size={16} color="#A855F7" />
                </View>
                <Text className="text-sm font-medium text-foreground">
                  Switch to admin (demo)
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>

    </View>
  );
}
