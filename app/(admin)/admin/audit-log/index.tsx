import * as React from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { listAuditLog, type AuditLogEntry } from "@/lib/api/admin";

const ACTION_FILTERS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Streams", value: "stream." },
  { label: "VODs", value: "vod." },
  { label: "Clips", value: "clip." },
  { label: "Users", value: "user." },
  { label: "Roles", value: "role." },
];

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function actionColor(action: string): string {
  if (action.endsWith(".delete") || action.endsWith(".force_end")) return "#EF4444";
  if (action.startsWith("user.sanction")) return "#F59E0B";
  if (action.startsWith("role.")) return "#A855F7";
  return "#2CD7E3";
}

function AuditRow({ row }: { row: AuditLogEntry }) {
  const [expanded, setExpanded] = React.useState(false);
  const metaCount = row.meta ? Object.keys(row.meta).length : 0;
  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <Text
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: actionColor(row.action) }}
        >
          {row.action}
        </Text>
        <Text className="text-[11px] text-muted-foreground">
          {fmtTime(row.createdAt)}
        </Text>
      </View>
      <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
        {row.targetType}:{row.targetId}
      </Text>
      <Text className="text-[11px] text-muted-foreground mt-0.5">
        actor:{" "}
        <Text className="font-mono">
          {row.actorId ? row.actorId.slice(0, 12) + "…" : "system"}
        </Text>
        {metaCount > 0 ? ` · ${metaCount} field${metaCount === 1 ? "" : "s"}` : ""}
      </Text>
      {expanded && row.meta ? (
        <View className="mt-3 rounded-xl border border-border bg-background p-3">
          <Text className="text-[11px] font-mono text-foreground" selectable>
            {JSON.stringify(row.meta, null, 2)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function AuditLogScreen() {
  const [filter, setFilter] = React.useState<string | null>(null);

  const { data, isLoading, isFetching, refetch, error } = useQuery<
    AuditLogEntry[],
    Error
  >({
    queryKey: ["admin", "audit-log"],
    queryFn: () => listAuditLog(200),
  });

  const filtered = React.useMemo(() => {
    if (!data) return [];
    if (!filter) return data;
    return data.filter((r) => r.action.startsWith(filter));
  }, [data, filter]);

  return (
    <>
      <Stack.Screen options={{ title: "Audit log" }} />
      <View className="flex-1 bg-background">
        <View className="px-4 pt-4 pb-2 flex-row flex-wrap gap-2">
          {ACTION_FILTERS.map((f) => (
            <Pressable
              key={f.label}
              onPress={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full border ${
                filter === f.value
                  ? "border-brand bg-brand/15"
                  : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filter === f.value ? "text-brand" : "text-foreground"
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? (
          <View className="px-4 pt-4">
            <Text className="text-sm text-destructive">
              Couldn&apos;t load audit log: {error.message}
            </Text>
          </View>
        ) : null}

        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <AuditRow row={item} />}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor="#2CD7E3"
            />
          }
          ListEmptyComponent={
            <View className="px-4 py-12 items-center">
              <Text className="text-sm text-muted-foreground">
                {isLoading
                  ? "Loading audit log…"
                  : filter
                    ? `No ${filter.replace(".", "")} actions logged.`
                    : "No actions logged yet."}
              </Text>
            </View>
          }
        />
      </View>
    </>
  );
}
