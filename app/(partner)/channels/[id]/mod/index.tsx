import * as React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import {
  CircleDot,
  Pin,
  Trash2,
  UserX,
  Wifi,
  WifiOff,
} from "lucide-react-native";

import { useMockAuth } from "@/components/providers";
import { getChannelPage } from "@/lib/api/channels";
import { modAction, ModError } from "@/lib/api/moderation";
import { useStreamChat } from "@/hooks/useStreamChat";
import type { ChatMessage } from "@/lib/types";

const TIMEOUT_OPTIONS: Array<{ label: string; durationSec: number }> = [
  { label: "10s", durationSec: 10 },
  { label: "1m", durationSec: 60 },
  { label: "5m", durationSec: 300 },
  { label: "1h", durationSec: 3600 },
];

export default function ModPanelScreen() {
  const { id: channelId } = useLocalSearchParams<{ id: string }>();
  const { publisherMemberships } = useMockAuth();

  const channel = publisherMemberships
    .flatMap((m) => m.channels.map((c) => ({ ...c, role: m.role })))
    .find((c) => c.id === channelId);

  if (!channel) {
    return (
      <>
        <Stack.Screen options={{ title: "Moderation" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Text className="text-sm text-muted-foreground">Channel not found.</Text>
        </View>
      </>
    );
  }

  const canModerate =
    channel.role === "owner" ||
    channel.role === "admin" ||
    channel.role === "editor";

  if (!canModerate) {
    return (
      <>
        <Stack.Screen options={{ title: "Moderation" }} />
        <View className="flex-1 items-center justify-center bg-background px-6">
          <Text className="text-base font-semibold text-foreground">
            Read-only access
          </Text>
          <Text className="mt-2 text-center text-xs text-muted-foreground">
            Moderation requires editor role or higher. Your current role:{" "}
            <Text className="text-foreground">{channel.role}</Text>
          </Text>
        </View>
      </>
    );
  }

  return <ModPanelBody channelId={channelId} channelSlug={channel.slug} channelName={channel.name} />;
}

function ModPanelBody({
  channelId,
  channelSlug,
  channelName,
}: {
  channelId: string;
  channelSlug: string;
  channelName: string;
}) {
  const channelQuery = useQuery({
    queryKey: ["channel-page", channelSlug],
    queryFn: () => getChannelPage(channelSlug),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const liveStreamId = channelQuery.data?.liveStream?.id ?? null;

  return (
    <>
      <Stack.Screen options={{ title: `Mod · ${channelName}` }} />
      <View className="flex-1 bg-background">
        <StreamStatusBanner liveStreamId={liveStreamId} loading={channelQuery.isLoading} />
        {liveStreamId ? (
          <LiveChatModerator channelId={channelId} streamId={liveStreamId} />
        ) : (
          <OfflineState />
        )}
      </View>
    </>
  );
}

function StreamStatusBanner({
  liveStreamId,
  loading,
}: {
  liveStreamId: string | null;
  loading: boolean;
}) {
  const isLive = !!liveStreamId;
  return (
    <View
      className="flex-row items-center gap-2 border-b border-neutral-800 px-5 py-3"
      style={{ backgroundColor: isLive ? "#0c2429" : "#1a1a1a" }}
    >
      {loading ? (
        <CircleDot size={14} color="#737373" />
      ) : isLive ? (
        <Wifi size={14} color="#2CD7E3" />
      ) : (
        <WifiOff size={14} color="#737373" />
      )}
      <Text className="text-xs font-medium text-foreground">
        {loading ? "Checking stream status…" : isLive ? "Stream live · mod actions broadcast to viewers" : "Channel offline"}
      </Text>
    </View>
  );
}

function OfflineState() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <WifiOff size={32} color="#525252" />
      <Text className="mt-3 text-base font-semibold text-foreground">
        Channel is offline
      </Text>
      <Text className="mt-2 text-center text-xs text-muted-foreground">
        Start a stream to moderate chat in real time. Past message moderation
        will arrive in a future release.
      </Text>
    </View>
  );
}

function LiveChatModerator({
  channelId,
  streamId,
}: {
  channelId: string;
  streamId: string;
}) {
  const { messages, status } = useStreamChat(streamId);
  const visible = React.useMemo(
    () => messages.filter((m) => !m.isDeleted).slice(-100).reverse(),
    [messages],
  );

  return (
    <ScrollView className="flex-1">
      <View className="px-3 py-2">
        {status !== "open" ? (
          <Text className="px-2 pb-2 text-[11px] text-muted-foreground">
            Chat status: {status}
          </Text>
        ) : null}
        {visible.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-sm text-muted-foreground">No messages yet.</Text>
          </View>
        ) : (
          visible.map((msg) => (
            <ModMessageRow key={msg.id} message={msg} channelId={channelId} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function ModMessageRow({
  message,
  channelId,
}: {
  message: ChatMessage;
  channelId: string;
}) {
  const [pinning, setPinning] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [timingOut, setTimingOut] = React.useState(false);
  const [showTimeoutMenu, setShowTimeoutMenu] = React.useState(false);

  const handlePin = async () => {
    setPinning(true);
    try {
      const res = await modAction(channelId, {
        action: "pin",
        messageId: message.id,
      });
      const pinned =
        "isPinned" in res ? res.isPinned : !message.isPinned;
      toast.success(pinned ? "Pinned message" : "Unpinned message", {
        description: message.body.slice(0, 60),
      });
    } catch (err) {
      toast.error("Pin failed", { description: errorMessage(err) });
    } finally {
      setPinning(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await modAction(channelId, { action: "delete", messageId: message.id });
      toast.success("Deleted message", {
        description: message.body.slice(0, 60),
      });
    } catch (err) {
      toast.error("Delete failed", { description: errorMessage(err) });
    } finally {
      setDeleting(false);
    }
  };

  const handleTimeout = async (durationSec: number, label: string) => {
    setShowTimeoutMenu(false);
    setTimingOut(true);
    try {
      await modAction(channelId, {
        action: "timeout",
        userId: message.userId,
        durationSec,
      });
      toast.success(`Timed out @${message.userHandle} for ${label}`);
    } catch (err) {
      toast.error("Timeout failed", { description: errorMessage(err) });
    } finally {
      setTimingOut(false);
    }
  };

  return (
    <View className="mb-2 rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2">
          <Text className="text-xs font-semibold text-foreground">
            @{message.userHandle}
          </Text>
          {message.isPinned ? <Pin size={12} color="#2CD7E3" /> : null}
          <Text className="text-[10px] text-muted-foreground">
            {formatTime(message.createdAt)}
          </Text>
        </View>
        <View className="flex-row gap-1.5">
          <ActionButton
            onPress={handlePin}
            disabled={pinning}
            icon={<Pin size={13} color={message.isPinned ? "#2CD7E3" : "#FAFAFA"} />}
            label={message.isPinned ? "Unpin" : "Pin"}
          />
          <ActionButton
            onPress={handleDelete}
            disabled={deleting}
            icon={<Trash2 size={13} color="#FF6B6B" />}
            label="Delete"
            danger
          />
          <ActionButton
            onPress={() => setShowTimeoutMenu((v) => !v)}
            disabled={timingOut}
            icon={<UserX size={13} color="#FACC15" />}
            label="Timeout"
          />
        </View>
      </View>
      <Text className="mt-1 text-sm text-foreground">{message.body}</Text>
      {showTimeoutMenu ? (
        <View className="mt-2 flex-row gap-1.5 border-t border-neutral-800 pt-2">
          {TIMEOUT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.label}
              onPress={() => handleTimeout(opt.durationSec, opt.label)}
              className="flex-1 items-center rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 active:opacity-70"
            >
              <Text className="text-xs font-medium text-foreground">
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ActionButton({
  onPress,
  disabled,
  icon,
  label,
  danger,
}: {
  onPress: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center gap-1 rounded-md border border-neutral-700 px-2 py-1 active:opacity-70"
      style={{
        backgroundColor: danger ? "#2a1212" : "#1a1a1a",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}
      <Text className="text-[11px] font-medium text-foreground">{label}</Text>
    </Pressable>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function errorMessage(err: unknown): string {
  if (err instanceof ModError) return err.message;
  if (err instanceof Error) return err.message;
  return "Unexpected error";
}
