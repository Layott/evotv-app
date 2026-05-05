import * as React from "react";
import {
  Pressable,
  Text,
  View,
  type PressableProps,
  type ViewProps,
} from "react-native";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react-native";

import { cn } from "@/lib/utils";

const Pagination = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="none"
      className={cn("flex-row items-center justify-center", className)}
      {...props}
    />
  ),
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row items-center gap-1", className)}
      {...props}
    />
  ),
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn(className)} {...props} />
  ),
);
PaginationItem.displayName = "PaginationItem";

export interface PaginationLinkProps extends Omit<PressableProps, "children"> {
  isActive?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const PaginationLink = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  PaginationLinkProps
>(({ className, textClassName, isActive, size = "icon", children, ...props }, ref) => (
  <Pressable
    ref={ref}
    accessibilityRole="link"
    accessibilityState={{ selected: !!isActive }}
    className={cn(
      "h-9 min-w-9 items-center justify-center rounded-md px-2",
      isActive && "border border-input bg-background",
      className,
    )}
    {...props}
  >
    {React.Children.map(children, (child) => {
      if (typeof child === "string" || typeof child === "number") {
        return (
          <Text
            className={cn(
              "text-sm font-medium text-foreground",
              textClassName,
            )}
          >
            {child}
          </Text>
        );
      }
      return child;
    })}
  </Pressable>
));
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  PaginationLinkProps
>(({ className, ...props }, ref) => (
  <PaginationLink
    ref={ref}
    accessibilityLabel="Go to previous page"
    className={cn("gap-1 px-2.5", className)}
    {...props}
  >
    <ChevronLeft size={16} color="#FAFAFA" />
    <Text className="text-sm font-medium text-foreground">Previous</Text>
  </PaginationLink>
));
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  PaginationLinkProps
>(({ className, ...props }, ref) => (
  <PaginationLink
    ref={ref}
    accessibilityLabel="Go to next page"
    className={cn("gap-1 px-2.5", className)}
    {...props}
  >
    <Text className="text-sm font-medium text-foreground">Next</Text>
    <ChevronRight size={16} color="#FAFAFA" />
  </PaginationLink>
));
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityElementsHidden
      className={cn("h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal size={16} color="#A3A3A3" />
    </View>
  ),
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
