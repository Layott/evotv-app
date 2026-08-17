import * as React from "react";

/**
 * Why push is, or is not, working on this device.
 *
 * The registration hook swallowed every failure, on the reasoning that push is
 * enrichment and must never block a sign-in. That part is right. What it cost
 * is that a build with no FCM credentials looks exactly like a build where
 * everything is fine: no token, no error, nobody the wiser. The state is
 * recorded here so a screen can say which it is.
 */
export type NativePushState =
  /** Nothing has run yet: signed out, or the effect has not fired. */
  | { kind: "idle" }
  /** The web build, a simulator, or a dev client without the native module. */
  | { kind: "unsupported"; reason: string }
  /**
   * The person said no, and the OS will still show the prompt if asked again.
   * Turning the switch back on re-asks.
   */
  | { kind: "denied" }
  /**
   * The person said no and the OS will not prompt again. Android stops asking
   * after two dismissals, iOS after one. There is nothing the app can do from
   * here except open the system settings page, so the switch sends them there
   * rather than pretending a retry will work.
   */
  | { kind: "blocked" }
  /**
   * Permission is granted but the switch is off, so the server has no token for
   * this device and will not send to it. Turning it back on needs no prompt.
   */
  | { kind: "off" }
  /**
   * The app asked for a token and the push service refused, which on Android
   * means no FCM credentials in this build and on iOS no APNs key. Nothing the
   * person holding the phone can do about it.
   */
  | { kind: "unconfigured"; reason: string }
  /** A token was issued and the server has it. */
  | { kind: "registered"; token: string };

let current: NativePushState = { kind: "idle" };
const listeners = new Set<() => void>();

export function setNativePushState(next: NativePushState): void {
  current = next;
  if (next.kind === "unconfigured" || next.kind === "unsupported") {
    // Loud in dev, because the whole point is that this used to be silent.
    console.warn(`[push] not available: ${next.reason}`);
  }
  for (const l of listeners) l();
}

export function getNativePushState(): NativePushState {
  return current;
}

export function useNativePushState(): NativePushState {
  return React.useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    getNativePushState,
    getNativePushState,
  );
}

/**
 * Sort a token failure into "this build cannot" and "this device cannot".
 *
 * expo-notifications reports a missing FCM setup by throwing, and the message
 * is the only thing that distinguishes it from a network blip.
 */
export function classifyTokenError(message: string): NativePushState {
  const m = message.toLowerCase();
  if (
    m.includes("firebase") ||
    m.includes("fcm") ||
    m.includes("google-services") ||
    m.includes("credential") ||
    m.includes("apns")
  ) {
    return { kind: "unconfigured", reason: message };
  }
  return { kind: "unsupported", reason: message };
}
