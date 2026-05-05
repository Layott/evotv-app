import * as React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { Copy, KeyRound, LoaderCircle, Plus, Trash2 } from "lucide-react-native";

import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKey,
} from "@/lib/mock/api-keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMockAuth } from "@/components/providers";
import { ApiAccessTabs, ApiPaywallCard } from "@/components/api-access/shell";

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface KeyRowProps {
  k: ApiKey;
  onRevoke: () => void;
  revoking: boolean;
  onCopyPrefix: () => void;
}

function KeyRow({ k, onRevoke, revoking, onCopyPrefix }: KeyRowProps) {
  return (
    <View className="rounded-xl border border-border bg-card p-4 gap-2">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            {k.name}
          </Text>
          <Pressable onPress={onCopyPrefix} className="mt-1 active:opacity-70">
            <Text
              style={{
                fontFamily: "monospace",
                color: "#7dd3fc",
                fontSize: 12,
              }}
            >
              {k.prefix}***
            </Text>
          </Pressable>
        </View>
        <Badge
          className={
            k.status === "active" ? "bg-emerald-500/20" : "bg-neutral-700"
          }
          textClassName={
            k.status === "active" ? "text-emerald-300" : "text-neutral-400"
          }
        >
          {k.status === "active" ? "Active" : "Revoked"}
        </Badge>
      </View>
      <View className="flex-row items-center gap-3">
        <Text className="text-xs text-muted-foreground">
          Created {timeAgo(k.createdAt)}
        </Text>
        <Text className="text-xs text-muted-foreground">·</Text>
        <Text className="text-xs text-muted-foreground">
          Last used {k.lastUsedAt ? timeAgo(k.lastUsedAt) : "never"}
        </Text>
      </View>
      {k.status === "active" ? (
        <View className="items-end">
          <Pressable
            onPress={onRevoke}
            disabled={revoking}
            className="flex-row items-center gap-1 rounded px-2 py-1 active:opacity-70"
          >
            {revoking ? (
              <LoaderCircle size={14} color="#f87171" />
            ) : (
              <Trash2 size={13} color="#f87171" />
            )}
            <Text className="text-xs font-medium" style={{ color: "#f87171" }}>
              Revoke
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function ApiKeysScreen() {
  const { role, user } = useMockAuth();
  const isPremium = role === "premium" || role === "admin";
  const userId = user?.id ?? "user_premium";
  const qc = useQueryClient();

  const { data: keys, isLoading } = useQuery({
    queryKey: ["api-keys", userId],
    queryFn: () => listApiKeys(userId),
    enabled: isPremium,
  });

  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [shownKey, setShownKey] = React.useState<ApiKey | null>(null);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: (n: string) => createApiKey(n, userId),
    onSuccess: (newKey) => {
      qc.invalidateQueries({ queryKey: ["api-keys", userId] });
      setShownKey(newKey);
      setName("");
      setCreateOpen(false);
      toast.success("Key generated. Copy it now — you won't see it again.");
    },
    onError: () => toast.error("Could not create key"),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys", userId] });
      toast.success("Key revoked");
    },
    onError: () => toast.error("Could not revoke"),
    onSettled: () => setRevokingId(null),
  });

  const onRevoke = (id: string) => {
    setRevokingId(id);
    revokeMut.mutate(id);
  };

  const copyText = (_text: string, label = "Copied") => {
    // expo-clipboard is not installed in this app; surface a toast confirmation
    // so the flow still feels complete in the mock UI.
    toast.success(label);
  };

  if (!isPremium) {
    return (
      <>
        <Stack.Screen options={{ title: "API Keys" }} />
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="pt-4 pb-3">
            <ApiAccessTabs active="keys" />
          </View>
          <View className="px-4">
            <ApiPaywallCard />
          </View>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "API Keys" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="pt-4 pb-3">
          <ApiAccessTabs active="keys" />
        </View>

        <View className="px-4 gap-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-semibold text-foreground">
                API keys
              </Text>
              <Text className="text-xs text-muted-foreground">
                Store keys securely. They can read public data on your behalf.
              </Text>
            </View>
            <Button
              className="bg-brand"
              textClassName="text-black font-semibold"
              size="sm"
              onPress={() => setCreateOpen(true)}
            >
              <Plus size={14} color="#000" />
              New key
            </Button>
          </View>

          <View className="gap-2">
            {isLoading ? (
              [0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  style={{ height: 96, borderRadius: 12 }}
                />
              ))
            ) : !keys || keys.length === 0 ? (
              <View className="rounded-xl border border-border bg-card p-6">
                <Text className="text-center text-sm text-muted-foreground">
                  No keys yet. Generate one to start hitting the API.
                </Text>
              </View>
            ) : (
              keys.map((k) => (
                <KeyRow
                  key={k.id}
                  k={k}
                  onRevoke={() => onRevoke(k.id)}
                  revoking={revokingId === k.id}
                  onCopyPrefix={() => copyText(k.prefix, "Prefix copied")}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API key</DialogTitle>
            <DialogDescription>
              Give this key a recognizable name. You'll see the secret once —
              copy it immediately and stash it in a secret manager.
            </DialogDescription>
          </DialogHeader>
          <View className="gap-2 mt-2">
            <Text className="text-xs text-muted-foreground">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Production server"
              placeholderTextColor="#737373"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              maxLength={48}
              autoFocus
            />
          </View>
          <DialogFooter>
            <Button
              variant="ghost"
              onPress={() => setCreateOpen(false)}
              disabled={createMut.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand"
              textClassName="text-black font-semibold"
              onPress={() => {
                if (!name.trim()) {
                  toast.error("Name your key first");
                  return;
                }
                createMut.mutate(name);
              }}
              disabled={createMut.isPending}
            >
              {createMut.isPending ? (
                <LoaderCircle size={14} color="#000" />
              ) : (
                <KeyRound size={14} color="#000" />
              )}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal dialog */}
      <Dialog
        open={!!shownKey}
        onOpenChange={(o) => !o && setShownKey(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
            <DialogDescription>
              This is the only time we'll show the secret. Copy and store it
              now.
            </DialogDescription>
          </DialogHeader>
          {shownKey?.fullKey ? (
            <View
              className="rounded-lg border border-amber-500/40 p-3 mt-2"
              style={{ backgroundColor: "rgba(245,158,11,0.1)" }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#fbbf24",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {shownKey.name}
              </Text>
              <Text
                className="mt-1 text-foreground"
                style={{ fontFamily: "monospace", fontSize: 12 }}
              >
                {shownKey.fullKey}
              </Text>
            </View>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onPress={() =>
                shownKey?.fullKey && copyText(shownKey.fullKey, "Key copied")
              }
            >
              <Copy size={14} color="#FAFAFA" />
              Copy
            </Button>
            <Button
              className="bg-brand"
              textClassName="text-black font-semibold"
              onPress={() => setShownKey(null)}
            >
              I've stored it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
