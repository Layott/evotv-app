import * as React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { AlertTriangle, Copy, Key, RefreshCw } from "lucide-react-native";

import {
  getChannelKeyState,
  rotateChannelKey,
  type RotatedKey,
} from "@/lib/api/partner";
import { Button } from "@/components/ui/button";

const RTMP_INGEST_URL =
  process.env.EXPO_PUBLIC_RTMP_INGEST_URL ?? "rtmps://ingest.evotv.tv/live";

export default function StreamKeyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [busy, setBusy] = React.useState(false);
  const [revealed, setRevealed] = React.useState<RotatedKey | null>(null);

  const stateQ = useQuery({
    queryKey: ["partner", "channel", id, "key"],
    queryFn: () => getChannelKeyState(id),
    enabled: !!id,
  });

  const onRotate = async () => {
    if (!id) return;
    if (revealed) {
      // Already showing a fresh key — confirm before generating another.
      Alert.alert(
        "Rotate again?",
        "You already have a fresh key on screen. Rotating will invalidate it.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Rotate", style: "destructive", onPress: () => doRotate() },
        ],
      );
      return;
    }
    await doRotate();
  };

  const doRotate = async () => {
    if (!id) return;
    setBusy(true);
    try {
      const res = await rotateChannelKey(id);
      setRevealed(res);
      void stateQ.refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Rotate failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async (value: string, label: string) => {
    try {
      await Clipboard.setStringAsync(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Stream key" }} />
      <ScrollView className="flex-1 bg-background">
        <View className="px-5 py-6">
          <View className="flex-row items-center gap-2">
            <Key size={20} color="#2CD7E3" />
            <Text className="text-2xl font-bold text-foreground">Stream key</Text>
          </View>
          <Text className="mt-1 text-sm text-muted-foreground">
            Configure OBS, vMix, or any RTMP encoder with the URL + key below.
          </Text>

          <View className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Ingest URL
            </Text>
            <View className="mt-2 flex-row items-center gap-2">
              <Text
                className="flex-1 font-mono text-sm text-foreground"
                numberOfLines={1}
              >
                {RTMP_INGEST_URL}
              </Text>
              <Pressable
                onPress={() => onCopy(RTMP_INGEST_URL, "Ingest URL")}
                className="h-8 w-8 items-center justify-center rounded-md border border-neutral-800 bg-neutral-950 active:opacity-80"
              >
                <Copy size={14} color="#FAFAFA" />
              </Pressable>
            </View>
          </View>

          {revealed ? (
            <View className="mt-4 rounded-2xl border border-amber-500/50 bg-amber-500/5 p-4">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={14} color="#FCD34D" />
                <Text className="text-xs font-semibold text-amber-300">
                  Save this now — it won't be shown again
                </Text>
              </View>
              <View className="mt-3 rounded-lg border border-amber-500/30 bg-black/40 p-3">
                <Text
                  className="font-mono text-sm text-amber-200"
                  selectable
                >
                  {revealed.streamKey}
                </Text>
              </View>
              <Button
                className="mt-3 bg-amber-500/90"
                onPress={() => onCopy(revealed.streamKey, "Stream key")}
                textClassName="text-black"
              >
                <Copy size={14} color="#000" />
                Copy key
              </Button>
            </View>
          ) : (
            <View className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
              <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Active key
              </Text>
              <Text className="mt-2 text-sm text-foreground">
                {stateQ.data?.hasActiveKey
                  ? "A key is currently active. Plaintext is never re-shown — rotate to issue a new one."
                  : "No active key yet. Rotate to generate."}
              </Text>
              {stateQ.data?.activeKey ? (
                <Text className="mt-2 text-[11px] text-muted-foreground">
                  Created {new Date(stateQ.data.activeKey.createdAt).toLocaleString()}
                </Text>
              ) : null}
            </View>
          )}

          <Button
            className="mt-5 bg-brand"
            disabled={busy}
            onPress={onRotate}
            textClassName="text-black"
          >
            <RefreshCw size={14} color="#000" />
            {busy ? "Rotating…" : "Rotate stream key"}
          </Button>

          <Text className="mt-3 text-[11px] text-muted-foreground">
            Rotation invalidates the current key immediately. Any encoder using
            the old key will be rejected at the next reconnect.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
