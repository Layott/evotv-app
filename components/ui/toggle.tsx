import * as React from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-md",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const toggleTextVariants = cva("text-sm font-medium", {
  variants: {
    pressed: {
      true: "text-accent-foreground",
      false: "text-foreground",
    },
  },
  defaultVariants: { pressed: false },
});

type ToggleVariants = VariantProps<typeof toggleVariants>;

export interface ToggleProps
  extends Omit<PressableProps, "children">,
    ToggleVariants {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ToggleProps
>(
  (
    {
      className,
      textClassName,
      variant,
      size,
      pressed,
      defaultPressed,
      onPressedChange,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const [internal, setInternal] = React.useState(!!defaultPressed);
    const isControlled = pressed !== undefined;
    const current = isControlled ? !!pressed : internal;

    const handlePress = () => {
      const next = !current;
      if (!isControlled) setInternal(next);
      onPressedChange?.(next);
    };

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityState={{ selected: current, disabled: !!disabled }}
        disabled={disabled}
        onPress={handlePress}
        className={cn(
          toggleVariants({ variant, size }),
          current && "bg-accent",
          disabled && "opacity-50",
          className,
        )}
        {...props}
      >
        <View className="flex-row items-center gap-2">
          {React.Children.map(children, (child) => {
            if (typeof child === "string" || typeof child === "number") {
              return (
                <Text
                  className={cn(
                    toggleTextVariants({ pressed: current }),
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
      </Pressable>
    );
  },
);
Toggle.displayName = "Toggle";

export { Toggle, toggleVariants };
