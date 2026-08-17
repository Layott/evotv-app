import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

import { persist } from "@/lib/storage/persist";

/**
 * Fingerprint or face unlock for the app.
 *
 * This exists because of the other half of the same decision: browsers are
 * signed out after three quiet hours, since a lot of the audience uses shared
 * machines. A phone is not a shared machine, so the app keeps its week-long
 * session rather than asking for a password several times a day. What guards
 * it instead is the sensor already on the device.
 *
 * Two things this deliberately is not:
 *
 * - It is not a second factor. The session is already valid; this only decides
 *   whether the person holding the phone gets to see it. Treating it as auth
 *   would mean trusting a client-side boolean, which is worth nothing.
 * - It is not a lockout. The system prompt is asked for with the device
 *   passcode fallback left on, so a failed face scan falls through to the PIN
 *   the owner already knows. An unlock that can strand somebody outside their
 *   own account is worse than no unlock.
 */

const ENABLED_KEY = "evotv:app-lock";

/**
 * How long the app may sit in the background before it locks again.
 *
 * Was one minute, and the owner's report was "every time you minimize the app,
 * when you open it you have to unlock it again". A minute is the length of
 * replying to one message, so ordinary use kept landing on the lock screen.
 *
 * Fifteen minutes is the useful line: it covers switching apps, taking a call
 * and reading a notification, and still locks a phone somebody put down and
 * walked away from. The session itself is the thing being protected and it is
 * a week long, so a slightly longer window here changes very little.
 */
export const RELOCK_AFTER_MS = 15 * 60_000;

export type LockCapability =
  | { available: true; label: string }
  | { available: false; reason: "unsupported" | "no-hardware" | "not-enrolled" };

/**
 * What the sensor on this device is called, so the setting can say "Face ID"
 * rather than the generic phrase on a device that has a specific one.
 */
function labelFor(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return Platform.OS === "ios" ? "Face ID" : "face unlock";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === "ios" ? "Touch ID" : "fingerprint";
  }
  return "your screen lock";
}

export async function getCapability(): Promise<LockCapability> {
  // The module is native-only. On web the whole feature is absent rather than
  // broken: there is no sensor to ask.
  if (Platform.OS === "web") return { available: false, reason: "unsupported" };

  try {
    if (!(await LocalAuthentication.hasHardwareAsync())) {
      return { available: false, reason: "no-hardware" };
    }
    // Enrolment, not hardware, is the common failure. A phone with a fingerprint
    // reader nobody has registered a print on cannot authenticate, and offering
    // the switch anyway produces a setting that silently never works.
    if (!(await LocalAuthentication.isEnrolledAsync())) {
      return { available: false, reason: "not-enrolled" };
    }
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return { available: true, label: labelFor(types) };
  } catch {
    return { available: false, reason: "unsupported" };
  }
}

export async function isLockEnabled(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  return (await persist.get<boolean>(ENABLED_KEY)) === true;
}

export async function setLockEnabled(enabled: boolean): Promise<void> {
  await persist.set(ENABLED_KEY, enabled);
}

/**
 * Ask for the unlock. `true` means the person proved they hold the device.
 *
 * `disableDeviceFallback` stays false on purpose: see the note at the top.
 */
export async function authenticate(reason: string): Promise<boolean> {
  if (Platform.OS === "web") return true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    // A sensor that throws must not become a locked door.
    return false;
  }
}
