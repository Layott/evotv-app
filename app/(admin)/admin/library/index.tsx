import { Stack } from "expo-router";
import { LibraryManagerPage } from "@/components/admin/library-manager-page";

export default function AdminLibraryScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Library" }} />
      <LibraryManagerPage />
    </>
  );
}
