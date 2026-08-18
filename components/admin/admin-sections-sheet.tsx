import * as React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTokens } from "@/lib/theme/tokens";
import { useAuth } from "@/components/providers";
import { X } from "@/components/icons";
import {
  adminNavFor,
  isAdminNavItemActive,
  EXTRA_SECTIONS,
} from "@/lib/admin/nav-items";

/**
 * The app's equivalent of the website's admin sidebar.
 *
 * The website keeps every section one click away in a rail down the left. The
 * app had nothing: `(admin)/_layout.tsx` was a bare Stack, so the only way from
 * one admin screen to another was back out to the home feature drawer and in
 * again, and the only link into the section at all was buried in that drawer.
 * That is what the owner meant by the app admin being a second CMS - not only
 * that it looked different, but that it did not navigate.
 *
 * A phone has no room for a permanent rail, so the same list opens as a sheet
 * from a header button present on every admin screen. Same items, same order,
 * same labels, same role filtering, from `lib/admin/nav-items.ts`.
 *
 * Sections the website nests rather than listing top-level (VODs under Library,
 * Sanctions under Moderation, and so on) appear indented under their parent, so
 * nothing the app already had became unreachable.
 */
export function AdminSectionsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuth();

  const items = React.useMemo(() => adminNavFor(role), [role]);

  const go = (href: string) => {
    onClose();
    router.push(href as never);
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* A plain scrim, not a blur. Frosted panels are banned, and a blur over
          a list of eighteen labels costs legibility for nothing. */}
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
      />
      <View
        style={{
          backgroundColor: t.bg,
          paddingBottom: insets.bottom + 12,
          maxHeight: "82%",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <View className="flex-row items-center justify-between px-5 pt-5 pb-2">
          <View>
            <Text className="text-lg font-bold text-foreground">Admin</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {items.length} sections you can open
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Close section list"
            className="active:opacity-70"
          >
            <X size={20} color={t.muted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
          {items.map((item) => {
            const active = isAdminNavItemActive(item, pathname);
            const nested = EXTRA_SECTIONS[item.href] ?? [];
            return (
              <View key={item.href}>
                <Pressable
                  onPress={() => go(item.href)}
                  accessibilityRole="link"
                  accessibilityState={{ selected: active }}
                  // Selection is a fill, never a ring. Same rule the website
                  // follows with `bg-accent` on the active sidebar row.
                  className={`mx-3 mb-0.5 flex-row items-center gap-3 rounded-xl px-3 py-3 active:opacity-70 ${
                    active ? "bg-accent" : ""
                  }`}
                >
                  <item.Icon size={18} color={active ? t.brand : t.muted} />
                  <Text
                    className={`text-[15px] ${
                      active
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>

                {nested.map((sub) => (
                  <Pressable
                    key={sub.href}
                    onPress={() => go(sub.href)}
                    accessibilityRole="link"
                    className="mx-3 mb-0.5 flex-row items-center rounded-xl py-2 pl-12 pr-3 active:opacity-70"
                  >
                    <Text className="text-[13px] text-muted-foreground">
                      {sub.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * The button that opens the sheet. Sits in every admin screen's header.
 */
/**
 * Open state for the sections sheet, held above the navigator.
 *
 * The button and the sheet have to live in different places. `headerRight`
 * renders into the native stack header, which is a real platform view and
 * cannot host a full-screen `Modal`: the button set its state, the sheet
 * mounted inside the header, and nothing appeared on screen. That is why the
 * control looked dead on a phone while the code read as correct.
 *
 * So the button stays in the header and the sheet renders as a sibling of the
 * navigator, with this carrying the one piece of state between them.
 */
const SectionsContext = React.createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

export function AdminSectionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const value = React.useMemo(() => ({ open, setOpen }), [open]);
  return (
    <SectionsContext.Provider value={value}>
      {children}
      {/* Outside the navigator, so the Modal has a normal React Native view to
          mount into rather than the native header. */}
      <AdminSectionsSheet open={open} onClose={() => setOpen(false)} />
    </SectionsContext.Provider>
  );
}

export function AdminSectionsButton() {
  const ctx = React.useContext(SectionsContext);
  return (
    <Pressable
      onPress={() => ctx?.setOpen(true)}
      hitSlop={12}
      accessibilityLabel="Admin sections"
      className="px-3 py-1.5 rounded-lg bg-accent active:opacity-70"
    >
      <Text className="text-xs font-semibold text-foreground">Sections</Text>
    </Pressable>
  );
}
