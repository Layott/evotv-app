import * as React from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary",
        destructive: "bg-destructive",
        outline: "border border-input bg-background",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        link: "bg-transparent",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva("text-sm font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-white",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-primary underline",
    },
    size: {
      default: "text-sm",
      sm: "text-sm",
      lg: "text-sm",
      icon: "text-sm",
      "icon-sm": "text-sm",
      "icon-lg": "text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type ButtonVariants = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends Omit<PressableProps, "children">,
    ButtonVariants {
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      className,
      textClassName,
      variant,
      size,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const renderChildren = (pressed: boolean) => {
      const opacityClass = pressed ? "opacity-80" : "";
      return React.Children.map(children, (child) => {
        if (typeof child === "string" || typeof child === "number") {
          return (
            <Text
              className={cn(
                buttonTextVariants({ variant, size }),
                opacityClass,
                textClassName,
              )}
            >
              {child}
            </Text>
          );
        }
        return child;
      });
    };

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        disabled={disabled}
        className={cn(
          buttonVariants({ variant, size }),
          disabled && "opacity-50",
          className,
        )}
        {...props}
      >
        {({ pressed }) => (
          <View
            className={cn(
              "flex-row items-center justify-center gap-2",
              pressed && "opacity-80",
            )}
          >
            {renderChildren(pressed)}
          </View>
        )}
      </Pressable>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants, buttonTextVariants };
