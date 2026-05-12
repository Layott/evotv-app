import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCheck,
  Film,
  Package,
  Play,
  Star,
  UserPlus,
} from "lucide-react-native";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useMockAuth } from "@/components/providers";
import {
  listNotifications,
  markAllAsRead,
  markAsRead,
} from "@/lib/mock";
import type { NotificationItem, NotificationType } from "@/lib/types";
import { relativeTime } from "@/components/profile/ngn";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationType, import("lucide-react-native").LucideIcon> = {
  stream_live: Play,
  event_starting: Calendar,
  new_vod: Film,
  follow: UserPlus,
  order_update: Package,
  subscription: Star,
  system: AlertCircle,
};

function dateBucket(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isSameDay) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  }
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 7 * 86400000) return "Earlier this week";
  if (diffMs < 30 * 86400000) return "This month";
  return "Older";
}

function Row({
  n,
  onPress,
}: {
  n: NotificationItem;
  onPress: () => void;
}) {
  const Icon = ICONS[n.type] ?? Bell;
  const unread = n.readAt === null;
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-start gap-3 border-b border-border p-4 active:bg-muted/40",
        unread ? "bg-brand/5" : "",
      )}
    >
      <View className="relative">
        {n.imageUrl ? (
          <View
            className="h-12 w-12 overflow-hidden rounded-lg bg-muted"
          >
            <Image
              source={n.imageUrl}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <Icon size={20} color="#2CD7E3" />
          </View>
        )}
        {unread ? (
          <View
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full"
            style={{
              backgroundColor: "#2CD7E3",
              borderWidth: 2,
              borderColor: "#0A0A0A",
            }}
          />
        ) : null}
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className={cn(
            "text-sm",
            unread
              ? "font-semibold text-foreground"
              : "text-foreground/80",
          )}
          numberOfLines={1}
        >
          {n.title}
        </Text>
        <Text
          className="mt-0.5 text-xs text-muted-foreground"
          numberOfLines={2}
        >
          {n.body}
        </Text>
        <Text className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          {relativeTime(n.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

function GroupedList({
  items,
  onItemPress,
}: {
  items: NotificationItem[];
  onItemPress: (n: NotificationItem) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState />
    );
  }
  // Group preserving order
  const groups: Record<string, NotificationItem[]> = {};
  const order: string[] = [];
  for (const n of items) {
    const k = dateBucket(n.createdAt);
    if (!(k in groups)) {
      groups[k] = [];
      order.push(k);
    }
    groups[k]!.push(n);
  }

  return (
    <View className="gap-3">
      {order.map((k) => (
        <View key={k}>
          <View className="mb-1 px-1">
            <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {k}
            </Text>
          </View>
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            {groups[k]!.map((n) => (
              <Row key={n.id} n={n} onPress={() => onItemPress(n)} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ label = "Nothing here yet." }: { label?: string }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-border bg-card p-10">
      <Bell size={36} color="#525252" />
      <Text className="mt-3 text-sm font-semibold text-foreground">
        {label}
      </Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const { user } = useMockAuth();
  const router = useRouter();
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const list = await listNotifications(user.id);
      if (cancelled) return;
      setItems(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handlePress = React.useCallback(
    async (n: NotificationItem) => {
      if (n.readAt === null) {
        await markAsRead(n.id);
        setItems((prev) =>
          prev.map((p) =>
            p.id === n.id ? { ...p, readAt: new Date().toISOString() } : p,
          ),
        );
      }
      if (n.linkUrl && n.linkUrl !== "#") {
        // Web links use plain paths — RN accepts the same string in expo-router.
        // If push fails (not a known route), the catch swallows so we don't crash.
        try {
          router.push(n.linkUrl as never);
        } catch {
          /* noop */
        }
      }
    },
    [router],
  );

  const handleMarkAll = React.useCallback(async () => {
    if (!user) return;
    await markAllAsRead(user.id);
    const ts = new Date().toISOString();
    setItems((prev) =>
      prev.map((p) => (p.readAt === null ? { ...p, readAt: ts } : p)),
    );
    toast.success("All notifications marked as read");
  }, [user]);

  const unread = items.filter((i) => i.readAt === null);
  const read = items.filter((i) => i.readAt !== null);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Notifications" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Notifications" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-12"
      >
        <View className="px-4 pt-5 pb-3">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <View>
              <Text className="text-2xl font-bold text-foreground">
                Notifications
              </Text>
              <Text className="text-sm text-muted-foreground">
                {unread.length} unread · {items.length} total
              </Text>
            </View>
            <Button
              variant="outline"
              size="sm"
              onPress={handleMarkAll}
              disabled={unread.length === 0}
            >
              <CheckCheck size={14} color="#FAFAFA" />
              <Text className="text-sm font-medium text-foreground">
                Mark all read
              </Text>
            </Button>
          </View>
        </View>

        <View className="px-4">
          <Tabs defaultValue="all" className="gap-3">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                {`Unread (${unread.length})`}
              </TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <GroupedList items={items} onItemPress={handlePress} />
            </TabsContent>
            <TabsContent value="unread">
              {unread.length === 0 ? (
                <EmptyState label="You're all caught up." />
              ) : (
                <GroupedList items={unread} onItemPress={handlePress} />
              )}
            </TabsContent>
            <TabsContent value="read">
              {read.length === 0 ? (
                <EmptyState />
              ) : (
                <GroupedList items={read} onItemPress={handlePress} />
              )}
            </TabsContent>
          </Tabs>
        </View>
      </ScrollView>
    </>
  );
}
