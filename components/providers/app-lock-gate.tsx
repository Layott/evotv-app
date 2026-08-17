import * as React from "react";
import { router } from "expo-router";
import { AppState, type AppStateStatus, Image, Platform, Pressable, Text, View } from "react-native";

import { useAuth } from "./auth-provider";
import {
  RELOCK_AFTER_MS,
  authenticate,
  isLockEnabled,
} from "@/lib/security/app-lock";
import { tokens } from "@/lib/theme/tokens";

/**
 * Holds the app behind the device's own unlock when the setting is on.
 *
 * Sits inside `SplashGate`, so the lock screen is the first thing after the
 * splash rather than a panel that slides over a home screen somebody has
 * already read. See `lib/security/app-lock.ts` for why this exists and what it
 * deliberately is not.
 *
 * Signed out, it does nothing at all: there is nothing private on screen and a
 * lock in front of a login form is a door in front of a door.
 *
 * It also does nothing to somebody who has just signed in. The unlock exists so
 * that a session already on the phone can be opened with a thumb instead of a
 * password; putting it in front of somebody who typed that password ten seconds
 * ago asks the same question twice. So only a session that was *restored* at
 * startup is locked, never one created by signing in.
 */

interface Props {
  children: React.ReactNode;
}

export function AppLockGate({ children }: Props) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [enabled, setEnabled] = React.useState<boolean | null>(null);
  const [locked, setLocked] = React.useState(false);
  const [prompting, setPrompting] = React.useState(false);
  const backgroundedAt = React.useRef<number | null>(null);
  /**
   * Whether the first "is there a session?" question has been answered.
   *
   * That first answer is the only one that can lock the app on open, because it
   * is the only one describing a session that was already there. Every later
   * answer is somebody signing in, and they have just proved who they are.
   */
  const startupSettled = React.useRef(false);

  // Read the preference once the session is known. Until then `enabled` is
  // null and nothing is rendered as locked, which matches the cold-start order:
  // splash, then session, then lock.
  React.useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    void isLockEnabled().then((on) => {
      if (cancelled) return;
      // Kept current either way, so turning the lock on in Settings arms the
      // re-lock below without needing a restart.
      setEnabled(on);
      if (startupSettled.current) return;
      startupSettled.current = true;
      if (on && isAuthenticated) setLocked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated]);

  /**
   * True while the system unlock dialog is open.
   *
   * A ref as well as state, because the AppState listener below reads it from
   * inside a closure that must not be torn down and rebuilt every time the
   * dialog opens.
   */
  const promptingRef = React.useRef(false);

  const unlock = React.useCallback(async () => {
    if (promptingRef.current) return;
    promptingRef.current = true;
    setPrompting(true);
    try {
      const ok = await authenticate("Unlock EVO TV");
      if (ok) {
        setLocked(false);
        // Cleared so the "active" event that arrives as the dialog closes
        // cannot be measured against a timestamp taken when it opened.
        backgroundedAt.current = null;
      }
    } finally {
      promptingRef.current = false;
      setPrompting(false);
    }
  }, []);

  // Ask as soon as the lock appears, so the common case is one glance at the
  // phone rather than a screen that waits to be tapped first.
  React.useEffect(() => {
    if (locked && !prompting) void unlock();
    // `unlock` is deliberately not a dependency: including it re-runs this on
    // every prompting flip and re-opens the system dialog in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  // Re-lock after time away, not on every glance at a notification. Coming back
  // to a lock screen because you checked the time mid-stream is the failure
  // mode this window exists to avoid.
  React.useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const onChange = (state: AppStateStatus) => {
      /*
       * The unlock dialog is not the user leaving.
       *
       * On iOS opening a system dialog reports "inactive", which the check
       * below already skipped. Android reports a full "background" instead, so
       * asking for a fingerprint started the away clock, and an unlock that
       * took longer than the window re-locked the app the instant it
       * succeeded. That is the "I unlock it and it locks again" loop.
       */
      if (promptingRef.current) return;

      if (state === "active") {
        const away = backgroundedAt.current;
        backgroundedAt.current = null;
        if (away !== null && Date.now() - away >= RELOCK_AFTER_MS) {
          setLocked(true);
        }
        return;
      }

      if (state === "background" && backgroundedAt.current === null) {
        backgroundedAt.current = Date.now();
      }
    };

    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [enabled, isAuthenticated]);

  if (Platform.OS === "web" || !locked || !isAuthenticated) return <>{children}</>;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tokens.bg,
        padding: 24,
      }}
    >
      <Image
        source={require("@/assets/icon.png")}
        style={{ width: 88, height: 88, borderRadius: 20 }}
        resizeMode="contain"
      />
      <Text
        style={{
          marginTop: 24,
          color: tokens.fg,
          fontSize: 20,
          fontWeight: "700",
        }}
      >
        EVO TV is locked
      </Text>
      <Text
        style={{
          marginTop: 8,
          textAlign: "center",
          color: tokens.muted,
          fontSize: 14,
          maxWidth: 300,
        }}
      >
        Unlock with your fingerprint or face, or sign in the usual way.
      </Text>

      <Pressable
        onPress={unlock}
        disabled={prompting}
        style={{
          marginTop: 28,
          minHeight: 48,
          justifyContent: "center",
          paddingHorizontal: 28,
          borderRadius: 7,
          backgroundColor: tokens.brand,
          opacity: prompting ? 0.6 : 1,
        }}
      >
        <Text style={{ color: tokens.bg, fontSize: 16, fontWeight: "700" }}>
          {prompting ? "Waiting…" : "Unlock"}
        </Text>
      </Pressable>

      {/*
        The other way in, offered at the same time rather than as a punishment.
        This used to read "Sign out instead", which is the same action described
        as a loss: somebody whose sensor has stopped recognising them was told
        their only remaining option was to leave. Signing in with a password or
        with Google is a normal thing to want to do, and the screen now says so.
      */}
      <Pressable
        onPress={async () => {
          await logout();
          router.replace("/(auth)/login");
        }}
        style={{
          marginTop: 14,
          minHeight: 48,
          justifyContent: "center",
          paddingHorizontal: 24,
          borderRadius: 7,
          backgroundColor: "#17454A",
        }}
      >
        <Text style={{ color: tokens.fg, fontSize: 15, fontWeight: "600" }}>
          Sign in with email or Google
        </Text>
      </Pressable>
    </View>
  );
}
