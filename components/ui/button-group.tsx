import * as React from "react";
import { Text, View, type TextProps, type ViewProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonGroupVariants = cva("flex-row", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export interface ButtonGroupProps
  extends ViewProps,
    VariantProps<typeof buttonGroupVariants> {
  className?: string;
}

const ButtonGroup = React.forwardRef<View, ButtonGroupProps>(
  ({ className, orientation, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="none"
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  ),
);
ButtonGroup.displayName = "ButtonGroup";

const ButtonGroupText = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn(
      "px-2 text-sm font-medium text-muted-foreground self-center",
      className,
    )}
    {...props}
  />
));
ButtonGroupText.displayName = "ButtonGroupText";

const ButtonGroupSeparator = React.forwardRef<
  View,
  ViewProps & { className?: string }
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("w-px h-full bg-border", className)}
    {...props}
  />
));
ButtonGroupSeparator.displayName = "ButtonGroupSeparator";

export { ButtonGroup, ButtonGroupText, ButtonGroupSeparator, buttonGroupVariants };
