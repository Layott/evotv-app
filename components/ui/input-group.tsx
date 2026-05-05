import * as React from "react";
import { Text, View, type TextProps, type ViewProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const InputGroup = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "h-9 w-full flex-row items-center rounded-md border border-input bg-transparent",
        className,
      )}
      {...props}
    />
  ),
);
InputGroup.displayName = "InputGroup";

const inputGroupAddonVariants = cva(
  "flex-row items-center justify-center gap-2 px-2",
  {
    variants: {
      align: {
        "inline-start": "pl-3",
        "inline-end": "pr-3",
        "block-start": "pl-3",
        "block-end": "pl-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

export interface InputGroupAddonProps
  extends ViewProps,
    VariantProps<typeof inputGroupAddonVariants> {
  className?: string;
}

const InputGroupAddon = React.forwardRef<View, InputGroupAddonProps>(
  ({ className, align, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
    />
  ),
);
InputGroupAddon.displayName = "InputGroupAddon";

const InputGroupText = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
InputGroupText.displayName = "InputGroupText";

const InputGroupInput = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, children, ...props }, ref) => (
    <View ref={ref} className={cn("flex-1 px-2", className)} {...props}>
      {children}
    </View>
  ),
);
InputGroupInput.displayName = "InputGroupInput";

const InputGroupButton = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row items-center", className)}
      {...props}
    >
      {children}
    </View>
  ),
);
InputGroupButton.displayName = "InputGroupButton";

export {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupButton,
};
