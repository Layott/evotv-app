import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter, usePathname } from "expo-router";
import {
  ArrowLeft,
  BarChart3,
  Coins,
  Film,
  Lock,
  Mic2,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMockAuth } from "@/components/providers";
import { cn } from "@/lib/utils";

interface DashboardTab {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const TABS: DashboardTab[] = [
  { href: "/(authed)/creator-dashboard", label: "Overview", icon: BarChart3, exact: true },
  { href: "/(authed)/creator-dashboard/earnings", label: "Earnings", icon: Coins },
  { href: "/(authed)/creator-dashboard/clips", label: "Clips", icon: Film },
  { href: "/(authed)/creator-dashboard/audience", label: "Audience", icon: Users },
];

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Header title used in the native stack header. */
  screenTitle?: string;
}

export function DashboardShell({
  children,
  title,
  description,
  actions,
  screenTitle,
}: DashboardShellProps) {
  const { role } = useMockAuth();
  const pathname = usePathname();
  const router = useRouter();

  const allowed = role === "admin" || role === "premium";

  if (!allowed) {
    return (
      <>
        <Stack.Screen options={{ title: screenTitle ?? title }} />
        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="px-4 py-12"
        >
          <View className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8">
            <View className="mx-auto h-14 w-14 items-center justify-center rounded-full bg-amber-500/20">
              <Lock size={24} color="#FCD34D" />
            </View>
            <Text className="mt-4 text-center text-xl font-bold text-foreground">
              Creator dashboard locked
            </Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              The creator dashboard is available to verified creators (or anyone simulating premium / admin via the role switcher).
            </Text>
            <View className="mt-5 gap-3">
              <Button
                onPress={() => router.push("/(authed)/creator-program")}
                className="h-11 bg-amber-500"
                textClassName="font-semibold text-amber-950"
              >
                <Mic2 size={16} color="#451A03" />
                <Text className="text-sm font-semibold text-amber-950">
                  Join the creator program
                </Text>
              </Button>
              <Button
                variant="outline"
                onPress={() => router.back()}
                className="h-11"
              >
                <ArrowLeft size={16} color="#FAFAFA" />
                <Text className="text-sm font-medium text-foreground">Back</Text>
              </Button>
            </View>
            <Text className="mt-4 text-center text-[11px] text-muted-foreground">
              Tip: switch role to "Premium" or "Admin" via the dev role switcher to preview.
            </Text>
          </View>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: screenTitle ?? title }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-4 py-6 pb-24"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Sparkles size={18} color="#FCD34D" />
              <Text className="text-xl font-bold text-foreground">{title}</Text>
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10"
                textClassName="text-emerald-300 text-[10px]"
              >
                Creator
              </Badge>
            </View>
            {description ? (
              <Text className="mt-1 text-sm text-muted-foreground">{description}</Text>
            ) : null}
          </View>
          {actions}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
          contentContainerClassName="gap-1"
        >
          <View className="flex-row items-center gap-1 rounded-xl border border-border bg-card/60 p-1">
            {TABS.map((t) => {
              const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
              return (
                <Pressable
                  key={t.href}
                  onPress={() => router.push(t.href as never)}
                  className={cn(
                    "flex-row items-center gap-1.5 rounded-lg px-3 py-2",
                    active && "bg-secondary",
                  )}
                >
                  <t.icon size={14} color={active ? "#FAFAFA" : "#A3A3A3"} />
                  <Text
                    className={cn(
                      "text-[11px] font-medium uppercase tracking-widest",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {children}
      </ScrollView>
    </>
  );
}
