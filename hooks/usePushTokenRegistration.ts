import * as React from "react";
import { Platform } from "react-native";

import {
  registerExpoPushToken,
  unregisterExpoPushToken,
  type ExpoPlatform,
} from "@/lib/api/push";
import { classifyTokenError, setNativePushState } from "@/lib/push/state";

/**
 * Native push token registration.
 *
 * On native: request permission (no-op if already granted), fetch the Expo
 * push token, register it against the signed-in user. Unregister on
 * sign-out via the cleanup callback returned alongside.
 *
 * On web: no-ops. Web push is the VAPID flow, which the website owns.
 *
 * Failures still never block anything, but they are no longer invisible: each
 * one is recorded in `lib/push/state` so the settings screen can say why push
 * is off. A build with no FCM credentials used to look identical to a working
 * one, which is how nobody noticed that the project has never had any.
 */
export function usePushTokenRegistration(isAuthenticated: boolean): void {
  React.useEffect(() => {
    if (!isAuthenticated) {
      setNativePushState({ kind: "idle" });
      return;
    }
    if (Platform.OS === "web") {
      setNativePushState({
        kind: "unsupported",
        reason: "the web build uses browser notifications, not Expo push",
      });
      return;
    }

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
        if (!Device.isDevice) {
          setNativePushState({
            kind: "unsupported",
            reason: "a simulator cannot receive a push",
          });
          return;
        }

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
        if (cancelled) return;
        if (!granted) {
          setNativePushState({ kind: "denied" });
          return;
        }

        let result: { data?: string } | undefined;
        try {
          result = await Notifications.getExpoPushTokenAsync();
        } catch (err) {
          // The interesting failure. On Android this is a build with no
          // google-services.json; on iOS an EAS project with no APNs key.
          setNativePushState(
            classifyTokenError(err instanceof Error ? err.message : String(err)),
          );
          return;
        }
        if (cancelled || !result?.data) return;

        registeredToken = result.data;
        const platform: ExpoPlatform =
          Platform.OS === "ios"
            ? "ios"
            : Platform.OS === "android"
              ? "android"
              : "web";
        await registerExpoPushToken(result.data, platform);
        if (!cancelled) {
          setNativePushState({ kind: "registered", token: result.data });
        }
      } catch (err) {
        // Native module missing (a dev run before a rebuild), or anything else
        // unforeseen. Still not a blocker, but no longer a secret.
        setNativePushState({
          kind: "unsupported",
          reason: err instanceof Error ? err.message : String(err),
        });
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
