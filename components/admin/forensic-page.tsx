import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  ChevronRight,
  ScanLine,
  ShieldCheck,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";

import { listAdminLoginEvents, listAuditLog } from "@/lib/api/admin";
import { Spinner } from "@/components/ui/spinner";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { timeAgo } from "./utils";

function actionTone(action: string): "red" | "amber" | "violet" | "blue" | "emerald" | "neutral" {
  if (action.endsWith(".delete") || action.endsWith(".force_end")) return "red";
  if (action.startsWith("user.sanction.revert")) return "emerald";
  if (action.startsWith("user.sanction")) return "amber";
  if (action.startsWith("role.")) return "violet";
  if (action.startsWith("report.")) return "blue";
  return "neutral";
}

export function ForensicPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-log", "preview"],
    queryFn: () => listAuditLog({ limit: 20 }),
    staleTime: 30_000,
  });

  const loginsQ = useQuery({
    queryKey: ["admin", "login-events", "preview"],
    queryFn: () => listAdminLoginEvents({ limit: 25 }),
    staleTime: 30_000,
  });

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Forensics & audit"
          description="Track what admins did and when. Watermark / piracy tracking ships with the Phase 4 streaming infra rollout."
        />

        <View className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <View className="flex-row items-center gap-2">
            <AlertTriangle size={16} color="#F59E0B" />
            <Text className="text-sm font-semibold text-foreground">
              Watermark + leak tracking — coming with Phase 4
            </Text>
          </View>
          <Text className="mt-1.5 text-xs text-muted-foreground">
            Per-session HLS watermarks, Telegram / Torrent / X scrape pipelines,
            and confidence-scored matches require the Cloudflare Stream
            migration. Shipping after RTMP-S + ABR ladder land on Hetzner.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/admin/audit-log" as never)}
          className="mt-4 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <View
            className="h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: "rgba(168,85,247,0.12)" }}
          >
            <ScanLine size={18} color="#A855F7" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">
              Full audit log
            </Text>
            <Text className="text-xs text-muted-foreground">
              Every admin action — searchable + filterable
            </Text>
          </View>
          <ChevronRight size={18} color="#737373" />
        </Pressable>

        <View className="mt-5 flex-row items-center gap-2">
          <ShieldCheck size={14} color="#2CD7E3" />
          <Text className="text-sm font-semibold text-foreground">
            Latest admin activity
          </Text>
        </View>

        {isLoading ? (
          <View className="items-center py-6">
            <Spinner />
          </View>
        ) : (data ?? []).length === 0 ? (
          <View className="mt-3 rounded-xl border border-dashed border-border p-6">
            <Text className="text-center text-sm text-muted-foreground">
              No admin actions logged yet.
            </Text>
          </View>
        ) : (
          <View className="mt-3 gap-2">
            {(data ?? []).map((row) => (
              <View
                key={row.id}
                className="rounded-xl border border-border bg-card p-3"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <StatusBadge tone={actionTone(row.action)}>
                    {row.action}
                  </StatusBadge>
                  <Text className="text-[11px] text-muted-foreground">
                    {timeAgo(row.createdAt)}
                  </Text>
                </View>
                <Text
                  className="text-xs text-foreground"
                  numberOfLines={1}
                >
                  {row.targetType}:{row.targetId}
                </Text>
                <Text className="mt-0.5 text-[11px] text-muted-foreground">
                  by{" "}
                  <Text className="font-mono">
                    {row.actorId ? row.actorId.slice(0, 12) + "…" : "system"}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="mt-6 flex-row items-center gap-2">
          <ShieldCheck size={14} color="#A855F7" />
          <Text className="text-sm font-semibold text-foreground">
            Recent sign-ins
          </Text>
        </View>

        {loginsQ.isLoading ? (
          <View className="items-center py-6">
            <Spinner />
          </View>
        ) : (loginsQ.data?.events ?? []).length === 0 ? (
          <View className="mt-3 rounded-xl border border-dashed border-border p-6">
            <Text className="text-center text-sm text-muted-foreground">
              No sign-in events logged yet.
            </Text>
          </View>
        ) : (
          <View className="mt-3 gap-2">
            {(loginsQ.data?.events ?? []).map((ev) => (
              <View
                key={ev.id}
                className="rounded-xl border border-border bg-card p-3"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {ev.userHandle ? `@${ev.userHandle}` : ev.userName}
                  </Text>
                  <Text className="text-[11px] text-muted-foreground">
                    {timeAgo(ev.createdAt)}
                  </Text>
                </View>
                <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
                  {ev.region ?? "?"} ·{" "}
                  <Text className="font-mono">
                    {ev.ipHash ? ev.ipHash.slice(0, 12) + "…" : "no-ip"}
                  </Text>
                </Text>
                {ev.userAgent ? (
                  <Text
                    className="mt-0.5 text-[10px] text-muted-foreground"
                    numberOfLines={1}
                  >
                    {ev.userAgent}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
