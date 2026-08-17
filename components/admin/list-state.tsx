import * as React from "react";
import { Pressable, Text, View } from "react-native";

import { Spinner } from "@/components/ui/spinner";

/**
 * The three things a list can be doing other than showing rows.
 *
 * Written once because the naive version of this is a bug. With TanStack Query
 * v5 `isLoading` is `isPending && isFetching`, so while a failing request is
 * between retries `isLoading`, `isError` and `data` are all falsy at the same
 * moment, and a screen that branches on those three in that order renders
 * nothing at all. Branching on `isPending` first closes that window, and an
 * empty result gets its own branch rather than being mistaken for a load.
 *
 * Returns null when there is nothing to say, so a caller can render this above
 * its rows and let it decide whether it has anything to add.
 */
export function ListState({
  isPending,
  isError,
  error,
  isEmpty,
  emptyMessage,
  onRetry,
}: {
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty: boolean;
  emptyMessage: string;
  onRetry?: () => void;
}) {
  if (isPending) {
    return (
      <View className="items-center rounded-2xl bg-card px-6 py-10">
        <Spinner size="large" />
        <Text className="mt-3 text-xs text-muted-foreground">Loading…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center rounded-2xl bg-card px-6 py-10">
        <Text className="text-sm font-semibold text-foreground">
          That did not load
        </Text>
        <Text className="mt-1 text-center text-xs leading-5 text-muted-foreground">
          {error instanceof Error ? error.message : "Something went wrong."}
        </Text>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            className="mt-4 rounded-lg bg-brand px-4 py-2 active:opacity-70"
          >
            <Text className="text-xs font-semibold text-background">
              Try again
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View className="items-center rounded-2xl bg-card px-6 py-10">
        <Text className="text-center text-sm leading-5 text-muted-foreground">
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return null;
}
