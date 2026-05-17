import * as React from "react";
import { Toaster } from "sonner-native";

import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { AuthProvider, useAuth } from "./auth-provider";
import { RoleSwitcher } from "./role-switcher";
import { usePushTokenRegistration } from "@/hooks/usePushTokenRegistration";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Inside-AuthProvider shell that runs hooks dependent on the auth state.
 * Push registration sits here so it fires only after `useAuth()` is wired.
 */
function AuthScopedChildren({ children }: ProvidersProps) {
  const { isAuthenticated } = useAuth();
  usePushTokenRegistration(isAuthenticated);
  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryProvider>
        <AuthProvider>
          <AuthScopedChildren>{children}</AuthScopedChildren>
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
