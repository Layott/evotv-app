import * as React from "react";
import { Text, View, type ViewProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "flex-row items-center justify-center rounded-md border px-2 py-0.5 self-start",
  {
    variants: {
      variant: {
        default: "bg-primary border-transparent",
        secondary: "bg-secondary border-transparent",
        destructive: "bg-destructive border-transparent",
        outline: "bg-transparent border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const badgeTextVariants = cva("text-xs font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-white",
      outline: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type BadgeVariants = VariantProps<typeof badgeVariants>;

export interface BadgeProps
  extends Omit<ViewProps, "children">,
    BadgeVariants {
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const Badge = React.forwardRef<View, BadgeProps>(
  ({ className, textClassName, variant, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (typeof child === "string" || typeof child === "number") {
            return (
              <Text
                className={cn(badgeTextVariants({ variant }), textClassName)}
              >
                {child}
              </Text>
            );
          }
          return child;
        })}
      </View>
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants, badgeTextVariants };
