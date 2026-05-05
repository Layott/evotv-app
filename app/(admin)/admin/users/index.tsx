import { Stack } from "expo-router";

import { UsersRolesPage } from "@/components/admin/users-roles-page";

export default function AdminUsersScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Users & roles" }} />
      <UsersRolesPage />
    </>
  );
}
