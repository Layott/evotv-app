import * as React from "react";
import { Text, View } from "react-native";

import { cn } from "@/lib/utils";

export interface StubProps {
  name: string;
  className?: string;
  children?: React.ReactNode;
}

export function Stub({ name, className, children }: StubProps) {
  if (__DEV__) {
    console.warn(
      `[ui/${name}] Not implemented in React Native — see ui/README.md TODO.`,
    );
  }
  return (
    <View
      className={cn(
        "rounded-md border border-dashed border-border bg-card p-3",
        className,
      )}
    >
      <Text className="text-xs text-muted-foreground">
        {`<${name}> not implemented in RN`}
      </Text>
      {children}
    </View>
  );
}

export function passthrough<P extends { children?: React.ReactNode }>(
  Component: React.FC<P>,
) {
  return Component;
}
