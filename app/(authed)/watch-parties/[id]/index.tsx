import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { toast } from "sonner-native";
import {
  Crown,
  DoorOpen,
  Globe,
  Lock,
  LogOut,
  Sparkles,
  Tv2,
  UserPlus,
  Users,
} from "lucide-react-native";

import {
  addPartyMessage,
  getWatchPartyById,
  joinWatchParty,
  leaveWatchParty,
  listPartyMessages,
  makeIncomingPartyMessage,
  partyLanguageLabel,
  type PartyMessage,
  type WatchParty,
} from "@/lib/mock/watch-parties";
import { useMockAuth } from "@/components/providers";
import { HlsPlayer } from "@/components/stream/hls-player";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const SAMPLE_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

function ChatBubble({ msg, isMe }: { msg: PartyMessage; isMe: boolean }) {
  if (msg.isSystem) {
    return (
      <View className="my-1 items-center">
        <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
          {msg.body}
        </Text>
      </View>
    );
  }
  return (
    <View className="mb-2 flex-row items-start gap-2">
      <Avatar className="h-7 w-7">
        <AvatarImage src={msg.userAvatarUrl} />
        <AvatarFallback>{msg.userHandle.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-baseline gap-1.5">
          <Text
            className={`text-xs font-semibold ${isMe ? "text-brand" : "text-neutral-200"}`}
          >
            @{msg.userHandle}
          </Text>
          <Text className="text-[9px] text-neutral-500">
            {new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <Text className="mt-0.5 text-xs text-neutral-100">{msg.body}</Text>
      </View>
    </View>
  );
}

function MemberRow({
  member,
  currentUserId,
}: {
  member: WatchParty["members"][number];
  currentUserId?: string;
}) {
  return (
    <View className="flex-row items-center gap-2 border-b border-neutral-800/40 py-2 last:border-0">
      <Avatar className="h-8 w-8">
        <AvatarImage src={member.avatarUrl} />
        <AvatarFallback>{member.handle.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-1">
          <Text
            className={`text-sm ${member.userId === currentUserId ? "text-brand font-semibold" : "text-neutral-100"}`}
            numberOfLines={1}
          >
            {member.displayName}
          </Text>
          {member.isHost ? <Crown size={12} color="#FCD34D" /> : null}
        </View>
        <Text className="text-[10px] text-neutral-500">@{member.handle}</Text>
      </View>
    </View>
  );
}

export default function WatchPartyRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const partyId = id ?? "";
  const { user } = useMockAuth();

  const [party, setParty] = React.useState<WatchParty | null | undefined>(
    undefined,
  );
  const [messages, setMessages] = React.useState<PartyMessage[]>([]);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const [p, msgs] = await Promise.all([
      getWatchPartyById(partyId),
      listPartyMessages(partyId),
    ]);
    setParty(p);
    setMessages(msgs);
  }, [partyId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  // Ambient incoming chatter every 9s
  React.useEffect(() => {
    if (!party) return;
    const id = setInterval(() => {
      setMessages((prev) => [...prev, makeIncomingPartyMessage(partyId)]);
    }, 9000);
    return () => clearInterval(id);
  }, [partyId, party]);

  const joined =
    !!user && !!party && party.members.some((m) => m.userId === user.id);
  const isHost = !!user && !!party && party.hostId === user.id;

  async function handleJoin() {
    if (!user || !party) return;
    setBusy(true);
    try {
      const updated = await joinWatchParty(party.id, user);
      if (updated) {
        setParty(updated);
        toast.success(`Welcome to "${updated.name}"`);
      } else {
        toast.error("Could not join");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!user || !party) return;
    setBusy(true);
    try {
      const updated = await leaveWatchParty(party.id, user.id);
      if (updated === null) {
        toast.success("Party closed");
        router.replace("/watch-parties");
        return;
      }
      setParty(updated);
      toast.success("You left the party");
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    const body = text.trim();
    if (!body || !user || !party) return;
    const optimistic: PartyMessage = {
      id: `local_${Date.now()}`,
      partyId: party.id,
      userId: user.id,
      userHandle: user.handle,
      userAvatarUrl: user.avatarUrl,
      body,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    await addPartyMessage(party.id, {
      userId: user.id,
      userHandle: user.handle,
      userAvatarUrl: user.avatarUrl,
      body,
    });
  }

  if (party === undefined) {
    return (
      <>
        <Stack.Screen options={{ title: "Watch Party" }} />
        <View className="flex-1 bg-background p-4">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="mt-4 h-12 rounded-md" />
          <Skeleton className="mt-2 h-64 rounded-md" />
        </View>
      </>
    );
  }

  if (party === null) {
    return (
      <>
        <Stack.Screen options={{ title: "Not Found" }} />
        <View className="flex-1 items-center justify-center bg-background p-8">
          <Sparkles size={36} color="#525252" />
          <Text className="mt-3 text-xl font-bold text-neutral-100">
            Watch party not found
          </Text>
          <Text className="mt-1 text-center text-sm text-neutral-400">
            The host may have closed the room.
          </Text>
          <Button
            className="mt-5 bg-brand"
            onPress={() => router.replace("/watch-parties")}
            textClassName="text-black"
          >
            Browse parties
          </Button>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: party.name, headerBackTitle: "Back" }} />
      <ScrollView className="flex-1 bg-background">
        {/* HLS player */}
        <HlsPlayer src={SAMPLE_HLS} poster={party.streamThumbnailUrl} />

        <View className="px-4 py-4">
          {/* Header actions */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-900/60 px-2 py-1">
              <View
                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" }}
              />
              <Text className="text-[10px] font-bold uppercase text-neutral-200">
                Party · {party.viewerCount} together
              </Text>
            </View>
            {joined ? (
              <Button
                size="sm"
                variant="outline"
                className="border-neutral-700"
                onPress={handleLeave}
                disabled={busy}
                textClassName="text-neutral-300"
              >
                {isHost ? <DoorOpen size={14} color="#FCA5A5" /> : <LogOut size={14} color="#A3A3A3" />}
                {isHost ? "Close party" : "Leave"}
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-brand"
                onPress={handleJoin}
                disabled={busy}
                textClassName="text-black"
              >
                <UserPlus size={14} color="#000" />
                Join party
              </Button>
            )}
          </View>

          {/* Title */}
          <Text className="mt-3 text-xl font-bold text-neutral-50">
            {party.name}
          </Text>
          <Text className="mt-1 text-sm text-neutral-400" numberOfLines={1}>
            Watching: {party.streamTitle}
          </Text>

          {party.topic ? (
            <View className="mt-2 rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2">
              <Text className="text-xs text-neutral-300">
                <Text className="font-semibold text-neutral-400">Topic: </Text>
                {party.topic}
              </Text>
            </View>
          ) : null}

          {/* Host strip */}
          <View className="mt-3 flex-row items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={party.hostAvatarUrl} />
              <AvatarFallback>
                {party.hostDisplayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-semibold text-neutral-100">
                  {party.hostDisplayName}
                </Text>
                <Crown size={13} color="#FCD34D" />
              </View>
              <Text className="text-[11px] uppercase tracking-wider text-neutral-500">
                Host · @{party.hostHandle}
              </Text>
            </View>
          </View>

          {/* Badges */}
          <View className="mt-3 flex-row flex-wrap gap-1.5">
            {party.visibility === "invite" ? (
              <Badge className="bg-amber-500" textClassName="text-black">
                <Lock size={11} color="#000" /> Invite-only
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Globe size={11} color="#FAFAFA" /> Public
              </Badge>
            )}
            <Badge variant="outline">
              <Text className="text-[11px] text-neutral-300">
                {partyLanguageLabel(party.language)}
              </Text>
            </Badge>
            <Badge variant="outline">
              <Users size={11} color="#A3A3A3" />
              <Text className="text-[11px] text-neutral-300">
                {party.members.length} / {party.maxGuests}
              </Text>
            </Badge>
            <Badge variant="outline">
              <Tv2 size={11} color="#A3A3A3" />
              <Text className="text-[11px] text-neutral-300">Watch party</Text>
            </Badge>
          </View>

          {!joined ? (
            <View className="mt-3 rounded-xl border border-brand/30 bg-brand/5 p-3">
              <Text className="text-xs text-brand">
                <Sparkles size={12} color="#2CD7E3" /> Previewing this party. Join to chat.
              </Text>
            </View>
          ) : null}

          {/* Tabs */}
          <Tabs defaultValue="chat" className="mt-5">
            <TabsList>
              <TabsTrigger value="chat">
                <Sparkles size={13} color="#A3A3A3" />
                <Text className="text-sm font-medium text-neutral-300">Chat</Text>
              </TabsTrigger>
              <TabsTrigger value="members">
                <Users size={13} color="#A3A3A3" />
                <Text className="text-sm font-medium text-neutral-300">
                  Members ({party.members.length})
                </Text>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat">
              <View
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-3"
                style={{ minHeight: 320 }}
              >
                {messages.length === 0 ? (
                  <Text className="py-10 text-center text-xs text-neutral-500">
                    No messages yet — say something.
                  </Text>
                ) : (
                  messages.map((m) => (
                    <ChatBubble
                      key={m.id}
                      msg={m}
                      isMe={!!user && m.userId === user.id}
                    />
                  ))
                )}
              </View>
              <View className="mt-2 flex-row gap-2">
                <Input
                  className="flex-1 border-neutral-800 bg-neutral-950"
                  value={text}
                  onChangeText={setText}
                  placeholder={joined ? "Send a message" : "Join party to chat"}
                  editable={joined}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                />
                <Button
                  size="sm"
                  className="bg-brand"
                  disabled={!joined || !text.trim()}
                  onPress={handleSend}
                  textClassName="text-black"
                >
                  Send
                </Button>
              </View>
            </TabsContent>

            <TabsContent value="members">
              <View className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2">
                {party.members.map((m) => (
                  <MemberRow
                    key={m.userId}
                    member={m}
                    currentUserId={user?.id}
                  />
                ))}
              </View>
            </TabsContent>
          </Tabs>
        </View>
      </ScrollView>
    </>
  );
}
