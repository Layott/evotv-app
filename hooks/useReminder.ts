import * as React from "react";
import { Platform } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createReminder,
  deleteReminder,
  listReminders,
} from "@/lib/api/reminders";

const LOCAL_LEAD_MIN = 15;
const SERVER_LEAD_MIN = 60;

/**
 * Toggle + persist an EPG reminder for the current user.
 *
 * Two layers:
 *   1. Server reminder via `/api/reminders` (hourly cron fans out Expo Push
 *      at airsAt - SERVER_LEAD_MIN). Required for web users + cross-device.
 *   2. Local Expo notification scheduled on device (fires at airsAt - LOCAL_LEAD_MIN).
 *      Works offline, fine-grained timing. Native only — silently no-ops on web.
 *
 * The local notification ID format: `epg:${targetId}` so toggle off can cancel it.
 */
export function useReminder(
  targetId: string,
  airsAt: string,
  enabled: boolean,
): {
  active: boolean;
  toggle: () => void;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const remindersQ = useQuery({
    queryKey: ["reminders"],
    queryFn: listReminders,
    enabled,
    staleTime: 60_000,
  });

  const active = React.useMemo(() => {
    if (!remindersQ.data) return false;
    return remindersQ.data.some((r) => r.targetId === targetId);
  }, [remindersQ.data, targetId]);

  const createMut = useMutation({
    mutationFn: () =>
      createReminder({ targetId, airsAt, leadMin: SERVER_LEAD_MIN }),
    onSuccess: async () => {
      await scheduleLocalNotification(targetId, airsAt);
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteReminder(targetId),
    onSuccess: async () => {
      await cancelLocalNotification(targetId);
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  const toggle = React.useCallback(() => {
    if (createMut.isPending || deleteMut.isPending) return;
    if (active) deleteMut.mutate();
    else createMut.mutate();
  }, [active, createMut, deleteMut]);

  return {
    active,
    toggle,
    isPending: createMut.isPending || deleteMut.isPending,
  };
}

async function scheduleLocalNotification(
  targetId: string,
  airsAt: string,
): Promise<void> {
  if (Platform.OS === "web") return;
  const fireAtMs = new Date(airsAt).getTime() - LOCAL_LEAD_MIN * 60_000;
  if (Number.isNaN(fireAtMs) || fireAtMs <= Date.now()) return;
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const Notifications = require(
      "expo-notifications",
    ) as typeof import("expo-notifications");
    /* eslint-enable @typescript-eslint/no-require-imports */
    await Notifications.scheduleNotificationAsync({
      identifier: `epg:${targetId}`,
      content: {
        title: "Coming up on EVO TV",
        body: `Starting in ${LOCAL_LEAD_MIN} min — tap to open the schedule.`,
        data: { kind: "epg_reminder", targetId, airsAt },
        sound: "default",
      },
      trigger: { date: new Date(fireAtMs) } as unknown as Parameters<
        typeof Notifications.scheduleNotificationAsync
      >[0]["trigger"],
    });
  } catch {
    /* native module unavailable — fall back to server cron */
  }
}

async function cancelLocalNotification(targetId: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const Notifications = require(
      "expo-notifications",
    ) as typeof import("expo-notifications");
    /* eslint-enable @typescript-eslint/no-require-imports */
    await Notifications.cancelScheduledNotificationAsync(`epg:${targetId}`);
  } catch {
    /* noop */
  }
}
