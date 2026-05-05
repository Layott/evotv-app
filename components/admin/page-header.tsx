import * as React from "react";
import { Text, View } from "react-native";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <View className="mb-5 flex-col gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-2xl font-semibold text-foreground">{title}</Text>
          {description ? (
            <Text className="mt-1 text-sm text-muted-foreground">
              {description}
            </Text>
          ) : null}
        </View>
        {actions ? (
          <View className="flex-row items-center gap-2">{actions}</View>
        ) : null}
      </View>
    </View>
  );
}
