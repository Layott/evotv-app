import * as React from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { ExternalLink, Search, Shield, ShieldOff, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listAdminUsers,
  patchUserRole,
  listUserSanctions,
  sanctionUser,
  revertSanction,
  type AdminAssignableRole,
  type AdminUserRow,
  type SanctionKind,
  type UserSanction,
} from "@/lib/api/admin";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatDate, timeAgo } from "./utils";

function roleTone(
  role: AdminAssignableRole,
): "emerald" | "amber" | "blue" | "neutral" {
  if (role === "admin" || role === "head_admin") return "emerald";
  if (role === "premium") return "amber";
  if (role === "moderator" || role === "finance_admin" || role === "support_admin")
    return "blue";
  return "neutral";
}

const ROLE_FILTERS: Array<"all" | AdminAssignableRole> = [
  "all",
  "user",
  "premium",
  "moderator",
  "admin",
];

const ALL_ROLES: AdminAssignableRole[] = [
  "user",
  "premium",
  "support_admin",
  "moderator",
  "finance_admin",
  "admin",
  "head_admin",
];

const SANCTION_OPTIONS: { kind: SanctionKind; label: string; desc: string }[] = [
  { kind: "chat_banned", label: "Chat ban", desc: "Block from chat in all streams + parties" },
  { kind: "suspended", label: "Suspend", desc: "Disable account + revoke all sessions" },
  { kind: "banned", label: "Permaban", desc: "Permanent — hardest action" },
];

