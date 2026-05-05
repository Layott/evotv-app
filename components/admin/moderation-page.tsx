import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import {
  AlertTriangle,
  Check,
  MessageSquare,
  ShieldBan,
  Undo2,
} from "lucide-react-native";
import { toast } from "sonner-native";

import { seedMessages } from "@/lib/mock/chat";
import { profiles } from "@/lib/mock/users";
import type { ChatMessage, Profile } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatDate, seededRandom, timeAgo } from "./utils";

interface Report {
  id: string;
  message: ChatMessage;
  reason: "spam" | "harassment" | "off-topic";
  reportedBy: string;
  reportedAt: string;
  state: "open" | "approved" | "removed" | "escalated";
}

interface BannedUser {
  id: string;
  profile: Profile;
  reason: string;
  durationDays: number;
  bannedAt: string;
}

interface Appeal {
  id: string;
  profile: Profile;
  banReason: string;
  message: string;
  submittedAt: string;
}

function buildReports(): Report[] {
  const rng = seededRandom(301);
  const seed = seedMessages("stream_lagos_final", 12);
  const reasons: Report["reason"][] = ["spam", "harassment", "off-topic"];
  return seed.map((m, i) => ({
    id: `report_${i + 1}`,
    message: m,
    reason: reasons[i % reasons.length]!,
    reportedBy: profiles[(i + 3) % profiles.length]?.handle ?? "viewer",
    reportedAt: new Date(
      Date.now() - Math.floor(rng() * 6) * 3_600_000,
    ).toISOString(),
    state: "open",
  }));
}

function buildBanned(): BannedUser[] {
  return profiles.slice(12, 17).map((p, i) => ({
    id: `ban_${i + 1}`,
    profile: p,
    reason: [
      "Repeated spam",
      "Hate speech",
      "Evasion",
      "Harassment",
      "Self-harm content",
    ][i]!,
    durationDays: [7, 30, 14, 3, 90][i] ?? 7,
    bannedAt: new Date(Date.now() - (i + 1) * 86_400_000).toISOString(),
  }));
}

function buildAppeals(): Appeal[] {
  return profiles.slice(13, 15).map((p, i) => ({
    id: `appeal_${i + 1}`,
    profile: p,
    banReason: ["Repeated spam", "Harassment"][i]!,
    message: [
      "I was banned by mistake — the link I shared was from an official partner.",
      "Misunderstanding during stream — I apologized in chat afterwards.",
    ][i]!,
    submittedAt: new Date(
      Date.now() - (i + 1) * 3_600_000 * 18,
    ).toISOString(),
  }));
}

