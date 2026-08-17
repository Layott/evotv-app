import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Send, Users } from "lucide-react-native";
import { toast } from "sonner-native";

import type { ChatMessage, Role } from "@/lib/types";
import { useAuth } from "@/components/providers";
import { useStreamChat } from "@/hooks/useStreamChat";
import { ChatPostError } from "@/lib/api/chat";
import { cn } from "@/lib/utils";

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
      return "#EAF6F5";
  }
}

interface RowProps {
  msg: ChatMessage;
}

function MessageRow({ msg }: RowProps) {
  const palette = useTokens();
  return (
    <View className="flex-row items-start gap-2 px-3 py-1.5">
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: palette.subtle,
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
  const palette = useTokens();
  const { user } = useAuth();
  const { messages, send, status } = useStreamChat(streamId);
  const [input, setInput] = React.useState("");
  const listRef = React.useRef<FlatList<ChatMessage>>(null);
  const stuckToBottom = React.useRef(true);

  React.useEffect(() => {
    if (!stuckToBottom.current) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const handleSend = async () => {
    const body = input.trim();
    if (!body) return;
    if (!user) {
      toast.error("Sign in to chat");
      return;
    }
    setInput("");
    stuckToBottom.current = true;
    try {
      await send(body);
    } catch (err) {
      if (err instanceof ChatPostError) {
        toast.error(err.message);
      } else {
        toast.error("Send failed");
      }
    }
  };

  const statusLabel =
    status === "open"
      ? "Live"
      : status === "connecting"
        ? "Connecting…"
        : status === "error"
          ? "Reconnecting…"
          : "Offline";

  return (
    <View className={cn("flex-1 bg-background", className)}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b border-border px-3 py-2"
      >
        <View className="flex-row items-center gap-2">
          <Users size={16} color={palette.fg} />
          <Text className="text-sm font-semibold text-foreground">
            Stream Chat
          </Text>
          <Text className="text-[10px] text-muted-foreground">· {statusLabel}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
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
            placeholderTextColor={palette.muted}
            editable={!!user}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            className="h-9 flex-1 rounded-md border border-border bg-card px-3 text-sm text-foreground"
          />
          <Pressable
            onPress={handleSend}
            disabled={!user || !input.trim()}
            accessibilityLabel="Send"
            className={cn(
              "h-9 w-9 items-center justify-center rounded-md",
              !user || !input.trim() ? "opacity-50" : "active:opacity-80",
            )}
            style={{ backgroundColor: palette.brand }}
          >
            <Send size={16} color={palette.bg} />
          </Pressable>
        </View>
        <Text
          className="mt-1 text-right text-[10px]"
          style={{
            color:
              input.length > CHAR_LIMIT * 0.9 ? "#fbbf24" : palette.muted,
          }}
        >
          {input.length} / {CHAR_LIMIT}
        </Text>
      </View>
    </View>
  );
}

export default LiveChat;
