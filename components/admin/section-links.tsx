import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { EXTRA_SECTIONS } from "@/lib/admin/nav-items";

/**
 * The screens that live under this section.
 *
 * The website has eighteen sections in its sidebar. The app has twenty-six
 * screens, because eight of them are things the website reaches from inside a
 * section rather than from the rail: VODs and clips from the library, sanctions
 * from moderation, and so on. `EXTRA_SECTIONS` records that ownership.
 *
 * The sections sheet already indents them under their parent, but a sheet is
 * somewhere you go when you are lost. Somebody already on the Library screen
 * should be able to reach VODs from there, which is what this row is.
 *
 * A row of links rather than a tab bar on purpose: these are separate screens
 * with their own headers, not views of the same one, and a tab bar would
 * promise they swap in place.
 */
export function SectionLinks({ parent }: { parent: string }) {
  const router = useRouter();
  const links = EXTRA_SECTIONS[parent] ?? [];
  if (links.length === 0) return null;

  return (
    <View className="mb-4 flex-row flex-wrap items-center gap-2">
      {links.map((link) => (
        <Pressable
          key={link.href}
          onPress={() => router.push(link.href as never)}
          accessibilityRole="link"
          className="rounded-lg bg-accent px-3 py-1.5 active:opacity-70"
        >
          <Text className="text-xs font-semibold text-foreground">
            {link.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
