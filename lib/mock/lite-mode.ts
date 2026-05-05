// Lite-mode mock module (RN port).
// Original web version used `window.matchMedia` + `localStorage` + a custom event
// for cross-tab sync. RN has none of those, so we back the toggle with a Zustand
// store that hydrates from AsyncStorage on first read and persists writes.

import { useEffect } from "react";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "evotv_lite-mode_v1";

interface LiteModeStore {
  enabled: boolean;
  hydrated: boolean;
  set: (next: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useLiteModeStore = create<LiteModeStore>((set, get) => ({
  enabled: false,
  hydrated: false,
  set: (next: boolean) => {
    set({ enabled: next });
    AsyncStorage.setItem(STORAGE_KEY, next ? "true" : "false").catch(() => {
      /* noop */
    });
  },
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      set({ enabled: raw === "true", hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));

/**
 * Synchronous read. Returns `false` until the Zustand store has been hydrated
 * via `useLiteMode()` or an explicit `useLiteModeStore.getState().hydrate()`.
 */
export function getLiteMode(): boolean {
  return useLiteModeStore.getState().enabled;
}

export function setLiteMode(enabled: boolean): void {
  useLiteModeStore.getState().set(enabled);
}

/**
 * React hook: returns `[enabled, setEnabled]`. Hydrates from AsyncStorage on
 * first mount.
 */
export function useLiteMode(): [boolean, (next: boolean) => void] {
  const enabled = useLiteModeStore((s) => s.enabled);
  const hydrate = useLiteModeStore((s) => s.hydrate);
  const setEnabled = useLiteModeStore((s) => s.set);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return [enabled, setEnabled];
}
