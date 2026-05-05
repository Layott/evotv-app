import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  CheckCircle2,
  Clock4,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react-native";
import { toast } from "sonner-native";
import { useQuery } from "@tanstack/react-query";

import {
  listAllUssdSessions,
  overrideUssdSession,
  type UssdSession,
  type UssdStatus,
} from "@/lib/mock/ussd";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatNgn, timeAgo } from "./utils";

function statusTone(s: UssdStatus): "amber" | "emerald" | "red" {
  if (s === "awaiting") return "amber";
  if (s === "confirmed") return "emerald";
  return "red";
}

export function AdminBillingPage() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [confirming, setConfirming] = React.useState<UssdSession | null>(null);
  const [expiring, setExpiring] = React.useState<UssdSession | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const sessionsQ = useQuery({
    queryKey: ["admin", "ussd-sessions", refreshKey],
    queryFn: () => listAllUssdSessions(),
    refetchInterval: 5_000,
  });

  const sessions: UssdSession[] = sessionsQ.data ?? [];

  const filtered = React.useMemo(() => {
    let rows = sessions;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((s) =>
        [s.code, s.providerLabel, s.shortCode, s.userId].some((v) =>
          v.toLowerCase().includes(q),
        ),
      );
    }
    if (statusFilter !== "all")
      rows = rows.filter((s) => s.status === statusFilter);
    return rows;
  }, [sessions, search, statusFilter]);

  const counts = React.useMemo(() => {
    const c = {
      awaiting: 0,
      confirmed: 0,
      expired: 0,
      total: sessions.length,
    };
    for (const s of sessions) c[s.status] += 1;
    return c;
  }, [sessions]);

  async function refresh() {
    setRefreshKey((k) => k + 1);
    await sessionsQ.refetch();
  }

  async function override(
    session: UssdSession,
    next: Exclude<UssdStatus, "awaiting">,
  ) {
    const updated = await overrideUssdSession(session.id, next);
    if (!updated) {
      toast.error("Session no longer exists");
    } else {
      toast.success(
        next === "confirmed"
          ? `Confirmed ${session.code} manually`
          : `Marked ${session.code} expired`,
      );
    }
    await sessionsQ.refetch();
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Billing & USSD"
          description="Monitor pending USSD sessions, manually confirm or expire."
          actions={
            <Button
              variant="outline"
              onPress={refresh}
              disabled={sessionsQ.isFetching}
            >
              {sessionsQ.isFetching ? (
                <Loader2 size={14} color="#A3A3A3" />
              ) : (
                <RefreshCw size={14} color="#FAFAFA" />
              )}
              <Text className="text-xs text-foreground">Refresh</Text>
            </Button>
          }
        />

        <View className="mb-4 flex-row flex-wrap gap-2">
          <SummaryCard
            label="Total"
            value={counts.total}
            tone="neutral"
            Icon={Clock4}
          />
          <SummaryCard
            label="Awaiting"
            value={counts.awaiting}
            tone="amber"
            Icon={Clock4}
          />
          <SummaryCard
            label="Confirmed"
            value={counts.confirmed}
            tone="emerald"
            Icon={CheckCircle2}
          />
          <SummaryCard
            label="Expired"
            value={counts.expired}
            tone="red"
            Icon={XCircle}
          />
        </View>

        <View className="rounded-2xl border border-border bg-card/40 p-4">
          <Text className="text-base font-semibold text-foreground">
            Pending USSD
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            Auto-confirm 30s after start. Override only when carrier stalls.
          </Text>

          <View className="mt-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
            <Search size={14} color="#A3A3A3" />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search code, provider, user"
              className="h-9 flex-1 border-0 bg-transparent px-0"
            />
          </View>

          <View className="mt-3 flex-row gap-1.5">
            {(["all", "awaiting", "confirmed", "expired"] as const).map(
              (s) => (
                <Pressable
                  key={s}
                  onPress={() => setStatusFilter(s)}
                  className={`rounded-full border px-3 py-1 ${
                    statusFilter === s
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-border bg-card"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      statusFilter === s
                        ? "text-cyan-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s}
                  </Text>
                </Pressable>
              ),
            )}
            <Text className="ml-auto text-xs text-muted-foreground">
              {filtered.length}
            </Text>
          </View>

          <View className="mt-3">
            {sessionsQ.isLoading ? (
              <Text className="text-sm text-muted-foreground">Loading…</Text>
            ) : filtered.length === 0 ? (
              <View className="rounded-xl border border-dashed border-border p-6">
                <Text className="text-center text-sm text-muted-foreground">
                  No USSD sessions match these filters.
                </Text>
              </View>
            ) : null}
            {filtered.map((row) => (
              <View
                key={row.id}
                className="mb-2 rounded-xl border border-border bg-card/60 p-3"
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className="font-mono text-base text-foreground"
                    style={{ letterSpacing: 4 }}
                  >
                    {row.code}
                  </Text>
                  <StatusBadge
                    tone={statusTone(row.status)}
                    dot={row.status === "awaiting"}
                  >
                    {row.status}
                  </StatusBadge>
                </View>
                <View className="mt-2 flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm text-foreground">
                      {row.providerLabel}
                    </Text>
                    <Text className="font-mono text-xs text-muted-foreground">
                      {row.shortCode}
                    </Text>
                    <Text className="font-mono text-[10px] text-muted-foreground">
                      {row.userId}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-sm font-semibold text-foreground"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {formatNgn(row.amountNgn)}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground">
                      {timeAgo(row.startedAt)}
                    </Text>
                  </View>
                </View>
                <View className="mt-3 flex-row gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={row.status !== "awaiting"}
                    className="flex-1"
                    onPress={() => setConfirming(row)}
                  >
                    <CheckCircle2 size={12} color="#FAFAFA" />
                    <Text className="text-xs text-foreground">Confirm</Text>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={row.status !== "awaiting"}
                    className="flex-1"
                    onPress={() => setExpiring(row)}
                  >
                    <XCircle size={12} color="#FAFAFA" />
                    <Text className="text-xs text-foreground">Expire</Text>
                  </Button>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Dialog
        open={!!confirming}
        onOpenChange={(o) => !o && setConfirming(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manually confirm session?</DialogTitle>
            <DialogDescription>
              Marks linking code {confirming?.code} confirmed and grants user
              Premium.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onPress={() => setConfirming(null)}>
              <Text className="text-sm text-foreground">Cancel</Text>
            </Button>
            <Button
              className="bg-cyan-500"
              onPress={async () => {
                if (!confirming) return;
                await override(confirming, "confirmed");
                setConfirming(null);
              }}
            >
              <Text className="text-sm font-medium text-black">
                Confirm session
              </Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!expiring} onOpenChange={(o) => !o && setExpiring(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expire session?</DialogTitle>
            <DialogDescription>
              Invalidates linking code {expiring?.code}. User must restart.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onPress={() => setExpiring(null)}>
              <Text className="text-sm text-foreground">Cancel</Text>
            </Button>
            <Button
              variant="destructive"
              onPress={async () => {
                if (!expiring) return;
                await override(expiring, "expired");
                setExpiring(null);
              }}
            >
              <Text className="text-sm text-white">Expire</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  Icon,
}: {
  label: string;
  value: number;
  tone: "neutral" | "amber" | "emerald" | "red";
  Icon: import("lucide-react-native").LucideIcon;
}) {
  const accent: Record<typeof tone, { bg: string; ring: string; iconColor: string }> = {
    neutral: {
      bg: "bg-neutral-700/30",
      ring: "border-neutral-700",
      iconColor: "#A3A3A3",
    },
    amber: {
      bg: "bg-amber-500/10",
      ring: "border-amber-500/30",
      iconColor: "#FCD34D",
    },
    emerald: {
      bg: "bg-cyan-500/10",
      ring: "border-cyan-500/30",
      iconColor: "#67E8F0",
    },
    red: { bg: "bg-red-500/10", ring: "border-red-500/30", iconColor: "#FCA5A5" },
  };
  const t = accent[tone];
  return (
    <View className="min-w-[46%] flex-1 flex-row items-center gap-3 rounded-2xl border border-border bg-card/40 p-3">
      <View
        className={`h-10 w-10 items-center justify-center rounded-lg border ${t.bg} ${t.ring}`}
      >
        <Icon size={20} color={t.iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </Text>
        <Text
          className="text-lg font-bold text-foreground"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
