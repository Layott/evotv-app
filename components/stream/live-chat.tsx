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
import { Send, Users, X } from "@/components/icons";
import { toast } from "sonner-native";

import type { ChatMessage, Role } from "@/lib/types";
import { useAuth } from "@/components/providers";
import { useStreamChat } from "@/hooks/useStreamChat";
import { ChatPostError } from "@/lib/api/chat";
import { cn } from "@/lib/utils";

const CHAR_LIMIT = 400;

/**
 * The chat, live or under a recording.
 *
 * It took a `streamId` and nothing else, so a recording had no conversation at
 * all. Same component, same rules, same bans: the only difference is which id
 * it is pointed at, and whether the header says the feed is live.
 */
interface LiveChatProps {
  streamId?: string;
  vodId?: string;
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
  onReply: (msg: ChatMessage) => void;
  canReply: boolean;
}

function MessageRow({ msg, onReply, canReply }: RowProps) {
  const palette = useTokens();
  const parent = msg.parent;
  return (
    <Pressable
      onLongPress={canReply ? () => onReply(msg) : undefined}
      delayLongPress={220}
      className="flex-row items-start gap-2 px-3 py-1.5 active:opacity-70"
    >
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
        {/* The quoted line, so a reply reads on its own once the message it
            answers has scrolled away. */}
        {parent ? (
          <View className="mb-0.5 rounded-md bg-card/70 px-2 py-1">
            <Text className="text-[11px]" numberOfLines={1}>
              <Text style={{ color: palette.brand, fontWeight: "600" }}>
                {parent.userHandle ?? "someone"}
              </Text>
              <Text className="text-muted-foreground">{`  ${parent.body}`}</Text>
            </Text>
          </View>
        ) : null}
        <Text className="text-[13px]">
          <Text
            style={{
              fontWeight: "600",
              color: roleColor(msg.userRole),
            }}
          >
            {msg.userHandle}
          </Text>
          <Text className="text-neutral-300">
            {`  ${msg.isDeleted ? "[message removed]" : msg.body}`}
          </Text>
        </Text>
      </View>
    </Pressable>
  );
}

export function LiveChat({ streamId, vodId, className }: LiveChatProps) {
  const palette = useTokens();
  const { user } = useAuth();
  const target = React.useMemo(
    () =>
      vodId
        ? ({ kind: "vod", id: vodId } as const)
        : ({ kind: "stream", id: streamId ?? "" } as const),
    [streamId, vodId],
  );
  const { messages, send, status } = useStreamChat(target);
  const [input, setInput] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<ChatMessage | null>(null);
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
    const parentId = replyTo?.id ?? null;
    setInput("");
    setReplyTo(null);
    stuckToBottom.current = true;
    try {
      // A local id never existed on the server, so replying to a message that
      // has not come back yet would be rejected. Send it as an ordinary one.
      await send(body, parentId && !parentId.startsWith("local_") ? parentId : null);
    } catch (err) {
      if (err instanceof ChatPostError) {
        toast.error(err.message);
      } else {
        toast.error("Send failed");
      }
    }
  };

  const statusLabel = vodId
    ? `${messages.length} ${messages.length === 1 ? "comment" : "comments"}`
    : status === "open"
      ? "Live"
      : status === "connecting"
        ? "Connecting…"
        : status === "error"
          ? "Reconnecting…"
          : "Offline";

  return (
    <View className={cn("flex-1 bg-background", className)}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2">
        <View className="flex-row items-center gap-2">
          <Users size={16} color={palette.fg} />
          <Text className="text-sm font-semibold text-foreground">
            {vodId ? "Comments" : "Stream Chat"}
          </Text>
          <Text className="text-[10px] text-muted-foreground">· {statusLabel}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MessageRow msg={item} onReply={setReplyTo} canReply={!!user} />
        )}
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
              {vodId ? "No comments yet. Say the first thing." : "Chat is warming up..."}
            </Text>
          </View>
        }
      />

      {/* Input */}
      <View className="p-2">
        {/* What you are answering, with a way out of it. Long-press a message
            to get here; there is no hover on a phone to hide a Reply button
            behind. */}
        {replyTo ? (
          <View className="mb-2 flex-row items-center gap-2 rounded-md bg-card px-2 py-1.5">
            <View className="flex-1">
              <Text className="text-[11px]" numberOfLines={1}>
                <Text style={{ color: palette.brand, fontWeight: "600" }}>
                  {`Replying to ${replyTo.userHandle}`}
                </Text>
                <Text className="text-muted-foreground">{`  ${replyTo.body}`}</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => setReplyTo(null)}
              accessibilityLabel="Cancel reply"
              hitSlop={8}
            >
              <X size={14} color={palette.muted} />
            </Pressable>
          </View>
        ) : null}
        <View className="flex-row items-center gap-2">
          <TextInput
            value={input}
            onChangeText={(text) => setInput(text.slice(0, CHAR_LIMIT))}
            placeholder={
              user
                ? replyTo
                  ? "Write a reply"
                  : vodId
                    ? "Add a comment"
                    : "Send a message"
                : "Sign in to chat"
            }
            placeholderTextColor={palette.muted}
            editable={!!user}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            className="h-9 flex-1 rounded-md bg-card px-3 text-sm text-foreground"
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
