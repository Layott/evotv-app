import * as React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/_client";
import { listAdminStreams } from "@/lib/api/streams";

/**
 * The chat rules, on a phone.
 *
 * The rules are enforced by the server for every message on both platforms, so
 * the half that was missing here was the ability to change them. The person who
 * needs to stop a scam link at nine in the evening is usually holding a phone,
 * not sitting at the dashboard.
 *
 * Same model as the website: the house rules apply everywhere, and a broadcast
 * can carry its own set which **replaces** them rather than adding to them.
 */

interface Rules {
  blockLinks: boolean;
  allowedDomains: string[];
  bannedWords: string[];
  strikesBeforeBan: number;
  banMinutes: number;
}

const HOUSE = "__house__";

export function ChatRulesPanel() {
  const queryClient = useQueryClient();
  const [scope, setScope] = React.useState<string>(HOUSE);
  const streamId = scope === HOUSE ? null : scope;
  const path = streamId
    ? `/api/admin/chat-rules?streamId=${encodeURIComponent(streamId)}`
    : "/api/admin/chat-rules";

  const streamsQ = useQuery({
    queryKey: ["admin-streams"],
    queryFn: () => listAdminStreams(),
  });

  const rulesQ = useQuery({
    queryKey: ["admin-chat-rules", scope],
    queryFn: () => api<Rules>(path),
  });

  const [draft, setDraft] = React.useState<Rules | null>(null);
  React.useEffect(() => {
    if (rulesQ.data) setDraft(rulesQ.data);
  }, [rulesQ.data]);

  const save = useMutation({
    mutationFn: (next: Rules) => api<Rules>(path, { method: "PUT", body: next }),
    onSuccess: () => {
      toast.success(streamId ? "Rules saved for this broadcast" : "House rules saved");
      void queryClient.invalidateQueries({ queryKey: ["admin-chat-rules"] });
    },
    onError: (err) =>
      toast.error("Could not save the chat rules", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  if (rulesQ.isLoading || !draft) {
    return (
      <View className="py-8">
        <Spinner />
      </View>
    );
  }

  const set = <K extends keyof Rules>(key: K, value: Rules[K]) =>
    setDraft({ ...draft, [key]: value });

  const streams = streamsQ.data?.streams ?? [];

  return (
    <View className="gap-4">
      <View>
        <Text className="mb-1.5 text-xs text-muted-foreground">These rules apply to</Text>
        <View className="flex-row flex-wrap gap-1.5">
          <Pressable
            onPress={() => setScope(HOUSE)}
            className={`rounded-full px-3 py-1.5 ${scope === HOUSE ? "bg-cyan-500/20" : "bg-card"}`}
          >
            <Text
              className={`text-xs ${scope === HOUSE ? "text-cyan-300" : "text-muted-foreground"}`}
            >
              Every chat
            </Text>
          </Pressable>
          {streams.slice(0, 8).map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setScope(s.id)}
              className={`rounded-full px-3 py-1.5 ${scope === s.id ? "bg-cyan-500/20" : "bg-card"}`}
            >
              <Text
                className={`text-xs ${scope === s.id ? "text-cyan-300" : "text-muted-foreground"}`}
                numberOfLines={1}
              >
                {s.title}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text className="mt-1.5 text-[11px] text-muted-foreground">
          A broadcast&apos;s own rules replace the house rules rather than adding
          to them, so what is on screen is the whole answer.
        </Text>
      </View>

      <Pressable
        onPress={() => set("blockLinks", !draft.blockLinks)}
        className="flex-row items-center justify-between rounded-lg bg-card p-3"
      >
        <View className="flex-1 pr-3">
          <Text className="text-sm text-foreground">Block links</Text>
          <Text className="text-[11px] text-muted-foreground">
            Catches bare hosts as well as full addresses, and sees through a
            hidden character or a spelled-out dot.
          </Text>
        </View>
        <View
          className={`h-6 w-10 justify-center rounded-full px-0.5 ${
            draft.blockLinks ? "bg-cyan-500" : "bg-muted"
          }`}
        >
          <View
            className={`h-5 w-5 rounded-full bg-white ${
              draft.blockLinks ? "self-end" : "self-start"
            }`}
          />
        </View>
      </Pressable>

      <ChipField
        label="Links that are still allowed"
        placeholder="evotv.co"
        values={draft.allowedDomains}
        onChange={(next) => set("allowedDomains", next)}
        hint="Subdomains count; a lookalike domain does not."
      />

      <ChipField
        label="Blocked words"
        placeholder="Add a word"
        values={draft.bannedWords}
        onChange={(next) => set("bannedWords", next)}
        hint="Matched anywhere in a message, ignoring case."
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="mb-1.5 text-xs text-muted-foreground">Warnings before a mute</Text>
          <TextInput
            keyboardType="number-pad"
            value={String(draft.strikesBeforeBan)}
            onChangeText={(t) =>
              set("strikesBeforeBan", Math.max(0, Math.min(20, Number(t) || 0)))
            }
            className="rounded-md bg-card px-3 py-2 text-sm text-foreground"
            placeholderTextColor="#6b7280"
          />
        </View>
        <View className="flex-1">
          <Text className="mb-1.5 text-xs text-muted-foreground">Mute length, minutes</Text>
          <TextInput
            keyboardType="number-pad"
            value={String(draft.banMinutes)}
            onChangeText={(t) => set("banMinutes", Math.max(1, Number(t) || 1))}
            className="rounded-md bg-card px-3 py-2 text-sm text-foreground"
            placeholderTextColor="#6b7280"
          />
        </View>
      </View>

      <Button
        className="bg-cyan-500"
        disabled={save.isPending}
        onPress={() => save.mutate(draft)}
      >
        <Text className="text-sm font-medium text-black">
          {save.isPending ? "Saving…" : "Save rules"}
        </Text>
      </Button>
    </View>
  );
}

/**
 * Short strings, entered one at a time.
 *
 * A comma-separated box is worse on a phone than anywhere else: the keyboard
 * hides half the field and nobody can tell whether a trailing space matters.
 */
function ChipField({
  label,
  placeholder,
  values,
  onChange,
  hint,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
  hint: string;
}) {
  const [text, setText] = React.useState("");

  function add() {
    const value = text.trim().toLowerCase();
    setText("");
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
  }

  return (
    <View>
      <Text className="mb-1.5 text-xs text-muted-foreground">{label}</Text>
      <View className="flex-row gap-2">
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          className="flex-1 rounded-md bg-card px-3 py-2 text-sm text-foreground"
        />
        <Button variant="outline" onPress={add}>
          <Text className="text-sm text-foreground">Add</Text>
        </Button>
      </View>
      {values.length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {values.map((value) => (
            <Pressable
              key={value}
              onPress={() => onChange(values.filter((v) => v !== value))}
              className="flex-row items-center gap-1.5 rounded-full bg-card px-3 py-1.5"
            >
              <Text className="text-xs text-foreground">{value}</Text>
              <X size={11} color="#9fbdbd" />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text className="mt-1.5 text-[11px] text-muted-foreground">Nothing listed.</Text>
      )}
      <Text className="mt-1.5 text-[11px] text-muted-foreground">{hint}</Text>
    </View>
  );
}
