import * as React from "react";
import { Text, View, type TextProps, type ViewProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const Empty = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex-1 items-center justify-center gap-6 rounded-lg border border-dashed border-border p-6",
        className,
      )}
      {...props}
    />
  ),
);
Empty.displayName = "Empty";

const EmptyHeader = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("max-w-sm items-center gap-2", className)}
      {...props}
    />
  ),
);
EmptyHeader.displayName = "EmptyHeader";

const emptyMediaVariants = cva("items-center justify-center mb-2", {
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "h-10 w-10 rounded-lg bg-muted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface EmptyMediaProps
  extends ViewProps,
    VariantProps<typeof emptyMediaVariants> {
  className?: string;
}

const EmptyMedia = React.forwardRef<View, EmptyMediaProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <View
      ref={ref}
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    />
  ),
);
EmptyMedia.displayName = "EmptyMedia";

const EmptyTitle = React.forwardRef<Text, TextProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "text-foreground text-lg font-medium tracking-tight text-center",
        className,
      )}
      {...props}
    />
  ),
);
EmptyTitle.displayName = "EmptyTitle";

const EmptyDescription = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn(
      "text-muted-foreground text-sm leading-relaxed text-center",
      className,
    )}
    {...props}
  />
));
EmptyDescription.displayName = "EmptyDescription";

const EmptyContent = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("w-full max-w-sm items-center gap-4", className)}
      {...props}
    />
  ),
);
EmptyContent.displayName = "EmptyContent";

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};
