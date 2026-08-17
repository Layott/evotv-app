import { Linking, Platform } from "react-native";

import {
  registerExpoPushToken,
  unregisterExpoPushToken,
  type ExpoPlatform,
} from "@/lib/api/push";
import { persist } from "@/lib/storage/persist";
import {
  classifyTokenError,
  getNativePushState,
  setNativePushState,
  type NativePushState,
} from "./state";

/**
 * Turning native push on and off, callable from anywhere.
 *
 * This used to live inside `usePushTokenRegistration`, which ran once on mount
 * and had no way to be re-run. That is a problem the moment somebody declines
 * the OS prompt: Android stops asking after two dismissals and iOS after one,
 * so a person who tapped "Don't allow" by reflex had no route back other than
 * finding the app in system settings unaided. The Settings screen can now ask
 * again, and when the OS will not prompt any more it opens the right page
 * instead of appearing to do nothing.
 */

/**
 * Whether this person turned the switch off, remembered across restarts.
 *
 * Without it, "off" would live only in module state: the switch would go off,
 * the app would be closed, and the next launch would silently register the
 * device again because the sign-in effect re-runs. A switch that flips itself
 * back on is worse than no switch.
 */
const OPT_OUT_KEY = "evotv:push-opt-out";

export async function isPushOptedOut(): Promise<boolean> {
  return (await persist.get<boolean>(OPT_OUT_KEY)) === true;
}

/** `expo-notifications` and `expo-device`, or null on a build without them. */
function loadNativeModules() {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const Notifications = require(
      "expo-notifications",
    ) as typeof import("expo-notifications");
    const Device = require("expo-device") as typeof import("expo-device");
    /* eslint-enable @typescript-eslint/no-require-imports */
    return { Notifications, Device };
  } catch {
    return null;
  }
}

function currentPlatform(): ExpoPlatform {
  return Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
}

/**
 * Ask for permission if needed, get a token, and hand it to the server.
 *
 * @param promptIfNeeded  false to report the current state without ever showing
 *   the OS dialog. The app-start path passes true; a status refresh passes
 *   false so opening Settings never triggers a prompt by itself.
 */
export async function enableNativePush(
  promptIfNeeded = true,
): Promise<NativePushState> {
  const mods = loadNativeModules();
  if (!mods) {
    const next: NativePushState = {
      kind: "unsupported",
      reason: "expo-notifications is not in this build",
    };
    setNativePushState(next);
    return next;
  }
  const { Notifications, Device } = mods;

  try {
    if (!Device.isDevice) {
      const next: NativePushState = {
        kind: "unsupported",
        reason: "a simulator cannot receive a push",
      };
      setNativePushState(next);
      return next;
    }

    const existing = await Notifications.getPermissionsAsync();
    let granted =
      existing.granted ||
      existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted) {
      // `canAskAgain` is the whole point. Without checking it, a retry calls
      // requestPermissionsAsync, the OS returns denied without showing
      // anything, and the switch flicks back with no explanation.
      if (!existing.canAskAgain) {
        const next: NativePushState = { kind: "blocked" };
        setNativePushState(next);
        return next;
      }
      if (!promptIfNeeded) {
        const next: NativePushState = { kind: "denied" };
        setNativePushState(next);
        return next;
      }
      const req = await Notifications.requestPermissionsAsync();
      granted =
        req.granted ||
        req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      if (!granted) {
        const next: NativePushState = req.canAskAgain
          ? { kind: "denied" }
          : { kind: "blocked" };
        setNativePushState(next);
        return next;
      }
    }

    let result: { data?: string } | undefined;
    try {
      result = await Notifications.getExpoPushTokenAsync();
    } catch (err) {
      // The interesting failure. On Android this is a build with no
      // google-services.json; on iOS an EAS project with no APNs key.
      const next = classifyTokenError(
        err instanceof Error ? err.message : String(err),
      );
      setNativePushState(next);
      return next;
    }

    if (!result?.data) {
      const next: NativePushState = {
        kind: "unsupported",
        reason: "the push service returned no token",
      };
      setNativePushState(next);
      return next;
    }

    await registerExpoPushToken(result.data, currentPlatform());
    await persist.remove(OPT_OUT_KEY);
    const next: NativePushState = { kind: "registered", token: result.data };
    setNativePushState(next);
    return next;
  } catch (err) {
    const next: NativePushState = {
      kind: "unsupported",
      reason: err instanceof Error ? err.message : String(err),
    };
    setNativePushState(next);
    return next;
  }
}

/**
 * Stop sending to this device.
 *
 * The OS permission is left alone, because an app cannot revoke it and should
 * not send somebody to system settings to turn something off. What "off" means
 * here is that the server has no token for this device, which is the same thing
 * the website's push switch does when it deletes the subscription row.
 */
export async function disableNativePush(): Promise<NativePushState> {
  const state = getNativePushState();
  if (state.kind === "registered") {
    try {
      await unregisterExpoPushToken(state.token);
    } catch {
      // The token may already be gone server-side. Either way this device
      // should stop reporting itself as registered.
    }
  }
  await persist.set(OPT_OUT_KEY, true);
  const next: NativePushState = { kind: "off" };
  setNativePushState(next);
  return next;
}

/**
 * Open this app's page in the system settings.
 *
 * The only route left once the OS has stopped prompting.
 */
export async function openSystemNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}
