import * as React from "react";
import { Platform, Text, View } from "react-native";
import { toast } from "sonner-native";

import { SectionCard, SettingRow } from "./section-card";
import { Switch } from "@/components/ui/switch";
import {
  type LockCapability,
  authenticate,
  getCapability,
  isLockEnabled,
  setLockEnabled,
} from "@/lib/security/app-lock";

/**
 * The fingerprint / face unlock switch.
 *
 * Kept out of `settings/index.tsx` because that file is already 859 lines, and
 * this needs its own capability check on mount.
 *
 * Turning it on asks for the sensor before saving anything. A switch that flips
 * green and then fails the first time it matters is worse than one that refuses
 * up front, and this is the only place the sensor can be tested without locking
 * somebody out to do it. Turning it off asks too: otherwise the lock is
 * one tap away from being removed by whoever is holding the phone.
 */
function reasonText(cap: Extract<LockCapability, { available: false }>): string {
  switch (cap.reason) {
    case "no-hardware":
      return "This device has no fingerprint or face sensor.";
    case "not-enrolled":
      return "Add a fingerprint or face in your device settings first, then come back.";
    default:
      return "Not available on this device.";
  }
}

export function AppLockRow() {
  const [cap, setCap] = React.useState<LockCapability | null>(null);
  const [enabled, setEnabled] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void Promise.all([getCapability(), isLockEnabled()]).then(([c, on]) => {
      if (cancelled) return;
      setCap(c);
      setEnabled(on);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onToggle = React.useCallback(
    async (next: boolean) => {
      if (busy) return;
      setBusy(true);
      try {
        const ok = await authenticate(
          next ? "Confirm it is you to turn on unlock" : "Confirm it is you to turn off unlock",
        );
        if (!ok) {
          toast.error(next ? "Could not turn on unlock" : "Unlock stays on");
          return;
        }
        await setLockEnabled(next);
        setEnabled(next);
        toast.success(next ? "Unlock is on" : "Unlock is off");
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  // No sensor on the web build, so the whole section would be a dead switch.
  if (Platform.OS === "web" || cap === null) return null;

  return (
    <SectionCard
      title="Security"
      description="Keep your account closed when the phone is not in your hand."
    >
      {cap.available ? (
        <SettingRow
          label={`Unlock with ${cap.label}`}
          description="Reopen the app with your thumb instead of your password. Not asked right after you sign in."
        >
          <Switch
            checked={enabled}
            onCheckedChange={(v) => void onToggle(v)}
            disabled={busy}
          />
        </SettingRow>
      ) : (
        <View className="py-3">
          <Text className="text-sm font-semibold text-foreground">
            Unlock with fingerprint or face
          </Text>
          <Text className="text-xs text-muted-foreground">{reasonText(cap)}</Text>
        </View>
      )}
    </SectionCard>
  );
}
