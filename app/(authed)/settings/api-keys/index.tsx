import * as React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { Copy, KeyRound, Trash2 } from "lucide-react-native";

import {
  createApiKey,
  listMyApiKeys,
  revokeApiKey,
  type ApiKeyRow,
} from "@/lib/api/api-keys";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function ApiKeysScreen() {
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = React.useState("");
  const [revealedKey, setRevealedKey] = React.useState<string | null>(null);

  const { data, isLoading, error } = useQuery<ApiKeyRow[], Error>({
    queryKey: ["api-keys"],
    queryFn: listMyApiKeys,
  });

  const createMut = useMutation({
    mutationFn: (name: string) => createApiKey(name),
    onSuccess: (res) => {
      setRevealedKey(res.key);
      setNewKeyName("");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Key created — copy it now");
    },
    onError: (err) =>
      toast.error("Couldn't create key", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Key revoked");
    },
    onError: (err) =>
      toast.error("Couldn't revoke", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  const activeKeys = (data ?? []).filter((k) => !k.revokedAt);

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    toast.success("Copied to clipboard");
  };

  const handleRevoke = (key: ApiKeyRow) => {
    Alert.alert(
      "Revoke API key?",
      `Apps using "${key.name}" will lose access immediately. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: () => revokeMut.mutate(key.id),
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "API keys" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <Text className="text-2xl font-bold text-foreground">API keys</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Generate keys to access your EVO TV account from scripts, integrations,
          or third-party tools. Send as{" "}
          <Text className="font-mono text-foreground">X-API-Key</Text> header.
          Limit: 10 active keys.
        </Text>

        {revealedKey ? (
          <View className="mt-5 rounded-xl border border-brand bg-brand/10 p-4">
            <View className="mb-2 flex-row items-center gap-2">
              <KeyRound size={14} color="#2CD7E3" />
              <Text className="text-sm font-bold text-brand">
                Copy this key now
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">
              It will never be shown again. Save it in a password manager.
            </Text>
            <View className="mt-3 rounded-lg border border-border bg-background p-3">
              <Text className="font-mono text-xs text-foreground" selectable>
                {revealedKey}
              </Text>
            </View>
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => handleCopy(revealedKey)}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-md border border-brand bg-brand px-3 py-2"
              >
                <Copy size={14} color="#000000" />
                <Text className="text-sm font-semibold text-black">Copy key</Text>
              </Pressable>
              <Pressable
                onPress={() => setRevealedKey(null)}
                className="rounded-md border border-border bg-card px-3 py-2"
              >
                <Text className="text-sm text-foreground">Done</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View className="mt-5 rounded-xl border border-border bg-card/40 p-4">
          <Text className="text-sm font-semibold text-foreground">
            Create new key
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground">
            Give it a name describing where it&apos;ll be used.
          </Text>
          <TextInput
            value={newKeyName}
            onChangeText={setNewKeyName}
            placeholder="e.g. CI bot, my-laptop script"
            placeholderTextColor="#737373"
            maxLength={120}
            className="mt-3 h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          />
          <Button
            onPress={() => createMut.mutate(newKeyName.trim())}
            disabled={!newKeyName.trim() || createMut.isPending}
            className="mt-3 h-10"
          >
            {createMut.isPending ? <Spinner color="#000000" /> : null}
            <Text className="text-sm font-semibold text-black">
              {createMut.isPending ? "Creating…" : "Create key"}
            </Text>
          </Button>
        </View>

        <Text className="mt-6 mb-2 text-sm font-semibold text-foreground">
          Your keys ({activeKeys.length}/10)
        </Text>

        {error ? (
          <Text className="text-sm text-destructive">
            Couldn&apos;t load keys: {error.message}
          </Text>
        ) : isLoading ? (
          <View className="items-center py-8">
            <Spinner size="large" />
          </View>
        ) : activeKeys.length === 0 ? (
          <View className="rounded-xl border border-border bg-card/30 p-6 items-center">
            <KeyRound size={20} color="#737373" />
            <Text className="mt-2 text-sm text-muted-foreground">
              No active keys yet.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {activeKeys.map((k) => (
              <View
                key={k.id}
                className="rounded-xl border border-border bg-card p-3"
              >
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {k.name}
                    </Text>
                    <Text className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {k.prefix}…
                    </Text>
                    <Text className="mt-1 text-[11px] text-muted-foreground">
                      Created {fmtDate(k.createdAt)} · Last used{" "}
                      {fmtDate(k.lastUsedAt)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleRevoke(k)}
                    disabled={revokeMut.isPending}
                    className="rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5"
                  >
                    <View className="flex-row items-center gap-1">
                      <Trash2 size={12} color="#EF4444" />
                      <Text className="text-[11px] font-medium text-destructive">
                        Revoke
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}
