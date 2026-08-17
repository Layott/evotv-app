import * as React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { Check, Clock, Sparkles, X } from "lucide-react-native";

import {
  listCreatorApplications,
  reviewCreatorApplication,
  type AdminCreatorApplication,
  type CreatorAppStatus,
} from "@/lib/api/admin";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

const FILTER_TABS: { value: CreatorAppStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "New" },
  { value: "in_review", label: "Reviewing" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function statusColor(s: CreatorAppStatus): string {
  if (s === "approved") return "#34D399";
  if (s === "rejected") return "#EF4444";
  if (s === "in_review") return "#F59E0B";
  return "#46E3CE";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminCreatorProgramScreen() {
  const [filter, setFilter] = React.useState<CreatorAppStatus | "all">("all");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin", "creator-program", filter],
    queryFn: () =>
      listCreatorApplications(filter === "all" ? undefined : filter),
  });

  const mut = useMutation({
    mutationFn: (args: {
      id: string;
      status: "in_review" | "approved" | "rejected";
      note?: string;
    }) => reviewCreatorApplication(args.id, args.status, args.note),
    onSuccess: (row) => {
      toast.success(`Application ${row.status.replace("_", " ")}`);
      setOpenId(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["admin", "creator-program"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Review failed");
    },
  });

  const rows = q.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "Creator program" }} />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-12">
        <View className="px-4 pt-4 pb-2 gap-2 border-b border-border">
          <View className="flex-row items-center gap-2">
            <Sparkles size={18} color="#46E3CE" />
            <Text className="text-xl font-bold text-foreground">
              Creator applications
            </Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            Approve or reject creator-program applicants. Approving here only
            flips status - promote the user's role separately in Users.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 mt-3"
        >
          {FILTER_TABS.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setFilter(t.value)}
              className={`mr-2 rounded-full border px-3 py-1.5 ${
                filter === t.value
                  ? "border-brand/60 bg-brand/10"
                  : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  filter === t.value ? "text-brand" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {q.isLoading ? (
          <View className="px-4 py-10 items-center">
            <Spinner size="large" />
          </View>
        ) : rows.length === 0 ? (
          <View className="px-4 py-10">
            <Text className="text-center text-sm text-muted-foreground">
              No applications match this filter.
            </Text>
          </View>
        ) : (
          <View className="px-4 mt-4 gap-3">
            {rows.map((row) => (
              <ApplicationCard
                key={row.id}
                row={row}
                open={openId === row.id}
                note={openId === row.id ? note : ""}
                onToggle={() => {
                  setOpenId(openId === row.id ? null : row.id);
                  setNote("");
                }}
                onNoteChange={setNote}
                onReview={(status) =>
                  mut.mutate({
                    id: row.id,
                    status,
                    note: note.trim() || undefined,
                  })
                }
                disabled={mut.isPending}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function ApplicationCard({
  row,
  open,
  note,
  onToggle,
  onNoteChange,
  onReview,
  disabled,
}: {
  row: AdminCreatorApplication;
  open: boolean;
  note: string;
  onToggle: () => void;
  onNoteChange: (v: string) => void;
  onReview: (status: "in_review" | "approved" | "rejected") => void;
  disabled: boolean;
}) {
  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <Pressable onPress={onToggle}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
              {row.socialHandle} · {row.socialPlatform}
            </Text>
            <Text className="text-[11px] text-muted-foreground mt-0.5">
              {row.followerCount.toLocaleString()} followers · {row.country}
            </Text>
          </View>
          <Badge
            className="border-0"
            style={{ backgroundColor: statusColor(row.status) + "22" }}
            textClassName="text-[10px]"
          >
            <Text
              className="text-[10px] font-semibold"
              style={{ color: statusColor(row.status) }}
            >
              {row.status.replace("_", " ")}
            </Text>
          </Badge>
        </View>

        <Text className="text-xs text-muted-foreground mt-2" numberOfLines={open ? undefined : 2}>
          {row.bio}
        </Text>

        <View className="mt-2 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Clock size={11} color="#9FBDBD" />
            <Text className="text-[10px] text-muted-foreground">
              Submitted {fmtDate(row.submittedAt)}
            </Text>
          </View>
          {row.reviewedAt ? (
            <Text className="text-[10px] text-muted-foreground">
              · Reviewed {fmtDate(row.reviewedAt)}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {open ? (
        <View className="mt-3 gap-3 border-t border-border pt-3">
          <View className="gap-1">
            <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Primary game
            </Text>
            <Text className="text-xs text-foreground">{row.primaryGameId}</Text>
          </View>

          {row.reviewerNote ? (
            <View className="gap-1">
              <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Previous note
              </Text>
              <Text className="text-xs text-foreground">{row.reviewerNote}</Text>
            </View>
          ) : null}

          <View className="gap-1">
            <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Review note (optional)
            </Text>
            <TextInput
              value={note}
              onChangeText={onNoteChange}
              placeholder="Why this decision?"
              placeholderTextColor="#737373"
              multiline
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              style={{ minHeight: 60 }}
            />
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => onReview("in_review")}
              disabled={disabled || row.status === "in_review"}
              className="flex-1 flex-row items-center justify-center gap-1 rounded-full bg-amber-500/25 px-3 py-2 active:opacity-80"
            >
              <Clock size={13} color="#F59E0B" />
              <Text className="text-xs font-semibold text-amber-300">
                Mark reviewing
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onReview("approved")}
              disabled={disabled || row.status === "approved"}
              className="flex-1 flex-row items-center justify-center gap-1 rounded-full bg-emerald-500/25 px-3 py-2 active:opacity-80"
            >
              <Check size={13} color="#34D399" />
              <Text className="text-xs font-semibold text-emerald-300">
                Approve
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onReview("rejected")}
              disabled={disabled || row.status === "rejected"}
              className="flex-1 flex-row items-center justify-center gap-1 rounded-full bg-rose-500/25 px-3 py-2 active:opacity-80"
            >
              <X size={13} color="#EF4444" />
              <Text className="text-xs font-semibold text-rose-300">
                Reject
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