export function ModerationPage() {
  const [reports, setReports] = React.useState<Report[]>(() => buildReports());
  const [banned, setBanned] = React.useState<BannedUser[]>(() => buildBanned());
  const [appeals, setAppeals] = React.useState<Appeal[]>(() => buildAppeals());

  function reportAction(
    id: string,
    action: "approve" | "remove" | "ban" | "escalate",
  ) {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              state:
                action === "approve"
                  ? "approved"
                  : action === "remove"
                    ? "removed"
                    : action === "escalate"
                      ? "escalated"
                      : "removed",
            }
          : r,
      ),
    );
    if (action === "approve") toast.success("Message approved");
    if (action === "remove") toast.success("Message removed");
    if (action === "ban") toast.success("User banned");
    if (action === "escalate") toast.success("Escalated to team lead");
  }

  function unban(id: string) {
    const b = banned.find((x) => x.id === id);
    setBanned((prev) => prev.filter((x) => x.id !== id));
    toast.success(b ? `Unbanned @${b.profile.handle}` : "Unbanned");
  }

  function resolveAppeal(id: string, outcome: "accept" | "reject") {
    setAppeals((prev) => prev.filter((a) => a.id !== id));
    toast.success(
      outcome === "accept"
        ? "Appeal accepted — ban lifted"
        : "Appeal rejected",
    );
  }

  const openReports = reports.filter((r) => r.state === "open");

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Moderation"
          description="Review reported messages, bans and appeals."
        />

        <Tabs defaultValue="reports">
          <TabsList className="mb-4">
            <TabsTrigger value="reports">
              {`Reports (${openReports.length})`}
            </TabsTrigger>
            <TabsTrigger value="banned">Banned</TabsTrigger>
            <TabsTrigger value="appeals">{`Appeals (${appeals.length})`}</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            {reports.map((r) => {
              const reasonTone: "red" | "amber" | "blue" =
                r.reason === "harassment"
                  ? "red"
                  : r.reason === "spam"
                    ? "amber"
                    : "blue";
              return (
                <View
                  key={r.id}
                  className="mb-3 rounded-xl border border-border bg-card/40 p-3"
                >
                  <View className="flex-row flex-wrap items-center gap-2">
                    <StatusBadge tone={reasonTone}>{r.reason}</StatusBadge>
                    <Text className="text-xs text-muted-foreground">
                      @{r.reportedBy} · {timeAgo(r.reportedAt)}
                    </Text>
                    {r.state !== "open" ? (
                      <StatusBadge tone="neutral">{r.state}</StatusBadge>
                    ) : null}
                  </View>
                  <View className="mt-3 flex-row items-start gap-3">
                    <View className="h-9 w-9 overflow-hidden rounded-full bg-muted">
                      <Image
                        source={r.message.userAvatarUrl}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground">
                        @{r.message.userHandle} · {timeAgo(r.message.createdAt)}
                      </Text>
                      <View className="mt-1 flex-row items-center gap-1.5 rounded-md border border-border bg-background p-2">
                        <MessageSquare size={12} color="#A3A3A3" />
                        <Text className="flex-1 text-sm text-foreground">
                          {r.message.body}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {r.state === "open" ? (
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-cyan-500/40 bg-cyan-500/10"
                        onPress={() => reportAction(r.id, "approve")}
                      >
                        <Check size={12} color="#67E8F0" />
                        <Text className="text-xs text-cyan-200">Approve</Text>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/40 bg-red-500/10"
                        onPress={() => reportAction(r.id, "remove")}
                      >
                        <Text className="text-xs text-red-200">Delete</Text>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/40 bg-red-500/10"
                        onPress={() => reportAction(r.id, "ban")}
                      >
                        <ShieldBan size={12} color="#FCA5A5" />
                        <Text className="text-xs text-red-200">Ban</Text>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10"
                        onPress={() => reportAction(r.id, "escalate")}
                      >
                        <AlertTriangle size={12} color="#FCD34D" />
                        <Text className="text-xs text-amber-200">
                          Escalate
                        </Text>
                      </Button>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </TabsContent>

          <TabsContent value="banned">
            {banned.map((b) => (
              <View
                key={b.id}
                className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
              >
                <View className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                  <Image
                    source={b.profile.avatarUrl}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">
                    {b.profile.displayName}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    @{b.profile.handle}
                  </Text>
                  <Text className="mt-1 text-xs text-muted-foreground">
                    {b.reason} · {b.durationDays}d · {formatDate(b.bannedAt)}
                  </Text>
                </View>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cyan-500/40 bg-cyan-500/10"
                  onPress={() => unban(b.id)}
                >
                  <Undo2 size={12} color="#67E8F0" />
                  <Text className="text-xs text-cyan-200">Unban</Text>
                </Button>
              </View>
            ))}
            {banned.length === 0 ? (
              <View className="rounded-xl border border-dashed border-border p-6">
                <Text className="text-center text-sm text-muted-foreground">
                  No active bans.
                </Text>
              </View>
            ) : null}
          </TabsContent>

          <TabsContent value="appeals">
            {appeals.map((a) => (
              <View
                key={a.id}
                className="mb-2 rounded-xl border border-border bg-card/40 p-3"
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                    <Image
                      source={a.profile.avatarUrl}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      {a.profile.displayName}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      @{a.profile.handle}
                    </Text>
                    <Text className="mt-1 text-xs text-muted-foreground">
                      Reason: {a.banReason} · {timeAgo(a.submittedAt)}
                    </Text>
                  </View>
                </View>
                <View className="mt-3 rounded-md border border-border bg-background p-3">
                  <Text className="text-sm italic text-foreground">
                    "{a.message}"
                  </Text>
                </View>
                <View className="mt-3 flex-row gap-2">
                  <Button
                    size="sm"
                    className="bg-cyan-500"
                    onPress={() => resolveAppeal(a.id, "accept")}
                  >
                    <Text className="text-xs font-medium text-black">
                      Accept
                    </Text>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/40 bg-red-500/10"
                    onPress={() => resolveAppeal(a.id, "reject")}
                  >
                    <Text className="text-xs text-red-200">Reject</Text>
                  </Button>
                </View>
              </View>
            ))}
            {appeals.length === 0 ? (
              <View className="rounded-xl border border-dashed border-border p-6">
                <Text className="text-center text-sm text-muted-foreground">
                  No outstanding appeals.
                </Text>
              </View>
            ) : null}
          </TabsContent>
        </Tabs>
      </ScrollView>
    </View>
  );
}
