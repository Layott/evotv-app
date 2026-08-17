import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import {
  Bell,
  CalendarRange,
  Clapperboard,
  Crown,
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
  Sparkles,
  Star,
  Target,
  Tv,
  User as UserIcon,
  Users as UsersIcon,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react-native";

import { useAuth } from "@/components/providers";
import { hasMinRole } from "@/lib/auth/roles";

interface FeatureLink {
  label: string;
  href: string;
  Icon: LucideIcon;
  premium?: boolean;
  adminOnly?: boolean;
  /** Gated for MVP - shows a "SOON" badge + an in-drawer blurb instead of
   *  navigating to the feature (keeps drawer context, no broken back). */
  gated?: boolean;
  /** What this feature offers when it launches (shown in the gated sheet). */
  blurb?: string;
}

interface FeatureGroup {
  title: string;
  items: FeatureLink[];
}

const GROUPS: FeatureGroup[] = [
  {
    title: "You",
    items: [
      { label: "Profile", href: "/profile", Icon: UserIcon },
      { label: "Library", href: "/library", Icon: Library },
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
      { label: "Clips", href: "/clips", Icon: Film },
      { label: "Categories", href: "/categories", Icon: Gamepad2 },
      { label: "Teams", href: "/team", Icon: ShieldCheck },
      { label: "Multi-stream", href: "/multi-stream", Icon: Layers, gated: true, blurb: "Watch up to four live streams side-by-side in one grid." },
      { label: "Watch parties", href: "/watch-parties", Icon: UsersIcon, gated: true, blurb: "Watch together in sync with friends and live chat." },
      { label: "Calendar", href: "/calendar", Icon: CalendarRange, gated: true, blurb: "A full calendar view of every match, premiere and event." },
    ],
  },
  {
    title: "Play",
    items: [
      { label: "Pick'em", href: "/pickem", Icon: Target, gated: true, blurb: "Predict tournament brackets and climb the leaderboard." },
      { label: "Predictions", href: "/predictions", Icon: LineChart, gated: true, blurb: "Stake EVO Coins on live match outcomes." },
      { label: "Fantasy", href: "/fantasy", Icon: Star, gated: true, blurb: "Draft a roster of pro players and compete each week." },
      { label: "Tips", href: "/tips", Icon: PiggyBank, gated: true, blurb: "Send and receive creator tips with EVO Coins." },
      { label: "Rewards", href: "/rewards", Icon: Gift, gated: true, blurb: "Earn XP and unlock drops through daily quests." },
      { label: "Rewards store", href: "/rewards/store", Icon: Sparkles, gated: true, blurb: "Spend your coins on exclusive digital + physical drops." },
    ],
  },
  {
    title: "Creator",
    items: [
      { label: "Creator program", href: "/creator-program", Icon: Mic2, gated: true, blurb: "Apply to stream on EVO TV and earn from your audience." },
      { label: "Dashboard", href: "/creator-dashboard", Icon: LayoutDashboard, gated: true, blurb: "Track your viewers, hours streamed, followers and tips." },
      { label: "Earnings", href: "/creator-dashboard/earnings", Icon: Wallet, gated: true, blurb: "See your revenue and request payouts." },
      { label: "Auto-clipper", href: "/auto-clipper", Icon: Clapperboard, gated: true, blurb: "Auto-generate highlight clips from your live streams." },
      { label: "Integrations", href: "/integrations", Icon: Share2, gated: true, blurb: "Connect Discord, Telegram and more to your channel." },
      { label: "USSD", href: "/ussd", Icon: Phone, gated: true, blurb: "Pay and subscribe by dialling a code. No app needed." },
    ],
  },
  {
    title: "Discover",
    items: [
      { label: "Upgrade to Premium", href: "/upgrade", Icon: Crown },
      { label: "Apps & devices", href: "/apps", Icon: Tv, gated: true, blurb: "Get EVO TV on your TV, desktop and other devices." },
      { label: "Partners", href: "/partners", Icon: Globe, gated: true, blurb: "Meet the brands and teams powering EVO TV." },
      { label: "Embed player", href: "/embed", Icon: Play, premium: true, gated: true, blurb: "Embed EVO TV streams + clips on your own site." },
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
  const router = useRouter();
  const { user, role, login, logout } = useAuth();
  const [gatedInfo, setGatedInfo] = React.useState<{
    title: string;
    blurb: string;
  } | null>(null);

  React.useEffect(() => {
    if (!open) setGatedInfo(null);
  }, [open]);

  if (!open) return null;

  // Ladder, not equality: a head_admin is more than an admin.
  const isAdmin = hasMinRole(role, "admin");
  // Creator tools only show for creators (and admins). Role is granted from
  // the admin Users screen.
  const isCreator = hasMinRole(role, "creator");
  const handleNav = (item: FeatureLink) => {
    // Gated features never navigate - show an in-drawer blurb instead. Keeps
    // the drawer open (no broken back) and signals "coming soon" in context.
    if (item.gated) {
      setGatedInfo({ title: item.label, blurb: item.blurb ?? "Launching soon." });
      return;
    }
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
          backgroundColor: "#05191B",
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
                <UserIcon size={18} color="#46E3CE" />
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
              <X size={20} color="#9FBDBD" />
            </Pressable>
          </View>

          {GROUPS.map((group) => {
            if (group.title === "Admin" && !isAdmin) return null;
            if (group.title === "Creator" && !isCreator) return null;
            return (
              <View key={group.title} className="px-4 pt-5">
                <Text
                  className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2"
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
                          <Icon size={16} color="#46E3CE" />
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
                        {item.gated ? (
                          <View
                            className="rounded px-1.5 py-0.5"
                            style={{ backgroundColor: "rgba(168, 85, 247, 0.15)" }}
                          >
                            <Text
                              className="text-[10px] font-semibold"
                              style={{ color: "#A855F7" }}
                            >
                              SOON
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
              className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2"
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
                  <LogIn size={16} color="#46E3CE" />
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

      {gatedInfo ? (
        <Pressable
          onPress={() => setGatedInfo(null)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
          accessibilityLabel="Close"
        >
          <Animated.View entering={FadeInDown.duration(220)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="rounded-t-3xl border-t border-border bg-card px-6 pb-10 pt-6"
            >
              <View className="items-center">
                <View
                  className="h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20"
                  style={{ backgroundColor: "rgba(168,85,247,0.10)" }}
                >
                  <Sparkles size={26} color="#A855F7" />
                </View>
                <Text className="mt-4 text-center text-xl font-bold text-foreground">
                  {gatedInfo.title}
                </Text>
                <Text className="mt-1 text-[11px] font-semibold uppercase tracking-[3px] text-purple-400">
                  Coming soon
                </Text>
                <Text className="mt-3 max-w-[300px] text-center text-sm text-muted-foreground">
                  {gatedInfo.blurb}
                </Text>
                <Pressable
                  onPress={() => setGatedInfo(null)}
                  className="mt-6 w-full items-center rounded-xl border border-border bg-background py-3 active:opacity-70"
                >
                  <Text className="text-sm font-semibold text-foreground">
                    Got it
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      ) : null}
    </View>
  );
}
