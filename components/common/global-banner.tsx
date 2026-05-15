import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Wrench, X } from "lucide-react-native";

import { getPublicFlags } from "@/lib/api/feature-flags";

/**
 * Renders at the top of the app shell. Shows:
 *   - red takedown banner if `takedown.enabled` flag is on
 *   - amber maintenance banner if `maintenance.enabled` is on
 *   - nothing otherwise
 *
 * Takedown overrides maintenance when both are on. Dismissable per session
 * via local state (re-shows on app cold start).
 */
export function GlobalBanner() {
  const [dismissed, setDismissed] = React.useState<"takedown" | "maintenance" | null>(
    null,
  );

  const { data } = useQuery({
    queryKey: ["public-flags"],
    queryFn: getPublicFlags,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const takedown = data?.["takedown.enabled"];
  const maintenance = data?.["maintenance.enabled"];

  if (takedown?.enabled && dismissed !== "takedown") {
    return (
      <View
        className="flex-row items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: "rgba(239,68,68,0.92)" }}
      >
        <AlertTriangle size={14} color="#000" />
        <Text className="flex-1 text-xs font-semibold text-black" numberOfLines={2}>
          {takedown.message || "Service temporarily disabled by EVO TV."}
        </Text>
        <Pressable onPress={() => setDismissed("takedown")} hitSlop={6}>
          <X size={14} color="#000" />
        </Pressable>
      </View>
    );
  }

  if (maintenance?.enabled && dismissed !== "maintenance") {
    return (
      <View
        className="flex-row items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: "rgba(245,158,11,0.92)" }}
      >
        <Wrench size={14} color="#000" />
        <Text className="flex-1 text-xs font-semibold text-black" numberOfLines={2}>
          {maintenance.message || "Scheduled maintenance in progress."}
        </Text>
        <Pressable onPress={() => setDismissed("maintenance")} hitSlop={6}>
          <X size={14} color="#000" />
        </Pressable>
      </View>
    );
  }

  return null;
}
