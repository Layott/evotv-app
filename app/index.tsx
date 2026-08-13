import { Redirect } from "expo-router";

import { useAuth } from "@/components/providers";

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(public)/home" />;
}
