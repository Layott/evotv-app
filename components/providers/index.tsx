import * as React from "react";
import { Toaster } from "sonner-native";

import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { MockAuthProvider } from "./mock-auth-provider";
import { RoleSwitcher } from "./role-switcher";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryProvider>
        <MockAuthProvider>
          {children}
          <Toaster position="top-center" theme="dark" richColors />
          {__DEV__ ? <RoleSwitcher /> : null}
        </MockAuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export { useMockAuth } from "./mock-auth-provider";
export { useTheme } from "./theme-provider";
