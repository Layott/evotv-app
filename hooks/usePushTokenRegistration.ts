import * as React from "react";
import { Platform } from "react-native";

import {
  registerExpoPushToken,
  unregisterExpoPushToken,
  type ExpoPlatform,
} from "@/lib/api/push";

/**
 * Best-effort native push token registration.
 *
 * On native: request permission (no-op if already granted), fetch the Expo
 * push token, register it against the signed-in user. Unregister on
 * sign-out via the cleanup callback returned alongside.
 *
 * On web (or when the native modules are missing — pre-rebuild dev runs):
 * silently no-ops. Web push is handled separately via the VAPID flow in
 * `subscribePush()`.
 *
 * Failures (permission denied, project-id missing, network) are all
 * swallowed — push is enrichment, not a blocker for sign-in.
 */
export function usePushTokenRegistration(isAuthenticated: boolean): void {
  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (Platform.OS === "web") return;

    let cancelled = false;
    let registeredToken: string | null = null;

    void (async () => {
      try {
        /* eslint-disable @typescript-eslint/no-require-imports */
        const Notifications = require(
          "expo-notifications",
        ) as typeof import("expo-notifications");
        const Device = require("expo-device") as typeof import("expo-device");
        /* eslint-enable @typescript-eslint/no-require-imports */

        // Simulator / emulator can't receive push. Skip the prompt + write.
        if (!Device.isDevice) return;

        const existing = await Notifications.getPermissionsAsync();
        let granted =
          existing.granted ||
          existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

        if (!granted) {
          const req = await Notifications.requestPermissionsAsync();
          granted =
            req.granted ||
            req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
        }
        if (!granted || cancelled) return;

        const result = await Notifications.getExpoPushTokenAsync();
        if (cancelled || !result?.data) return;

        registeredToken = result.data;
        const platform: ExpoPlatform =
          Platform.OS === "ios"
            ? "ios"
            : Platform.OS === "android"
              ? "android"
              : "web";
        await registerExpoPushToken(result.data, platform);
      } catch {
        /* native module missing (pre-rebuild) or any failure — silent */
      }
    })();

    return () => {
      cancelled = true;
      // Best-effort unregister on sign-out / unmount. Fire-and-forget; if
      // the network blip we're not going to retry.
      if (registeredToken) {
        void unregisterExpoPushToken(registeredToken).catch(() => {});
      }
    };
  }, [isAuthenticated]);
}
