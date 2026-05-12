import * as React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import {
  ChevronDown,
  Shield,
  Star,
  UserPlus,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";

import type { Role } from "@/lib/types";
import { useAuth } from "./auth-provider";

interface RoleEntry {
  value: Role;
  label: string;
  Icon: LucideIcon;
}

const ROLES: RoleEntry[] = [
  { value: "guest", label: "Guest", Icon: UserPlus },
  { value: "user", label: "User", Icon: UserRound },
  { value: "premium", label: "Premium", Icon: Star },
  { value: "admin", label: "Admin", Icon: Shield },
];

const BRAND = "#2CD7E3";
const FG = "#FAFAFA";
const MUTED = "#A3A3A3";

export function RoleSwitcher() {
  const { role, login, logout } = useAuth();
  const [open, setOpen] = React.useState(false);

  if (!__DEV__) return null;

  const current = ROLES.find((r) => r.value === role) ?? ROLES[0]!;
  const CurrentIcon = current.Icon;

  return (
    <View pointerEvents="box-none" className="absolute bottom-6 right-4 z-50">
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-2 rounded-full border border-neutral-700 bg-neutral-950/90 px-3 py-2"
      >
        <CurrentIcon size={14} color={FG} />
        <Text className="text-xs font-medium text-neutral-100">
          {current.label}
        </Text>
        <ChevronDown size={12} color={MUTED} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 items-end justify-end bg-black/50 p-4"
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="mb-20 w-56 rounded-lg border border-neutral-800 bg-neutral-950"
          >
            <View className="border-b border-neutral-800 px-3 py-2">
              <Text className="text-[10px] uppercase tracking-wider text-neutral-500">
                Dev role switcher
              </Text>
            </View>
            {ROLES.map((entry) => {
              const Icon = entry.Icon;
              const active = entry.value === role;
              return (
                <Pressable
                  key={entry.value}
                  onPress={() => {
                    if (entry.value === "guest") logout();
                    else login(entry.value);
                    setOpen(false);
                  }}
                  className="flex-row items-center gap-2 px-3 py-3"
                >
                  <Icon size={14} color={active ? BRAND : FG} />
                  <Text
                    className={
                      active
                        ? "text-xs font-medium"
                        : "text-xs text-neutral-200"
                    }
                    style={active ? { color: BRAND } : undefined}
                  >
                    {entry.label}
                  </Text>
                  {active ? (
                    <Text
                      className="ml-auto text-[10px]"
                      style={{ color: BRAND }}
                    >
                      active
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
