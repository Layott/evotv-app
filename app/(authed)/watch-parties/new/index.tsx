import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { toast } from "sonner-native";
import { Globe, Loader2, Lock, Sparkles, Tv2, Users } from "lucide-react-native";

import {
  PARTY_LANGUAGE_OPTIONS,
  createWatchParty,
  type WatchPartyLanguage,
  type WatchPartyVisibility,
} from "@/lib/mock/watch-parties";
import { listLiveStreams } from "@/lib/mock/streams";
import type { Stream } from "@/lib/types";
import { useMockAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export default function NewWatchPartyScreen() {
  const router = useRouter();
  const { user } = useMockAuth();

  const [streams, setStreams] = React.useState<Stream[]>([]);
  const [streamsLoading, setStreamsLoading] = React.useState(true);

  const [name, setName] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [streamId, setStreamId] = React.useState("");
  const [maxGuests, setMaxGuests] = React.useState(20);
  const [visibility, setVisibility] = React.useState<WatchPartyVisibility>("public");
  const [language, setLanguage] = React.useState<WatchPartyLanguage>("en");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setStreamsLoading(true);
    listLiveStreams().then((s) => {
      if (cancelled) return;
      setStreams(s);
      setStreamId((prev) => prev || s[0]?.id || "");
      setStreamsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedStream = streams.find((s) => s.id === streamId) ?? null;
  const nameValid = name.trim().length >= 3;
  const canSubmit = !!user && nameValid && !!selectedStream && !submitting;

  async function handleSubmit() {
    if (!user) {
      toast.error("Sign in to host a party");
      return;
    }
    if (!nameValid) {
      toast.error("Party name needs at least 3 characters");
      return;
    }
    if (!selectedStream) {
      toast.error("Pick a live stream first");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createWatchParty({
        name,
        streamId: selectedStream.id,
        streamTitle: selectedStream.title,
        streamThumbnailUrl: selectedStream.thumbnailUrl,
        visibility,
        language,
        maxGuests,
        topic,
        host: {
          id: user.id,
          handle: user.handle,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      });
      toast.success("Party created!");
      router.replace(`/watch-parties/${created.id}`);
    } catch {
      toast.error("Could not create party");
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: "Host a Party" }} />
        <View className="flex-1 items-center justify-center bg-background p-8">
          <Sparkles size={36} color="#525252" />
          <Text className="mt-3 text-base font-semibold text-neutral-200">
            Sign in to host a party
          </Text>
          <Text className="mt-1 text-xs text-neutral-500">
            Use the role switcher to choose a role.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Host a Party" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 py-5">
          <Text className="text-2xl font-bold text-neutral-50">
            Host a watch party
          </Text>
          <Text className="mt-1 text-sm text-neutral-400">
            Pick a live stream, set the vibe, invite friends.
          </Text>

          {/* Basics */}
          <View className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <Text className="text-base font-semibold text-neutral-50">
              Basics
            </Text>

            <Text className="mt-4 text-xs font-medium text-neutral-300">
              Party name
            </Text>
            <Input
              className="mt-1 border-neutral-800 bg-neutral-950"
              placeholder="Lagos Squad — Semis Watch"
              value={name}
              maxLength={60}
              onChangeText={setName}
            />
            <Text className="mt-1 text-[10px] text-neutral-500">
              {name.length} / 60
            </Text>

            <Text className="mt-4 text-xs font-medium text-neutral-300">
              Vibe / topic (optional)
            </Text>
            <Input
              className="mt-1 h-20 border-neutral-800 bg-neutral-950"
              placeholder="What's the energy? Predictions?"
              value={topic}
              maxLength={140}
              onChangeText={setTopic}
              multiline
              style={{ textAlignVertical: "top" }}
            />
            <Text className="mt-1 text-[10px] text-neutral-500">
              {topic.length} / 140
            </Text>

            <Text className="mt-4 text-xs font-medium text-neutral-300">
              Language
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-2"
            >
              {PARTY_LANGUAGE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setLanguage(opt.value)}
                  className={cn(
                    "mr-2 rounded-full border px-3 py-1.5",
                    language === opt.value
                      ? "border-brand/50 bg-brand/10"
                      : "border-neutral-800 bg-neutral-900",
                  )}
                >
                  <Text
                    className={cn(
                      "text-xs font-medium",
                      language === opt.value ? "text-brand" : "text-neutral-400",
                    )}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Pick stream */}
          <View className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <Text className="text-base font-semibold text-neutral-50">
              Pick a live stream
            </Text>
            <Text className="mt-0.5 text-xs text-neutral-500">
              The party will play this stream side-by-side with chat.
            </Text>
            {streamsLoading ? (
              <View className="mt-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </View>
            ) : streams.length === 0 ? (
              <View className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
                <Text className="text-center text-sm text-neutral-500">
                  No live streams right now.
                </Text>
              </View>
            ) : (
              <View className="mt-3 gap-2">
                {streams.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setStreamId(s.id)}
                    className={cn(
                      "flex-row items-center gap-3 rounded-lg border p-2",
                      streamId === s.id
                        ? "border-brand/60 bg-brand/10"
                        : "border-neutral-800 bg-neutral-950",
                    )}
                  >
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 6,
                        overflow: "hidden",
                        backgroundColor: "#171717",
                      }}
                    >
                      <Image
                        source={s.thumbnailUrl}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text
                        className="text-xs font-semibold text-neutral-100"
                        numberOfLines={2}
                      >
                        {s.title}
                      </Text>
                      <Text className="mt-0.5 text-[10px] text-neutral-400">
                        {s.streamerName} · {s.viewerCount.toLocaleString()} watching
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Room settings */}
          <View className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <Text className="text-base font-semibold text-neutral-50">
              Room settings
            </Text>

            <View className="mt-4 flex-row items-center justify-between">
              <Text className="text-sm text-neutral-300">
                Max guests:{" "}
                <Text className="font-bold text-brand">{maxGuests}</Text>
              </Text>
            </View>
            <Slider
              className="mt-2"
              min={2}
              max={100}
              step={1}
              value={[maxGuests]}
              onValueChange={(v) => setMaxGuests(v[0] ?? 20)}
            />
            <Text className="mt-1 text-[10px] text-neutral-500">
              Cap how big the room can grow. Includes you.
            </Text>

            <Text className="mt-4 text-xs font-medium text-neutral-300">
              Visibility
            </Text>
            <View className="mt-2 gap-2">
              <Pressable
                onPress={() => setVisibility("public")}
                className={cn(
                  "flex-row items-start gap-3 rounded-lg border p-3",
                  visibility === "public"
                    ? "border-brand/60 bg-brand/10"
                    : "border-neutral-800 bg-neutral-950",
                )}
              >
                <Globe size={16} color="#7DD3FC" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-neutral-100">
                    Public
                  </Text>
                  <Text className="text-[11px] text-neutral-400">
                    Anyone can browse + join until full.
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setVisibility("invite")}
                className={cn(
                  "flex-row items-start gap-3 rounded-lg border p-3",
                  visibility === "invite"
                    ? "border-brand/60 bg-brand/10"
                    : "border-neutral-800 bg-neutral-950",
                )}
              >
                <Lock size={16} color="#FCD34D" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-neutral-100">
                    Invite-only
                  </Text>
                  <Text className="text-[11px] text-neutral-400">
                    Only people with the link can join.
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Preview */}
          <View className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <Text className="text-base font-semibold text-neutral-50">
              Preview
            </Text>
            {selectedStream ? (
              <View className="mt-3 gap-3">
                <View
                  style={{
                    aspectRatio: 16 / 9,
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: "#171717",
                  }}
                >
                  <Image
                    source={selectedStream.thumbnailUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  <View className="absolute left-2 top-2 rounded bg-red-600/90 px-1.5 py-0.5">
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-white">
                      Live
                    </Text>
                  </View>
                </View>
                <Text className="text-sm font-semibold text-neutral-100">
                  {name.trim() || "Your party name…"}
                </Text>
                <Text className="text-xs text-neutral-400" numberOfLines={1}>
                  Watching: {selectedStream.title}
                </Text>
              </View>
            ) : (
              <View className="mt-3 h-32 flex-row items-center justify-center rounded-lg border border-dashed border-neutral-800">
                <Tv2 size={14} color="#525252" />
                <Text className="ml-2 text-xs text-neutral-500">
                  Pick a stream to preview
                </Text>
              </View>
            )}
          </View>

          <Button
            className="mt-4 bg-brand"
            disabled={!canSubmit}
            onPress={handleSubmit}
            textClassName="text-black"
          >
            {submitting ? (
              <Loader2 size={16} color="#000" />
            ) : (
              <Sparkles size={16} color="#000" />
            )}
            {submitting ? "Creating…" : "Create & open room"}
          </Button>
          <Button
            variant="outline"
            className="mt-2 border-neutral-800"
            onPress={() => router.back()}
            textClassName="text-neutral-300"
          >
            Cancel
          </Button>
          <View className="mt-3 flex-row items-center justify-center gap-1">
            <Users size={11} color="#525252" />
            <Text className="text-[11px] text-neutral-500">
              You'll be the host. Leave any time.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
