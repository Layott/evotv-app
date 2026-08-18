import { Redirect, Stack, usePathname } from "expo-router";
import { Text, View } from "react-native";

import { useTokens } from "@/lib/theme/tokens";
import { useAuth } from "@/components/providers";
import { hasMinRole, roleLabel } from "@/lib/auth/roles";
import {
  requiredRoleForPath,
  WEAKEST_ADMIN_ROLE,
} from "@/lib/admin/nav-items";
import {
  AdminSectionsButton,
  AdminSectionsProvider,
} from "@/components/admin/admin-sections-sheet";

/**
 * The admin group.
 *
 * Two things changed here, both to match the website rather than to look like
 * it.
 *
 * **The gate is per route, not per group.** This used to require `admin` for
 * everything under `(admin)/`, while the website gates each page with its own
 * `minRole`. The effect was that a moderator, a support admin and a finance
 * admin - three of the five admin ranks - were redirected out of the whole
 * section, including the pages built for them. The route's requirement now
 * comes from the same list that decides whether the section is shown at all,
 * so a screen cannot exist without a gate and the two cannot disagree.
 *
 * **Every screen can reach every other screen.** The website keeps a sidebar
 * on the left; a phone gets the same list as a sheet behind a header button.
 * Before this the only route between two admin screens was back out to the home
 * feature drawer.
 */
export default function AdminLayout() {
  const t = useTokens();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Outer gate: can this account open anything in here at all? On the ladder,
  // not `role !== "admin"` - that comparison is true for a head_admin, which
  // once bounced the highest role on the platform out of the dashboard it owns.
  if (!hasMinRole(user.role, WEAKEST_ADMIN_ROLE)) {
    return <Redirect href="/" />;
  }

  // Inner gate: this particular section. Rendered rather than redirected,
  // because silently sending someone home reads as a broken link.
  const needed = requiredRoleForPath(pathname);
  if (!hasMinRole(user.role, needed)) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-lg font-semibold text-foreground text-center">
          {roleLabel(needed)} access required
        </Text>
        <Text className="mt-2 text-sm text-muted-foreground text-center leading-5">
          This section needs the {roleLabel(needed)} role or higher. You are
          signed in as {roleLabel(user.role)}.
        </Text>
      </View>
    );
  }

  return (
    /*
     * The sheet mounts here rather than in the header.
     *
     * `headerRight` renders into the native stack header, which is a platform
     * view and cannot host a full-screen Modal, so the sheet that used to live
     * beside the button never appeared: pressing Sections set state and nothing
     * happened. The provider keeps the button in the header and puts the sheet
     * outside the navigator where a Modal works.
     */
    <AdminSectionsProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.fg,
          headerTitleStyle: { color: t.fg, fontFamily: "ArchivoSemiBold" },
          headerBackTitle: "Back",
          headerRight: () => <AdminSectionsButton />,
          contentStyle: { backgroundColor: t.bg },
          animation: "slide_from_right",
        }}
      />
    </AdminSectionsProvider>
  );
}
