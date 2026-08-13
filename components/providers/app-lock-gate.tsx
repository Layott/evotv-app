import * as React from "react";
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

  // Read the preference once the session is known. Until then `enabled` is
  // null and nothing is rendered as locked, which matches the cold-start order:
  // splash, then session, then lock.
  React.useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    void isLockEnabled().then((on) => {
      if (cancelled) return;
      setEnabled(on);
      if (on && isAuthenticated) setLocked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated]);

  const unlock = React.useCallback(async () => {
    if (prompting) return;
    setPrompting(true);
    try {
      const ok = await authenticate("Unlock EVO TV");
      if (ok) setLocked(false);
    } finally {
      setPrompting(false);
    }
  }, [prompting]);

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
      if (state === "active") {
        const away = backgroundedAt.current;
        backgroundedAt.current = null;
        if (away !== null && Date.now() - away >= RELOCK_AFTER_MS) {
          setLocked(true);
        }
        return;
      }
      // "inactive" is the iOS app-switcher preview and the moment a system
      // dialog opens, including the unlock prompt itself. Only a real
      // background start the clock, or unlocking would re-lock the app.
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
        Unlock to pick up where you left off. You stay signed in.
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

      {/* The way out for somebody whose sensor has stopped recognising them,
          or who is handing the phone to someone else. */}
      <Pressable
        onPress={() => void logout()}
        style={{ marginTop: 16, minHeight: 44, justifyContent: "center", paddingHorizontal: 16 }}
      >
        <Text style={{ color: tokens.muted, fontSize: 14 }}>
          Sign out instead
        </Text>
      </Pressable>
    </View>
  );
}
