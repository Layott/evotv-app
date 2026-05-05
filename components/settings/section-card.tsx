import * as React from "react";
import { Text, View } from "react-native";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  children,
  className,
}: SectionCardProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-border bg-card/60 p-5",
        className,
      )}
    >
      <View className="mb-4">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {description ? (
          <Text className="mt-0.5 text-sm text-muted-foreground">
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingRow({
  label,
  description,
  children,
  className,
}: SettingRowProps) {
  return (
    <View
      className={cn(
        "flex-row items-center justify-between gap-4 py-3",
        className,
      )}
    >
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        {description ? (
          <Text className="text-xs text-muted-foreground">{description}</Text>
        ) : null}
      </View>
      <View className="shrink-0">{children}</View>
    </View>
  );
}
