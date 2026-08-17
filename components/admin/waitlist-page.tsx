import * as React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Download, Search } from "@/components/icons";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import * as Clipboard from "expo-clipboard";

import { listAdminWaitlist, type WaitlistEntry } from "@/lib/api/waitlist";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatDate, timeAgo } from "./utils";

const CSV_COLUMNS = [
  "email",
  "username",
  "verified",
  "verifiedAt",
  "source",
  "createdAt",
] as const;

/** Escape a single CSV cell per RFC 4180 (quote + double inner quotes). */
function csvCell(value: string | boolean | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function buildCsv(entries: WaitlistEntry[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = entries.map((e) =>
    [
      e.email,
      e.username,
      e.verified,
      e.verifiedAt,
      e.source,
      e.createdAt,
    ]
      .map(csvCell)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

export function WaitlistPage() {
  const [search, setSearch] = React.useState("");

  const waitlistQ = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: listAdminWaitlist,
    staleTime: 30_000,
  });

  const entries = React.useMemo(
    () => waitlistQ.data?.entries ?? [],
    [waitlistQ.data],
  );

  const verifiedCount = React.useMemo(
    () => entries.filter((e) => e.verified).length,
    [entries],
  );
  const pendingCount = entries.length - verifiedCount;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.email.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q),
    );
  }, [entries, search]);

  function handleExport() {
    if (entries.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }
    const csv = buildCsv(entries);

    if (Platform.OS === "web") {
      try {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "evotv-waitlist.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Waitlist CSV downloaded");
      } catch (err) {
        toast.error("Couldn't export CSV", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }

    Clipboard.setStringAsync(csv)
      .then(() => toast.success("Waitlist CSV copied to clipboard"))
      .catch((err) =>
        toast.error("Couldn't copy CSV", {
          description: err instanceof Error ? err.message : String(err),
        }),
      );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Waitlist"
          description="Pre-launch signups. Search, then export to CSV."
          actions={
            <Pressable
              onPress={handleExport}
              disabled={entries.length === 0}
              className="flex-row items-center gap-1.5 rounded-md bg-cyan-500/25 px-3 py-2"
              style={{ opacity: entries.length === 0 ? 0.4 : 1 }}
            >
              <Download size={14} color="#46E3CE" />
              <Text className="text-xs font-semibold text-cyan-300">
                Export CSV
              </Text>
            </Pressable>
          }
        />

        <View className="mb-3 flex-row flex-wrap items-center gap-2">
          <StatusBadge tone="neutral">{entries.length} total</StatusBadge>
          <StatusBadge tone="emerald" dot>
            {verifiedCount} verified
          </StatusBadge>
          <StatusBadge tone="amber" dot>
            {pendingCount} pending
          </StatusBadge>
        </View>

        <View className="mb-3 flex-row items-center gap-2 rounded-md border border-border bg-card px-3">
          <Search size={14} color="#9FBDBD" />
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search email or username"
            autoCapitalize="none"
            className="h-9 flex-1 border-0 bg-transparent px-0"
          />
        </View>

        {waitlistQ.isLoading ? (
          <View className="items-center py-8">
            <Spinner size="large" />
          </View>
        ) : waitlistQ.isError ? (
          <Text className="py-6 text-center text-sm text-red-400">
            Failed to load waitlist.{" "}
            {waitlistQ.error instanceof Error ? waitlistQ.error.message : ""}
          </Text>
        ) : filtered.length === 0 ? (
          <View className="items-center rounded-xl bg-card/50 p-8">
            <Text className="text-sm text-muted-foreground">
              {entries.length === 0
                ? "No signups yet."
                : "No entries match this search."}
            </Text>
          </View>
        ) : (
          filtered.map((entry) => (
            <View
              key={entry.id}
              className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
            >
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-medium text-foreground"
                >
                  @{entry.username}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-xs text-muted-foreground"
                >
                  {entry.email}
                </Text>
                <View className="mt-1 flex-row items-center gap-1.5">
                  {entry.verified ? (
                    <StatusBadge tone="emerald" dot>
                      Verified
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="amber" dot>
                      Pending
                    </StatusBadge>
                  )}
                  <Text className="text-[10px] text-muted-foreground">
                    {entry.source}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-[10px] text-muted-foreground">Joined</Text>
                <Text className="text-xs text-foreground">
                  {timeAgo(entry.createdAt)}
                </Text>
                <Text className="text-[10px] text-muted-foreground">
                  {formatDate(entry.createdAt)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
