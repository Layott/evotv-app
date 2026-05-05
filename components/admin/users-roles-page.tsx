import * as React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { ExternalLink, Search, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";

import { profiles } from "@/lib/mock/users";
import type { Profile, Role } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatDate, seededRandom, timeAgo } from "./utils";

interface AdminProfile extends Profile {
  lastActive: string;
  suspended: boolean;
}

function roleTone(role: Role): "emerald" | "amber" | "blue" | "neutral" {
  if (role === "admin") return "emerald";
  if (role === "premium") return "amber";
  if (role === "user") return "blue";
  return "neutral";
}

function buildInitial(): AdminProfile[] {
  const rng = seededRandom(11);
  return profiles.map((p) => ({
    ...p,
    suspended: false,
    lastActive: new Date(
      Date.now() - Math.floor(rng() * 48) * 3_600_000,
    ).toISOString(),
  }));
}

export function UsersRolesPage() {
  const router = useRouter();
  const [all, setAll] = React.useState<AdminProfile[]>(() => buildInitial());
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<AdminProfile | null>(null);

  const filtered = React.useMemo(() => {
    let rows = all;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.handle.toLowerCase().includes(q) ||
          p.displayName.toLowerCase().includes(q),
      );
    }
    if (roleFilter !== "all") rows = rows.filter((p) => p.role === roleFilter);
    return rows;
  }, [all, search, roleFilter]);

  function handleRoleChange(id: string, role: Role) {
    setAll((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, role } : prev));
    toast.success(`Role changed to ${role}`);
  }

  function handleSuspendToggle(id: string, suspended: boolean) {
    setAll((prev) =>
      prev.map((p) => (p.id === id ? { ...p, suspended } : p)),
    );
    setSelected((prev) =>
      prev && prev.id === id ? { ...prev, suspended } : prev,
    );
    toast.success(suspended ? "User suspended" : "Suspension lifted");
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Users & roles"
          description="Search accounts, manage roles and suspensions."
        />

        <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
          <Search size={14} color="#A3A3A3" />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search handle or name"
            className="h-9 flex-1 border-0 bg-transparent px-0"
          />
        </View>

        <View className="mb-3 flex-row items-center gap-1.5">
          {(["all", "user", "premium", "admin"] as const).map((r) => (
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
            {filtered.length}
          </Text>
        </View>

        {filtered.map((row) => (
          <Pressable
            key={row.id}
            onPress={() => setSelected(row)}
            className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
          >
            <View className="h-10 w-10 overflow-hidden rounded-full bg-muted">
              <Image
                source={row.avatarUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground">
                {row.displayName}
              </Text>
              <Text className="text-xs text-muted-foreground">
                @{row.handle}
              </Text>
              <View className="mt-1 flex-row gap-1.5">
                <StatusBadge tone={roleTone(row.role)}>
                  {row.role}
                </StatusBadge>
                <StatusBadge tone="neutral">{row.country}</StatusBadge>
                {row.suspended ? (
                  <StatusBadge tone="red">Suspended</StatusBadge>
                ) : null}
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[10px] text-muted-foreground">Active</Text>
              <Text className="text-xs text-foreground">
                {timeAgo(row.lastActive)}
              </Text>
            </View>
          </Pressable>
        ))}
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
                      {selected.displayName}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      @{selected.handle}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                    <X size={20} color="#A3A3A3" />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="h-16 w-16 overflow-hidden rounded-full bg-muted">
                    <Image
                      source={selected.avatarUrl}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-foreground">
                      {selected.bio || "No bio yet."}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 flex-row flex-wrap gap-3">
                  <InfoCell label="Country" value={selected.country} />
                  <InfoCell
                    label="Member since"
                    value={formatDate(selected.createdAt)}
                  />
                  <InfoCell
                    label="Last active"
                    value={timeAgo(selected.lastActive)}
                  />
                  <InfoCell
                    label="Onboarded"
                    value={selected.onboardedAt ? "Yes" : "No"}
                  />
                </View>

                <Text className="mt-4 mb-1.5 text-xs text-muted-foreground">
                  Role
                </Text>
                <View className="flex-row gap-1.5">
                  {(["user", "premium", "admin"] as Role[]).map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => handleRoleChange(selected.id, r)}
                      className={`rounded-md border px-3 py-1.5 ${
                        selected.role === r
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-border bg-card"
                      }`}
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

                <View className="mt-4 flex-row items-center justify-between rounded-lg border border-border bg-card/40 p-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      Suspend account
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      Prevents login and posting.
                    </Text>
                  </View>
                  <Switch
                    checked={selected.suspended}
                    onCheckedChange={(v) =>
                      handleSuspendToggle(selected.id, v)
                    }
                  />
                </View>

                <Button
                  variant="outline"
                  className="mt-4"
                  onPress={() =>
                    router.push(`/profile/${selected.handle}` as never)
                  }
                >
                  <ExternalLink size={14} color="#FAFAFA" />
                  <Text className="text-sm text-foreground">View profile</Text>
                </Button>
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
      <Text className="text-sm text-foreground">{value}</Text>
    </View>
  );
}
