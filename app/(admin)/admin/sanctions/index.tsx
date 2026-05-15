import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { ShieldBan, ShieldOff } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  listAllSanctions,
  revertSanction,
  type SanctionKind,
  type SanctionListRow,
} from "@/lib/api/admin";
import { Spinner } from "@/components/ui/spinner";

const KIND_TABS: { value: SanctionKind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "chat_banned", label: "Chat bans" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Permabans" },
];

function kindColor(kind: SanctionKind): string {
  if (kind === "banned") return "#EF4444";
  if (kind === "suspended") return "#F59E0B";
  return "#2CD7E3";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "permanent";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function SanctionsListScreen() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState<SanctionKind | "all">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sanctions", filter],
    queryFn: () =>
      listAllSanctions({
        kind: filter === "all" ? undefined : filter,
        status: "active",
        limit: 200,
      }),
    staleTime: 30_000,
  });

  const revertMut = useMutation({
    mutationFn: ({ userId, sanctionId }: { userId: string; sanctionId: string }) =>
      revertSanction(userId, sanctionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sanctions"] });
      toast.success("Sanction reverted");
    },
    onError: (err) =>
      toast.error("Couldn't revert", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  const sanctions = data?.sanctions ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "Sanctioned users" }} />
      <View className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View className="mb-2 flex-row items-center gap-2">
            <ShieldBan size={16} color="#F59E0B" />
            <Text className="text-2xl font-bold text-foreground">
              Sanctioned users
            </Text>
          </View>
          <Text className="mb-4 text-sm text-muted-foreground">
            Active sanctions across the platform. Tap Revert to clear.
          </Text>

          <View className="mb-3 flex-row flex-wrap gap-2">
            {KIND_TABS.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setFilter(t.value)}
                className={`rounded-full border px-3 py-1.5 ${
                  filter === t.value
                    ? "border-brand bg-brand/15"
                    : "border-border bg-card"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    filter === t.value ? "text-brand" : "text-foreground"
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {isLoading ? (
            <View className="items-center py-8">
              <Spinner size="large" />
            </View>
          ) : sanctions.length === 0 ? (
            <View className="items-center rounded-xl border border-dashed border-border p-8">
              <ShieldOff size={20} color="#737373" />
              <Text className="mt-2 text-sm text-muted-foreground">
                No active sanctions{filter === "all" ? "" : ` of type ${filter}`}.
              </Text>
            </View>
          ) : (
            sanctions.map((s: SanctionListRow) => (
              <View
                key={s.id}
                className="mb-2 rounded-xl border border-border bg-card p-3"
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                    {s.userImage ? (
                      <Image
                        source={s.userImage}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {s.userHandle ? `@${s.userHandle}` : s.userName}
                    </Text>
                    <Text className="text-[11px] text-muted-foreground">
                      {s.userEmail}
                    </Text>
                  </View>
                  <Pressable
                    disabled={revertMut.isPending}
                    onPress={() =>
                      revertMut.mutate({ userId: s.userId, sanctionId: s.id })
                    }
                    className="rounded-md border border-border bg-background px-2.5 py-1"
                  >
                    <View className="flex-row items-center gap-1">
                      <ShieldOff size={11} color="#FAFAFA" />
                      <Text className="text-[11px] text-foreground">Revert</Text>
                    </View>
                  </Pressable>
                </View>
                <View className="mt-3">
                  <Text
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: kindColor(s.kind as SanctionKind) }}
                  >
                    {s.kind.replace("_", " ")}
                  </Text>
                  <Text className="mt-0.5 text-xs text-foreground">
                    {s.reason}
                  </Text>
                  <Text className="mt-1 text-[10px] text-muted-foreground">
                    Issued {fmtDate(s.createdAt)} · Expires {fmtDate(s.expiresAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
}
