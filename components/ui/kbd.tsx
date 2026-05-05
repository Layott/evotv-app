import * as React from "react";
import { Text, View, type TextProps, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";

export interface KbdProps extends ViewProps {
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const Kbd = React.forwardRef<View, KbdProps>(
  ({ className, textClassName, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "rounded border border-border bg-muted px-1.5 py-0.5 self-start",
        className,
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (typeof child === "string" || typeof child === "number") {
          return (
            <Text
              className={cn(
                "text-[10px] font-mono text-foreground",
                textClassName,
              )}
            >
              {child}
            </Text>
          );
        }
        return child;
      })}
    </View>
  ),
);
Kbd.displayName = "Kbd";

const KbdGroup = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row items-center gap-1", className)}
      {...props}
    />
  ),
);
KbdGroup.displayName = "KbdGroup";

export { Kbd, KbdGroup };
