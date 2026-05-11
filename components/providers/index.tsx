import * as React from "react";
import { Toaster } from "sonner-native";

import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { RoleSwitcher } from "./role-switcher";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster position="top-center" theme="dark" richColors />
          {__DEV__ ? <RoleSwitcher /> : null}
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

/**
 * Backward-compat alias. New code should import `useAuth` directly.
 * Both names point at the same hook now that real auth replaced the mock.
 */
export { useAuth, useAuth as useMockAuth } from "./auth-provider";
export { useTheme } from "./theme-provider";