export function UsersRolesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | AdminAssignableRole>(
    "all",
  );
  const [selected, setSelected] = React.useState<AdminUserRow | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const usersQuery = useQuery({
    queryKey: ["admin-users", roleFilter, debouncedSearch],
    queryFn: () =>
      listAdminUsers({
        role: roleFilter === "all" ? undefined : roleFilter,
        search: debouncedSearch || undefined,
        limit: 100,
      }),
    staleTime: 30_000,
  });

  const roleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: AdminAssignableRole;
    }) => patchUserRole(userId, role),
    onSuccess: ({ id, role }) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelected((prev) => (prev && prev.id === id ? { ...prev, role } : prev));
      toast.success(`Role changed to ${role}`);
    },
    onError: (err) => {
      toast.error("Role change failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const sanctionsQuery = useQuery({
    queryKey: ["admin-user-sanctions", selected?.id],
    queryFn: () => (selected ? listUserSanctions(selected.id) : Promise.resolve({ sanctions: [] })),
    enabled: !!selected,
    staleTime: 30_000,
  });

  const [sanctionReason, setSanctionReason] = React.useState("");
  const sanctionMutation = useMutation({
    mutationFn: ({ userId, kind }: { userId: string; kind: SanctionKind }) =>
      sanctionUser(userId, {
        kind,
        reason: sanctionReason.trim() || "No reason provided",
      }),
    onSuccess: (_res, { kind }) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-user-sanctions"] });
      setSanctionReason("");
      toast.success(`${kind.replace("_", " ")} issued`);
    },
    onError: (err) =>
      toast.error("Couldn't issue sanction", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  const revertMutation = useMutation({
    mutationFn: ({ userId, sanctionId }: { userId: string; sanctionId: string }) =>
      revertSanction(userId, sanctionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-user-sanctions"] });
      toast.success("Sanction reverted");
    },
    onError: (err) =>
      toast.error("Couldn't revert sanction", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  const activeSanctions = React.useMemo<UserSanction[]>(() => {
    const all = sanctionsQuery.data?.sanctions ?? [];
    const nowIso = new Date().toISOString();
    return all.filter(
      (s) => !s.revertedAt && (!s.expiresAt || s.expiresAt > nowIso),
    );
  }, [sanctionsQuery.data]);

  const rows = usersQuery.data?.users ?? [];

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Users & roles"
          description="Search accounts, manage roles."
        />

        <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
          <Search size={14} color="#A3A3A3" />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search email or handle"
            className="h-9 flex-1 border-0 bg-transparent px-0"
          />
        </View>

        <View className="mb-3 flex-row items-center gap-1.5">
          {ROLE_FILTERS.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRoleFilter(r)}
              className={`rounded-full border px-3 py-1 ${
                roleFilter === r
                  ? "border-cyan-500 bg-cyan-500/10"
                  : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-xs ${
                  roleFilter === r ? "text-cyan-300" : "text-muted-foreground"
                }`}
              >
                {r === "all" ? "All" : r}
              </Text>
            </Pressable>
          ))}
          <Text className="ml-auto text-xs text-muted-foreground">
            {usersQuery.data?.total ?? 0}
          </Text>
        </View>

        {usersQuery.isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#2CD7E3" />
          </View>
        ) : usersQuery.isError ? (
          <Text className="py-6 text-center text-sm text-red-400">
            Failed to load users.{" "}
            {usersQuery.error instanceof Error ? usersQuery.error.message : ""}
          </Text>
        ) : rows.length === 0 ? (
          <Text className="py-6 text-center text-sm text-muted-foreground">
            No users match this filter.
          </Text>
        ) : (
          rows.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => setSelected(row)}
              className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
            >
              <View className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                {row.image ? (
                  <Image
                    source={row.image}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : null}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">
                  {row.name || row.email}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {row.handle ? `@${row.handle}` : row.email}
                </Text>
                <View className="mt-1 flex-row gap-1.5">
                  <StatusBadge tone={roleTone(row.role)}>{row.role}</StatusBadge>
                  {row.deletedAt ? (
                    <StatusBadge tone="red">Deleted</StatusBadge>
                  ) : !row.emailVerified ? (
                    <StatusBadge tone="amber">Unverified</StatusBadge>
                  ) : null}
                </View>
              </View>
              <View className="items-end">
                <Text className="text-[10px] text-muted-foreground">Joined</Text>
                <Text className="text-xs text-foreground">
                  {timeAgo(row.createdAt)}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable
          onPress={() => setSelected(null)}
          className="flex-1 justify-end bg-black/50"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="max-h-[90%] rounded-t-2xl border border-border bg-background"
          >
            {selected ? (
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View className="mb-4 flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-semibold text-foreground">
                      {selected.name || selected.email}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {selected.handle ? `@${selected.handle}` : selected.email}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                    <X size={20} color="#A3A3A3" />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="h-16 w-16 overflow-hidden rounded-full bg-muted">
                    {selected.image ? (
                      <Image
                        source={selected.image}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-foreground">{selected.email}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {selected.emailVerified ? "Verified" : "Email not verified"}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 flex-row flex-wrap gap-3">
                  <InfoCell
                    label="Member since"
                    value={formatDate(selected.createdAt)}
                  />
                  <InfoCell
                    label="User ID"
                    value={selected.id}
                  />
                  {selected.deletedAt ? (
                    <InfoCell
                      label="Deleted"
                      value={formatDate(selected.deletedAt)}
                    />
                  ) : null}
                </View>

                <Text className="mt-4 mb-1.5 text-xs text-muted-foreground">
                  Role
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {ALL_ROLES.map((r) => (
                    <Pressable
                      key={r}
                      disabled={roleMutation.isPending}
                      onPress={() =>
                        roleMutation.mutate({ userId: selected.id, role: r })
                      }
                      className={`rounded-md border px-3 py-1.5 ${
                        selected.role === r
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-border bg-card"
                      }`}
                      style={{ opacity: roleMutation.isPending ? 0.5 : 1 }}
                    >
                      <Text
                        className={`text-xs ${
                          selected.role === r
                            ? "text-cyan-300"
                            : "text-muted-foreground"
                        }`}
                      >
                        {r}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <View className="mb-2 flex-row items-center gap-2">
                    <Shield size={14} color="#F59E0B" />
                    <Text className="text-sm font-semibold text-foreground">
                      Sanctions
                    </Text>
                  </View>
                  {sanctionsQuery.isLoading ? (
                    <ActivityIndicator color="#2CD7E3" />
                  ) : activeSanctions.length > 0 ? (
                    <View className="gap-2">
                      {activeSanctions.map((s) => (
                        <View
                          key={s.id}
                          className="rounded-md border border-border bg-card p-2.5"
                        >
                          <View className="flex-row items-start justify-between gap-2">
                            <View className="flex-1">
                              <Text className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                {s.kind.replace("_", " ")}
                              </Text>
                              <Text className="text-xs text-foreground mt-0.5">
                                {s.reason}
                              </Text>
                              <Text className="text-[10px] text-muted-foreground mt-0.5">
                                Issued {timeAgo(s.createdAt)}
                                {s.expiresAt
                                  ? ` · Expires ${formatDate(s.expiresAt)}`
                                  : " · Permanent"}
                              </Text>
                            </View>
                            <Pressable
                              disabled={revertMutation.isPending}
                              onPress={() =>
                                revertMutation.mutate({
                                  userId: selected.id,
                                  sanctionId: s.id,
                                })
                              }
                              className="rounded-md border border-border bg-background px-2.5 py-1"
                            >
                              <View className="flex-row items-center gap-1">
                                <ShieldOff size={11} color="#FAFAFA" />
                                <Text className="text-[11px] text-foreground">
                                  Revert
                                </Text>
                              </View>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-xs text-muted-foreground">
                      No active sanctions.
                    </Text>
                  )}

                  <Text className="mt-3 mb-1 text-[11px] text-muted-foreground">
                    Issue new sanction
                  </Text>
                  <Input
                    value={sanctionReason}
                    onChangeText={setSanctionReason}
                    placeholder="Reason (required)"
                    className="h-9"
                  />
                  <View className="mt-2 flex-row flex-wrap gap-1.5">
                    {SANCTION_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.kind}
                        disabled={
                          sanctionMutation.isPending ||
                          !sanctionReason.trim() ||
                          activeSanctions.some((s) => s.kind === opt.kind)
                        }
                        onPress={() =>
                          sanctionMutation.mutate({
                            userId: selected.id,
                            kind: opt.kind,
                          })
                        }
                        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5"
                        style={{
                          opacity:
                            !sanctionReason.trim() ||
                            activeSanctions.some((s) => s.kind === opt.kind)
                              ? 0.4
                              : 1,
                        }}
                      >
                        <Text className="text-xs font-medium text-destructive">
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="mt-4 gap-2">
                  {selected.handle ? (
                    <Button
                      variant="outline"
                      onPress={() =>
                        router.push(`/profile/${selected.handle}` as never)
                      }
                    >
                      <ExternalLink size={14} color="#FAFAFA" />
                      <Text className="text-sm text-foreground">View profile</Text>
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    onPress={() =>
                      router.push(
                        `/admin/audit-log?actorId=${selected.id}` as never,
                      )
                    }
                  >
                    <ExternalLink size={14} color="#A855F7" />
                    <Text className="text-sm text-foreground">
                      View this admin&apos;s audit history
                    </Text>
                  </Button>
                </View>
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[44%]">
      <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <Text className="text-sm text-foreground" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
