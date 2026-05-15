import * as React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Check, ExternalLink, Flag, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  bulkResolveReports,
  listAdminReports,
  resolveReport,
  type ContentReport,
  type ReportStatus,
} from "@/lib/api/reports";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { timeAgo } from "./utils";

const STATUS_TABS: { value: ReportStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

function categoryTone(c: string): "red" | "amber" | "blue" | "neutral" {
  if (c === "csam" || c === "illegal" || c === "abuse") return "red";
  if (c === "copyright" || c === "impersonation") return "amber";
  if (c === "spam") return "blue";
  return "neutral";
}

function ReportCard({
  report,
  onResolve,
  onDismiss,
  onOpenTarget,
}: {
  report: ContentReport;
  onResolve: (notes: string) => void;
  onDismiss: (notes: string) => void;
  onOpenTarget: () => void;
}) {
  const [notes, setNotes] = React.useState("");
  const isOpen = report.status === "open";

  return (
    <View className="mb-3 rounded-xl border border-border bg-card/40 p-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <StatusBadge tone={categoryTone(report.category)}>
          {report.category}
        </StatusBadge>
        <StatusBadge tone="neutral">{report.targetType}</StatusBadge>
        <Text className="text-xs text-muted-foreground">
          {timeAgo(report.createdAt)}
        </Text>
        {!isOpen ? (
          <StatusBadge
            tone={report.status === "resolved" ? "emerald" : "neutral"}
          >
            {report.status}
          </StatusBadge>
        ) : null}
      </View>

      <Pressable
        onPress={onOpenTarget}
        className="mt-2 flex-row items-center gap-1.5"
      >
        <Text className="text-xs text-muted-foreground">
          Target:{" "}
          <Text className="font-mono text-foreground">{report.targetId}</Text>
        </Text>
        <ExternalLink size={11} color="#2CD7E3" />
      </Pressable>
      <Text className="mt-1 text-xs text-muted-foreground">
        Reporter:{" "}
        <Text className="font-mono text-foreground">
          {report.reporterUserId
            ? report.reporterUserId.slice(0, 12) + "…"
            : "anon"}
        </Text>
      </Text>

      {report.targetPreview ? (
        <View className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Reported message
          </Text>
          <Text className="mt-1 text-sm italic text-foreground">
            &ldquo;{report.targetPreview.body}&rdquo;
          </Text>
        </View>
      ) : null}

      {report.details ? (
        <View className="mt-2 rounded-md border border-border bg-background p-2">
          <Text className="text-sm text-foreground">{report.details}</Text>
        </View>
      ) : null}

      {report.resolutionNotes ? (
        <View className="mt-2 rounded-md border border-border bg-background/50 p-2">
          <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Resolution notes
          </Text>
          <Text className="text-sm text-foreground">
            {report.resolutionNotes}
          </Text>
        </View>
      ) : null}

      {isOpen ? (
        <View className="mt-3">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (optional)"
            placeholderTextColor="#737373"
            className="mb-2 h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground"
          />
          <View className="flex-row gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-500"
              onPress={() => onResolve(notes)}
            >
              <Check size={12} color="#000" />
              <Text className="text-xs font-semibold text-black">
                Resolve
              </Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-border bg-card"
              onPress={() => onDismiss(notes)}
            >
              <X size={12} color="#FAFAFA" />
              <Text className="text-xs text-foreground">Dismiss</Text>
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function targetHref(r: ContentReport): string | null {
  switch (r.targetType) {
    case "stream":
      return `/stream/${r.targetId}`;
    case "vod":
      return `/vod/${r.targetId}`;
    case "clip":
      return `/clips/${r.targetId}`;
    case "user":
      return `/profile/${r.targetId}`;
    case "chat_message":
      return r.targetPreview?.streamId
        ? `/stream/${r.targetPreview.streamId}`
        : null;
    case "party":
      return `/watch-parties/${r.targetId}`;
    default:
      return null;
  }
}

export function ModerationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<ReportStatus>("open");
  const [selectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const bulkMut = useMutation({
    mutationFn: ({
      ids,
      action,
    }: {
      ids: string[];
      action: "resolved" | "dismissed";
    }) => bulkResolveReports(ids, action),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      setSelectedIds(new Set());
      setSelectMode(false);
      toast.success(
        `${res.updated} ${vars.action} · ${res.skipped} skipped`,
      );
    },
    onError: (err) =>
      toast.error("Bulk action failed", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-reports", status],
    queryFn: () => listAdminReports({ status, limit: 100 }),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      status: next,
      notes,
    }: {
      id: string;
      status: "resolved" | "dismissed";
      notes: string;
    }) => resolveReport(id, next, notes.trim() || undefined),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success(
        res.status === "resolved" ? "Report resolved" : "Report dismissed",
      );
    },
    onError: (err) =>
      toast.error("Couldn't update report", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  const reports = data?.reports ?? [];

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Moderation"
          description="User-submitted reports against streams, VODs, clips, users, chat messages."
        />

        <View className="mb-3 flex-row gap-2">
          {STATUS_TABS.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setStatus(t.value)}
              className={`flex-1 rounded-md border px-3 py-2 ${
                status === t.value
                  ? "border-brand bg-brand/15"
                  : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-center text-xs font-semibold ${
                  status === t.value ? "text-brand" : "text-foreground"
                }`}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {status === "open" ? (
          <View className="mb-3 flex-row items-center gap-2">
            <Pressable
              onPress={() => {
                setSelectMode((v) => !v);
                setSelectedIds(new Set());
              }}
              className={`rounded-md border px-3 py-1.5 ${
                selectMode ? "border-brand bg-brand/15" : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectMode ? "text-brand" : "text-foreground"
                }`}
              >
                {selectMode ? "Cancel" : "Select multiple"}
              </Text>
            </Pressable>
            {selectMode && selectedIds.size > 0 ? (
              <>
                <Text className="text-xs text-muted-foreground">
                  {selectedIds.size} selected
                </Text>
                <Pressable
                  onPress={() =>
                    bulkMut.mutate({
                      ids: [...selectedIds],
                      action: "resolved",
                    })
                  }
                  disabled={bulkMut.isPending}
                  className="ml-auto rounded-md border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5"
                >
                  <Text className="text-xs font-semibold text-emerald-400">
                    Resolve all
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    bulkMut.mutate({
                      ids: [...selectedIds],
                      action: "dismissed",
                    })
                  }
                  disabled={bulkMut.isPending}
                  className="rounded-md border border-border bg-card px-3 py-1.5"
                >
                  <Text className="text-xs text-foreground">Dismiss</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}

        {error ? (
          <Text className="text-sm text-destructive">
            Couldn&apos;t load reports: {error.message}
          </Text>
        ) : isLoading ? (
          <View className="items-center py-8">
            <Spinner size="large" />
          </View>
        ) : reports.length === 0 ? (
          <View className="items-center rounded-xl border border-dashed border-border p-8">
            <Flag size={24} color="#737373" />
            <Text className="mt-2 text-sm text-muted-foreground">
              No {status} reports.
            </Text>
          </View>
        ) : (
          reports.map((r) => (
            <View key={r.id} className="flex-row items-start gap-2">
              {selectMode && r.status === "open" ? (
                <Pressable
                  onPress={() => toggleSelect(r.id)}
                  className={`mt-4 h-5 w-5 items-center justify-center rounded border ${
                    selectedIds.has(r.id)
                      ? "border-brand bg-brand"
                      : "border-border bg-card"
                  }`}
                >
                  {selectedIds.has(r.id) ? (
                    <Text className="text-[11px] font-bold text-black">✓</Text>
                  ) : null}
                </Pressable>
              ) : null}
              <View className="flex-1">
                <ReportCard
                  report={r}
                  onResolve={(notes) =>
                    mutation.mutate({ id: r.id, status: "resolved", notes })
                  }
                  onDismiss={(notes) =>
                    mutation.mutate({ id: r.id, status: "dismissed", notes })
                  }
                  onOpenTarget={() => {
                    const href = targetHref(r);
                    if (href) router.push(href as never);
                    else toast.info("No deep link for this target type");
                  }}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
