import * as React from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Gauge, Send, Users } from "lucide-react-native";
import { toast } from "sonner-native";

import type { ChatMessage, Role } from "@/lib/types";
import { listInitialMessages, makeIncomingMessage } from "@/lib/mock/chat";
import { useMockAuth } from "@/components/providers";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const MAX_MSGS = 200;
const CHAR_LIMIT = 400;

interface LiveChatProps {
  streamId: string;
  className?: string;
}

function roleColor(role: Role): string {
  switch (role) {
    case "admin":
      return "#67e8f9";
    case "premium":
      return "#fcd34d";
    default:
      return "#FAFAFA";
  }
}

interface RowProps {
  msg: ChatMessage;
}

function MessageRow({ msg }: RowProps) {
  return (
    <View className="flex-row items-start gap-2 px-3 py-1.5">
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#262626",
        }}
      >
        {msg.userAvatarUrl ? (
          <Image
            source={msg.userAvatarUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View className="flex-1">
        <Text className="text-[13px]">
          <Text
            style={{
              fontWeight: "600",
              color: roleColor(msg.userRole),
            }}
          >
            {msg.userHandle}
          </Text>
          <Text className="text-neutral-300">{`  ${msg.body}`}</Text>
        </Text>
      </View>
    </View>
  );
}

export function LiveChat({ streamId, className }: LiveChatProps) {
  const { user, role } = useMockAuth();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [subsOnly, setSubsOnly] = React.useState(false);
  const listRef = React.useRef<FlatList<ChatMessage>>(null);
  const stuckToBottom = React.useRef(true);

  const canToggleSubs = role === "admin" || role === "premium";

  // Initial load
  React.useEffect(() => {
    let cancelled = false;
    void listInitialMessages(streamId).then((msgs) => {
      if (!cancelled) setMessages(msgs);
    });
    return () => {
      cancelled = true;
    };
  }, [streamId]);

  // Simulated incoming messages
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setMessages((prev) => {
        const next = [...prev, makeIncomingMessage(streamId)];
        return next.length > MAX_MSGS ? next.slice(next.length - MAX_MSGS) : next;
      });
      timer = setTimeout(tick, 2000 + Math.random() * 2000);
    };
    timer = setTimeout(tick, 2000 + Math.random() * 2000);
    return () => clearTimeout(timer);
  }, [streamId]);

  // Auto-scroll on new messages when stuck to bottom
  React.useEffect(() => {
    if (!stuckToBottom.current) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const send = () => {
    const body = input.trim();
    if (!body) return;
    if (!user) {
      toast.error("Sign in to chat");
      return;
    }
    const msg: ChatMessage = {
      id: `msg_local_${Date.now()}`,
      streamId,
      userId: user.id,
      userHandle: user.handle,
      userAvatarUrl: user.avatarUrl,
      userRole: role,
      body,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      isPinned: false,
    };
    setMessages((prev) => {
      const next = [...prev, msg];
      return next.length > MAX_MSGS ? next.slice(next.length - MAX_MSGS) : next;
    });
    setInput("");
    stuckToBottom.current = true;
  };

  const visibleMessages = subsOnly
    ? messages.filter(
        (m) => m.userRole === "premium" || m.userRole === "admin",
      )
    : messages;

  return (
    <View className={cn("flex-1 bg-background", className)}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b border-border px-3 py-2"
      >
        <View className="flex-row items-center gap-2">
          <Users size={16} color="#FAFAFA" />
          <Text className="text-sm font-semibold text-foreground">
            Stream Chat
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Gauge size={12} color="#737373" />
            <Text className="text-[10px] text-muted-foreground">Slow: 3s</Text>
          </View>
          {canToggleSubs ? (
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[10px] text-muted-foreground">
                Subs only
              </Text>
              <Switch
                checked={subsOnly}
                onCheckedChange={(v) => {
                  setSubsOnly(v);
                  toast(
                    v
                      ? "Subscribers-only mode on"
                      : "Subscribers-only mode off",
                  );
                }}
              />
            </View>
          ) : null}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={visibleMessages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MessageRow msg={item} />}
        contentContainerStyle={{ paddingVertical: 4 }}
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } =
            e.nativeEvent;
          const distance =
            contentSize.height - (contentOffset.y + layoutMeasurement.height);
          stuckToBottom.current = distance < 80;
        }}
        scrollEventThrottle={120}
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Text className="text-xs text-muted-foreground">
              Chat is warming up...
            </Text>
          </View>
        }
      />

      {/* Input */}
      <View className="border-t border-border p-2">
        <View className="flex-row items-center gap-2">
          <TextInput
            value={input}
            onChangeText={(text) => setInput(text.slice(0, CHAR_LIMIT))}
            placeholder={user ? "Send a message" : "Sign in to chat"}
            placeholderTextColor="#737373"
            editable={!!user}
            onSubmitEditing={send}
            returnKeyType="send"
            className="h-9 flex-1 rounded-md border border-border bg-card px-3 text-sm text-foreground"
          />
          <Pressable
            onPress={send}
            disabled={!user || !input.trim()}
            accessibilityLabel="Send"
            className={cn(
              "h-9 w-9 items-center justify-center rounded-md",
              !user || !input.trim() ? "opacity-50" : "active:opacity-80",
            )}
            style={{ backgroundColor: "#2CD7E3" }}
          >
            <Send size={16} color="#0A0A0A" />
          </Pressable>
        </View>
        <Text
          className="mt-1 text-right text-[10px]"
          style={{
            color:
              input.length > CHAR_LIMIT * 0.9 ? "#fbbf24" : "#737373",
          }}
        >
          {input.length} / {CHAR_LIMIT}
        </Text>
      </View>
    </View>
  );
}

export default LiveChat;
