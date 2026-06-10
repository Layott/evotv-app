import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { ShieldAlert, Tags, X } from "lucide-react-native";

import type { MaturityRating } from "@/lib/types";
import { MATURITY_LABELS } from "@/lib/types";
import { Input } from "@/components/ui/input";

const RATINGS: MaturityRating[] = ["kids", "pg", "teen", "mature"];

/**
 * Four-button maturity picker, modeled on the stream HlsUrlEditor card. Saves
 * immediately on pick (one tap == one PATCH). "Clear" reverts the row to
 * unrated. `current` is the row's stored rating, undefined when unrated.
 */
export function MaturityEditor({
  current,
  isPending,
  onPick,
  onClear,
}: {
  current?: MaturityRating;
  isPending: boolean;
  onPick: (rating: MaturityRating) => void;
  onClear: () => void;
}) {
  return (
    <View className="mt-4 rounded-lg border border-border bg-card/40 p-3">
      <View className="mb-3 flex-row items-center gap-2">
        <ShieldAlert size={14} color="#67e8f9" />
        <Text className="text-sm font-semibold text-foreground">
          Maturity rating
        </Text>
        {current ? (
          <Text className="ml-auto text-[10px] uppercase tracking-wider text-cyan-400">
            {MATURITY_LABELS[current]}
          </Text>
        ) : (
          <Text className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
            Unrated
          </Text>
        )}
      </View>

      <View className="flex-row gap-2">
        {RATINGS.map((r) => {
          const active = current === r;
          return (
            <Pressable
              key={r}
              onPress={() => onPick(r)}
              disabled={isPending || active}
              className={`flex-1 items-center rounded-lg border px-2 py-2 ${
                active
                  ? "border-cyan-500 bg-cyan-500/15"
                  : "border-border bg-card"
              }`}
              style={{ opacity: isPending ? 0.6 : 1 }}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? "text-cyan-300" : "text-muted-foreground"
                }`}
              >
                {MATURITY_LABELS[r]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {current ? (
        <Pressable
          onPress={onClear}
          disabled={isPending}
          className="mt-2 items-center rounded-lg border border-border bg-card px-3 py-2"
        >
          <Text className="text-xs font-medium text-muted-foreground">
            Clear rating
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Chip add/remove editor for free-form content descriptors. Local edits are
 * committed via onSave; the parent PATCHes the full array.
 */
export function ContentTagsEditor({
  current,
  isPending,
  onSave,
}: {
  current?: string[];
  isPending: boolean;
  onSave: (tags: string[]) => void;
}) {
  const initial = React.useMemo(() => current ?? [], [current]);
  const [tags, setTags] = React.useState<string[]>(initial);
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    setTags(current ?? []);
  }, [current]);

  const dirty =
    tags.length !== initial.length ||
    tags.some((t, i) => t !== initial[i]);

  function addTag() {
    const t = draft.trim().toLowerCase();
    if (!t) return;
    if (tags.includes(t)) {
      setDraft("");
      return;
    }
    setTags((prev) => [...prev, t]);
    setDraft("");
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  return (
    <View className="mt-4 rounded-lg border border-border bg-card/40 p-3">
      <View className="mb-3 flex-row items-center gap-2">
        <Tags size={14} color="#67e8f9" />
        <Text className="text-sm font-semibold text-foreground">
          Content tags
        </Text>
        <Text className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
          {tags.length} tag{tags.length === 1 ? "" : "s"}
        </Text>
      </View>

      {tags.length > 0 ? (
        <View className="mb-3 flex-row flex-wrap gap-1.5">
          {tags.map((t) => (
            <View
              key={t}
              className="flex-row items-center gap-1 rounded-full border border-border bg-card px-2 py-1"
            >
              <Text className="text-[11px] text-foreground">{t}</Text>
              <Pressable onPress={() => removeTag(t)} hitSlop={6} disabled={isPending}>
                <X size={11} color="#A3A3A3" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text className="mb-3 text-[11px] text-muted-foreground">
          No tags yet. Add descriptors like "violence", "language", "horror".
        </Text>
      )}

      <View className="flex-row gap-2">
        <Input
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addTag}
          placeholder="Add a tag"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          className="h-9 flex-1"
        />
        <Pressable
          onPress={addTag}
          disabled={!draft.trim() || isPending}
          className="items-center justify-center rounded-lg border border-border bg-card px-3"
          style={{ opacity: !draft.trim() || isPending ? 0.5 : 1 }}
        >
          <Text className="text-xs font-medium text-foreground">Add</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => onSave(tags)}
        disabled={!dirty || isPending}
        className="mt-2 items-center rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2"
        style={{ opacity: !dirty || isPending ? 0.5 : 1 }}
      >
        <Text className="text-xs font-semibold text-cyan-300">
          {isPending ? "Saving…" : "Save tags"}
        </Text>
      </Pressable>
    </View>
  );
}
