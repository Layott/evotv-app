import { Redirect } from "expo-router";

import { useMockAuth } from "@/components/providers";

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useMockAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(public)/home" />;
}
