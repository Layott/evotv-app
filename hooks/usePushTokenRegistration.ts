import * as React from "react";
import { Platform } from "react-native";

import { unregisterExpoPushToken } from "@/lib/api/push";
import { getNativePushState, setNativePushState } from "@/lib/push/state";
import { enableNativePush, isPushOptedOut } from "@/lib/push/register";

/**
 * Native push token registration, on sign-in.
 *
 * On native: request permission if it has not been answered, fetch the Expo
 * push token, register it against the signed-in user. Unregister on sign-out
 * via the cleanup callback.
 *
 * On web: no-ops. Web push is the VAPID flow, which the website owns.
 *
 * The work itself lives in `lib/push/register.ts` rather than here, because it
 * needs to be callable a second time. This hook ran once on mount and could
 * never be re-run, so somebody who dismissed the OS prompt had no way back:
 * Android stops asking after two dismissals and iOS after one, and the settings
 * screen could only describe the problem. It offers a switch now, and both
 * paths go through the same function.
 *
 * Failures still never block anything, but they are no longer invisible: each
 * one is recorded in `lib/push/state` so the settings screen can say why push
 * is off. A build with no FCM credentials used to look identical to a working
 * one, which is how nobody noticed the project had never had any.
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

    void (async () => {
      // Somebody who turned the switch off should stay off. Without this the
      // sign-in effect would register the device again on the next launch and
      // the switch would appear to have flipped itself back on.
      if (await isPushOptedOut()) {
        if (!cancelled) setNativePushState({ kind: "off" });
        return;
      }

      const state = await enableNativePush(true);
      // A sign-out that lands mid-flight should not leave the screen claiming
      // this device is registered.
      if (cancelled && state.kind === "registered") {
        void unregisterExpoPushToken(state.token).catch(() => {});
      }
    })();

    return () => {
      cancelled = true;
      // Best-effort unregister on sign-out or unmount. Fire and forget: if the
      // network is down there is nothing useful to retry against.
      const state = getNativePushState();
      if (state.kind === "registered") {
        void unregisterExpoPushToken(state.token).catch(() => {});
      }
    };
  }, [isAuthenticated]);
}
