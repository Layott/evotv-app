import * as React from "react";
import {
  Pressable,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const ItemGroup = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="list"
      className={cn("flex-col", className)}
      {...props}
    />
  ),
);
ItemGroup.displayName = "ItemGroup";

const ItemSeparator = React.forwardRef<
  View,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => (
  <Separator
    ref={ref}
    orientation="horizontal"
    className={cn("my-0", className)}
    {...props}
  />
));
ItemSeparator.displayName = "ItemSeparator";

const itemVariants = cva(
  "flex-row items-center rounded-md border border-transparent",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border",
        muted: "bg-muted/50",
      },
      size: {
        default: "p-4 gap-4",
        sm: "py-3 px-4 gap-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ItemProps
  extends Omit<PressableProps, "children">,
    VariantProps<typeof itemVariants> {
  className?: string;
  children?: React.ReactNode;
}

const Item = React.forwardRef<React.ElementRef<typeof Pressable>, ItemProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      className={cn(itemVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Pressable>
  ),
);
Item.displayName = "Item";

const ItemMedia = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("shrink-0", className)} {...props} />
  ),
);
ItemMedia.displayName = "ItemMedia";

const ItemContent = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("flex-1 gap-1", className)} {...props} />
  ),
);
ItemContent.displayName = "ItemContent";

const ItemTitle = React.forwardRef<Text, TextProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  ),
);
ItemTitle.displayName = "ItemTitle";

const ItemDescription = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ItemDescription.displayName = "ItemDescription";

const ItemActions = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row items-center gap-2", className)}
      {...props}
    />
  ),
);
ItemActions.displayName = "ItemActions";

const ItemHeader = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row items-center", className)}
      {...props}
    />
  ),
);
ItemHeader.displayName = "ItemHeader";

const ItemFooter = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row items-center", className)}
      {...props}
    />
  ),
);
ItemFooter.displayName = "ItemFooter";

export {
  Item,
  ItemGroup,
  ItemSeparator,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemHeader,
  ItemFooter,
  itemVariants,
};
