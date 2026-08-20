import * as React from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Plus, X } from "@/components/icons";
import { toast } from "sonner-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listAdminPolls } from "@/lib/api/admin";
import { createPoll, closePollById } from "@/lib/api/polls";
import { listLiveStreams } from "@/lib/api/streams";
import type { Poll, Stream } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { PageHeader } from "./page-header";
import { HowTo } from "./how-to";
import { StatusBadge } from "./status-badge";
import { formatNumber, timeAgo } from "./utils";

export function PollsManagerPage() {
  const queryClient = useQueryClient();
  const [openCreate, setOpenCreate] = React.useState(false);
  const [selected, setSelected] = React.useState<Poll | null>(null);

  const pollsQuery = useQuery({
    queryKey: ["admin-polls"],
    queryFn: () => listAdminPolls({ limit: 200 }),
    staleTime: 30_000,
  });

  const streamsQuery = useQuery({
    queryKey: ["admin-live-streams"],
    queryFn: () => listLiveStreams(),
    staleTime: 60_000,
  });

  const polls = pollsQuery.data?.polls ?? [];
  const streamMap = React.useMemo(() => {
    const map = new Map<string, Stream>();
    for (const s of streamsQuery.data ?? []) map.set(s.id, s);
    return map;
  }, [streamsQuery.data]);

  function streamTitle(id: string) {
    return streamMap.get(id)?.title ?? id;
  }

  const createMutation = useMutation({
    mutationFn: (payload: {
      streamId: string;
      question: string;
      options: string[];
      durationMinutes: number;
      whoCanVote: "signed_in" | "subscribers";
      showResultsLive: boolean;
      showWinnerOnStream: boolean;
      allowVoteChange: boolean;
    }) =>
      createPoll({
        streamId: payload.streamId,
        question: payload.question,
        options: payload.options.map((label, i) => ({
          id: `opt_${i}`,
          label,
        })),
        closesAt: new Date(
          Date.now() + payload.durationMinutes * 60_000,
        ).toISOString(),
        whoCanVote: payload.whoCanVote,
        showResultsLive: payload.showResultsLive,
        showWinnerOnStream: payload.showWinnerOnStream,
        allowVoteChange: payload.allowVoteChange,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
      toast.success("Poll created");
      setOpenCreate(false);
    },
    onError: (err) => {
      toast.error("Failed to create poll", {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (pollId: string) => closePollById(pollId),
    onSuccess: (poll) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
      setSelected((prev) => (prev && prev.id === poll.id ? poll : prev));
      toast.success("Poll closed");
    },
    onError: (err) => {
      toast.error("Failed to close poll", {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Polls"
          description="Create live polls, track engagement, close when finished."
          actions={
            <Button
              className="bg-cyan-500"
              onPress={() => setOpenCreate(true)}
              disabled={streamsQuery.data?.length === 0}
            >
              <Plus size={14} color="#000" />
              <Text className="text-sm font-medium text-black">New</Text>
            </Button>
          }
        />
        <HowTo page="polls" />

        {pollsQuery.isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#46E3CE" />
          </View>
        ) : pollsQuery.isError ? (
          <Text className="py-6 text-center text-sm text-red-400">
            Failed to load polls.{" "}
            {pollsQuery.error instanceof Error ? pollsQuery.error.message : ""}
          </Text>
        ) : polls.length === 0 ? (
          <View className="rounded-xl bg-card/50 p-6">
            <Text className="text-center text-sm text-muted-foreground">
              No polls yet. Tap "New" to create one.
            </Text>
          </View>
        ) : (
          polls.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setSelected(p)}
              className="mb-2 rounded-xl border border-border bg-card/40 p-3"
            >
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">
                    {p.question}
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted-foreground">
                    {p.options.length} options · {streamTitle(p.streamId)}
                  </Text>
                </View>
                {p.isClosed ? (
                  <StatusBadge tone="neutral">Closed</StatusBadge>
                ) : (
                  <StatusBadge tone="emerald" dot>
                    Active
                  </StatusBadge>
                )}
              </View>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">
                  {formatNumber(p.totalVotes)} votes
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Closes {timeAgo(p.closesAt)}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
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
                      {selected.question}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">
                      {streamTitle(selected.streamId)} ·{" "}
                      {formatNumber(selected.totalVotes)} votes
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                    <X size={20} color="#9FBDBD" />
                  </Pressable>
                </View>

                <View className="space-y-2">
                  {selected.options.map((o) => {
                    const pct =
                      selected.totalVotes > 0
                        ? Math.round((o.votes / selected.totalVotes) * 100)
                        : 0;
                    return (
                      <View
                        key={o.id}
                        className="mb-2 rounded-md border border-border bg-card/40 p-3"
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm text-foreground">
                            {o.label}
                          </Text>
                          <Text className="text-xs text-muted-foreground">
                            {formatNumber(o.votes)} · {pct}%
                          </Text>
                        </View>
                        <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                          <View
                            className="h-full rounded-full bg-cyan-500"
                            style={{ width: `${pct}%` }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View className="mt-3">
                  {selected.isClosed ? (
                    <Button disabled className="bg-muted">
                      <Text className="text-sm text-muted-foreground">
                        Poll closed
                      </Text>
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      disabled={closeMutation.isPending}
                      onPress={() => closeMutation.mutate(selected.id)}
                    >
                      <Text className="text-sm text-white">
                        {closeMutation.isPending ? "Closing…" : "Close poll"}
                      </Text>
                    </Button>
                  )}
                </View>
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <CreatePollDrawer
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        liveStreams={streamsQuery.data ?? []}
        loading={streamsQuery.isLoading}
        submitting={createMutation.isPending}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </View>
  );
}

function CreatePollDrawer({
  open,
  onClose,
  liveStreams,
  loading,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  liveStreams: Stream[];
  loading: boolean;
  submitting: boolean;
  onSubmit: (payload: {
    streamId: string;
    question: string;
    options: string[];
    durationMinutes: number;
    whoCanVote: "signed_in" | "subscribers";
    showResultsLive: boolean;
    showWinnerOnStream: boolean;
    allowVoteChange: boolean;
  }) => void;
}) {
  const [streamId, setStreamId] = React.useState(liveStreams[0]?.id ?? "");
  const [question, setQuestion] = React.useState("");
  const [options, setOptions] = React.useState<string[]>(["", ""]);
  const [duration, setDuration] = React.useState(5);
  /*
   * The same four decisions the website offers.
   *
   * Without them a poll started from a phone quietly reverted to "anyone with
   * an account, totals visible, no winner card", which is not what somebody who
   * had used the other screen would expect.
   */
  const [whoCanVote, setWhoCanVote] = React.useState<"signed_in" | "subscribers">("signed_in");
  const [showResultsLive, setShowResultsLive] = React.useState(true);
  const [showWinnerOnStream, setShowWinnerOnStream] = React.useState(false);
  const [allowVoteChange, setAllowVoteChange] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setStreamId(liveStreams[0]?.id ?? "");
      setQuestion("");
      setOptions(["", ""]);
      setDuration(5);
      setWhoCanVote("signed_in");
      setShowResultsLive(true);
      setShowWinnerOnStream(false);
      setAllowVoteChange(false);
    }
  }, [open, liveStreams]);

  const validOptions = options.map((o) => o.trim()).filter(Boolean);
  const disabled =
    submitting || !streamId || !question.trim() || validOptions.length < 2;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/50">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[92%] rounded-t-2xl border border-border bg-background"
        >
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View className="mb-4 flex-row items-start justify-between">
              <Text className="text-lg font-semibold text-foreground">
                New poll
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={20} color="#9FBDBD" />
              </Pressable>
            </View>

            <Text className="mb-1.5 text-xs text-muted-foreground">Stream</Text>
            {loading ? (
              <ActivityIndicator color="#46E3CE" />
            ) : liveStreams.length === 0 ? (
              <Text className="mb-3 text-xs text-amber-400">
                No live streams. Start a stream before creating a poll.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="mb-3 flex-row gap-2">
                  {liveStreams.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => setStreamId(s.id)}
                      className={`rounded-full border px-3 py-1.5 ${
                        streamId === s.id
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <Text
                        numberOfLines={1}
                        className={`text-xs ${
                          streamId === s.id
                            ? "text-cyan-300"
                            : "text-muted-foreground"
                        }`}
                      >
                        {s.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}

            <Text className="mb-1.5 text-xs text-muted-foreground">
              Question
            </Text>
            <Input
              value={question}
              onChangeText={setQuestion}
              placeholder="Who takes Map 4?"
              className="mb-3 bg-card"
            />

            <Text className="mb-1.5 text-xs text-muted-foreground">Options</Text>
            {options.map((opt, i) => (
              <View key={i} className="mb-2 flex-row gap-2">
                <Input
                  value={opt}
                  onChangeText={(v) => {
                    const next = [...options];
                    next[i] = v;
                    setOptions(next);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 bg-card"
                />
                {options.length > 2 ? (
                  <Pressable
                    onPress={() =>
                      setOptions((p) => p.filter((_, idx) => idx !== i))
                    }
                    className="h-9 w-9 items-center justify-center rounded-md border border-border bg-card"
                  >
                    <X size={14} color="#9FBDBD" />
                  </Pressable>
                ) : null}
              </View>
            ))}

            {options.length < 6 ? (
              <Button
                variant="outline"
                className="self-start"
                onPress={() => setOptions((p) => [...p, ""])}
              >
                <Plus size={12} color="#EAF6F5" />
                <Text className="text-xs text-foreground">Add option</Text>
              </Button>
            ) : null}

            <Text className="mb-1.5 mt-3 text-xs text-muted-foreground">
              Duration
            </Text>
            <View className="flex-row gap-1.5">
              {[5, 10, 15, 30].map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDuration(d)}
                  className={`rounded-md border px-3 py-1.5 ${
                    duration === d
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-border bg-card"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      duration === d ? "text-cyan-300" : "text-muted-foreground"
                    }`}
                  >
                    {d}m
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mb-1.5 mt-4 text-xs text-muted-foreground">
              Who can vote
            </Text>
            <View className="flex-row gap-1.5">
              {(
                [
                  ["signed_in", "Anyone with an account"],
                  ["subscribers", "Subscribers only"],
                ] as const
              ).map(([value, label]) => (
                <Pressable
                  key={value}
                  onPress={() => setWhoCanVote(value)}
                  className={`flex-1 rounded-md px-3 py-2 ${
                    whoCanVote === value ? "bg-cyan-500/20" : "bg-card"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      whoCanVote === value ? "text-cyan-300" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {(
              [
                ["Show the totals while it runs", showResultsLive, setShowResultsLive],
                ["Put the winner on screen", showWinnerOnStream, setShowWinnerOnStream],
                ["Let people change their mind", allowVoteChange, setAllowVoteChange],
              ] as const
            ).map(([label, value, setter]) => (
              <Pressable
                key={label}
                onPress={() => setter(!value)}
                className="mt-2 flex-row items-center justify-between rounded-md bg-card px-3 py-2.5"
              >
                <Text className="flex-1 pr-3 text-xs text-foreground">{label}</Text>
                <View
                  className={`h-6 w-10 justify-center rounded-full px-0.5 ${
                    value ? "bg-cyan-500" : "bg-muted"
                  }`}
                >
                  <View
                    className={`h-5 w-5 rounded-full bg-white ${value ? "self-end" : "self-start"}`}
                  />
                </View>
              </Pressable>
            ))}

            <View className="mt-5 flex-row gap-2">
              <Button variant="outline" className="flex-1" onPress={onClose}>
                <Text className="text-sm text-foreground">Cancel</Text>
              </Button>
              <Button
                disabled={disabled}
                className="flex-1 bg-cyan-500"
                onPress={() =>
                  onSubmit({
                    streamId,
                    question: question.trim(),
                    options: validOptions,
                    durationMinutes: duration,
                    whoCanVote,
                    showResultsLive,
                    showWinnerOnStream,
                    allowVoteChange,
                  })
                }
              >
                <Text className="text-sm font-medium text-black">
                  {submitting ? "Launching…" : "Launch poll"}
                </Text>
              </Button>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
