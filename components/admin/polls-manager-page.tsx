import * as React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Plus, X } from "lucide-react-native";
import { toast } from "sonner-native";

import { polls as pollsSource } from "@/lib/mock/polls";
import { streams as streamsSource } from "@/lib/mock/streams";
import type { Poll } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { formatNumber, timeAgo } from "./utils";

function streamTitle(id: string) {
  return streamsSource.find((s) => s.id === id)?.title ?? id;
}

export function PollsManagerPage() {
  const [all, setAll] = React.useState<Poll[]>(() => [...pollsSource]);
  const [openCreate, setOpenCreate] = React.useState(false);
  const [selected, setSelected] = React.useState<Poll | null>(null);

  function handleCreate(payload: {
    streamId: string;
    question: string;
    options: string[];
    durationMinutes: number;
  }) {
    const poll: Poll = {
      id: `poll_new_${Date.now()}`,
      streamId: payload.streamId,
      question: payload.question,
      options: payload.options.map((label, i) => ({
        id: `opt_${i}`,
        label,
        votes: 0,
      })),
      createdAt: new Date().toISOString(),
      closesAt: new Date(
        Date.now() + payload.durationMinutes * 60_000,
      ).toISOString(),
      isClosed: false,
      totalVotes: 0,
    };
    setAll((prev) => [poll, ...prev]);
    toast.success("Poll created");
    setOpenCreate(false);
  }

  function handleClose(id: string) {
    setAll((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isClosed: true } : p)),
    );
    setSelected((prev) =>
      prev && prev.id === id ? { ...prev, isClosed: true } : prev,
    );
    toast.success("Poll closed");
  }

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
            >
              <Plus size={14} color="#000" />
              <Text className="text-sm font-medium text-black">New</Text>
            </Button>
          }
        />

        {all.map((p) => (
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
        ))}

        {all.length === 0 ? (
          <View className="rounded-xl border border-dashed border-border p-6">
            <Text className="text-center text-sm text-muted-foreground">
              No polls yet. Tap "New" to create one.
            </Text>
          </View>
        ) : null}
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
                    <X size={20} color="#A3A3A3" />
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
                      onPress={() => handleClose(selected.id)}
                    >
                      <Text className="text-sm text-white">Close poll</Text>
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
        onSubmit={handleCreate}
      />
    </View>
  );
}

function CreatePollDrawer({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    streamId: string;
    question: string;
    options: string[];
    durationMinutes: number;
  }) => void;
}) {
  const [streamId, setStreamId] = React.useState(streamsSource[0]?.id ?? "");
  const [question, setQuestion] = React.useState("");
  const [options, setOptions] = React.useState<string[]>(["", ""]);
  const [duration, setDuration] = React.useState(5);

  React.useEffect(() => {
    if (open) {
      setStreamId(streamsSource[0]?.id ?? "");
      setQuestion("");
      setOptions(["", ""]);
      setDuration(5);
    }
  }, [open]);

  const validOptions = options.map((o) => o.trim()).filter(Boolean);
  const disabled =
    !streamId || !question.trim() || validOptions.length < 2;

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
                <X size={20} color="#A3A3A3" />
              </Pressable>
            </View>

            <Text className="mb-1.5 text-xs text-muted-foreground">Stream</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="mb-3 flex-row gap-2">
                {streamsSource.map((s) => (
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
                    <X size={14} color="#A3A3A3" />
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
                <Plus size={12} color="#FAFAFA" />
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
                  })
                }
              >
                <Text className="text-sm font-medium text-black">
                  Launch poll
                </Text>
              </Button>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
