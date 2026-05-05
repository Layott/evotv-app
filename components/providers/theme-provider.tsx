import * as React from "react";
import { useColorScheme } from "nativewind";

import { persist } from "@/lib/storage/persist";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "evotv:theme";
const DEFAULT_THEME: ThemeMode = "dark";

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
}: ThemeProviderProps) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = React.useState<ThemeMode>(defaultTheme);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void persist.get<ThemeMode>(STORAGE_KEY).then((stored) => {
      if (cancelled) return;
      const next = stored ?? defaultTheme;
      setThemeState(next);
      setColorScheme(next);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [defaultTheme, setColorScheme]);

  const setTheme = React.useCallback(
    (mode: ThemeMode) => {
      setThemeState(mode);
      setColorScheme(mode);
      void persist.set(STORAGE_KEY, mode);
    },
    [setColorScheme],
  );

  const resolvedTheme: ResolvedTheme = colorScheme === "light" ? "light" : "dark";

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  if (!hydrated) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
