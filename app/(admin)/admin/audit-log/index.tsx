import * as React from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { toast } from "sonner-native";
import { Download, SlidersHorizontal } from "lucide-react-native";

import {
  auditLogExportUrl,
  listAuditLog,
  type AuditLogEntry,
} from "@/lib/api/admin";
import { BASE_URL, getToken } from "@/lib/api/_client";

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
  const searchParams = useLocalSearchParams<{ actorId?: string }>();
  const presetActorId = typeof searchParams.actorId === "string" ? searchParams.actorId : undefined;

  const [filter, setFilter] = React.useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = React.useState(!!presetActorId);
  const [actorId, setActorId] = React.useState<string>(presetActorId ?? "");
  const [targetType, setTargetType] = React.useState<string>("");
  const [targetId, setTargetId] = React.useState<string>("");
  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");
  const [exporting, setExporting] = React.useState(false);

  const effectiveFilters = React.useMemo(
    () => ({
      action: filter ?? undefined,
      actorId: actorId.trim() || undefined,
      targetType: targetType.trim() || undefined,
      targetId: targetId.trim() || undefined,
      fromDate: fromDate.trim() || undefined,
      toDate: toDate.trim() || undefined,
      limit: 200,
    }),
    [filter, actorId, targetType, targetId, fromDate, toDate],
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery<
    AuditLogEntry[],
    Error
  >({
    queryKey: ["admin", "audit-log", effectiveFilters],
    queryFn: () => listAuditLog(effectiveFilters),
  });

  const filtered = data ?? [];

  const handleExport = React.useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const token = await getToken();
      const url = auditLogExportUrl({ ...effectiveFilters, limit: 10_000 });
      const target = `${FileSystem.cacheDirectory}audit-log-${Date.now()}.csv`;
      const dl = FileSystem.createDownloadResumable(url, target, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const res = await dl.downloadAsync();
      if (!res || res.status !== 200) {
        toast.error("Export failed", {
          description: res ? `HTTP ${res.status}` : "no response",
        });
        return;
      }
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(res.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export audit log",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        toast.success("Saved to cache", { description: res.uri });
      }
    } catch (e) {
      toast.error("Export failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setExporting(false);
    }
  }, [effectiveFilters, exporting]);

  return (
    <>
      <Stack.Screen options={{ title: "Audit log" }} />
      <View className="flex-1 bg-background">
        <View className="px-4 pt-4 pb-2 flex-row flex-wrap items-center gap-2">
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
          <Pressable
            onPress={() => setShowAdvanced((v) => !v)}
            className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1.5 ${
              showAdvanced
                ? "border-brand bg-brand/15"
                : "border-border bg-card"
            }`}
          >
            <SlidersHorizontal size={11} color={showAdvanced ? "#2CD7E3" : "#FAFAFA"} />
            <Text
              className={`text-xs font-semibold ${
                showAdvanced ? "text-brand" : "text-foreground"
              }`}
            >
              Filters
            </Text>
          </Pressable>
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            className="px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex-row items-center gap-1.5"
          >
            <Download size={11} color="#10B981" />
            <Text className="text-xs font-semibold text-emerald-400">
              {exporting ? "Exporting…" : "CSV"}
            </Text>
          </Pressable>
        </View>

        {showAdvanced ? (
          <View className="px-4 pb-2 gap-2">
            <TextInput
              value={actorId}
              onChangeText={setActorId}
              placeholder="actorId (admin user ID)"
              placeholderTextColor="#737373"
              className="h-9 rounded-md border border-border bg-card px-3 text-xs text-foreground"
            />
            <TextInput
              value={targetType}
              onChangeText={setTargetType}
              placeholder="targetType (stream, user, vod, …)"
              placeholderTextColor="#737373"
              className="h-9 rounded-md border border-border bg-card px-3 text-xs text-foreground"
            />
            <TextInput
              value={targetId}
              onChangeText={setTargetId}
              placeholder="targetId"
              placeholderTextColor="#737373"
              className="h-9 rounded-md border border-border bg-card px-3 text-xs text-foreground"
            />
            <View className="flex-row gap-2">
              <TextInput
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="from (YYYY-MM-DD)"
                placeholderTextColor="#737373"
                className="h-9 flex-1 rounded-md border border-border bg-card px-3 text-xs text-foreground"
              />
              <TextInput
                value={toDate}
                onChangeText={setToDate}
                placeholder="to (YYYY-MM-DD)"
                placeholderTextColor="#737373"
                className="h-9 flex-1 rounded-md border border-border bg-card px-3 text-xs text-foreground"
              />
            </View>
            {presetActorId ? (
              <Text className="text-[10px] text-muted-foreground">
                Pre-filtered to actor {presetActorId.slice(0, 12)}…
              </Text>
            ) : null}
          </View>
        ) : null}

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
