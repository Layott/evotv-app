import * as React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "react-native";
import { ChevronRight, MoreHorizontal } from "lucide-react-native";

import { cn } from "@/lib/utils";

const Breadcrumb = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityLabel="breadcrumb"
      className={cn(className)}
      {...props}
    />
  ),
);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<
  ScrollView,
  ViewProps & { className?: string; contentClassName?: string }
>(({ className, contentClassName, children, ...props }, ref) => (
  <ScrollView
    ref={ref}
    horizontal
    showsHorizontalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 6 }}
    className={cn("flex-row", className)}
    {...(props as object)}
  >
    {children}
  </ScrollView>
));
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row items-center gap-1.5", className)}
      {...props}
    />
  ),
);
BreadcrumbItem.displayName = "BreadcrumbItem";

export interface BreadcrumbLinkProps extends Omit<PressableProps, "children"> {
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const BreadcrumbLink = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  BreadcrumbLinkProps
>(({ className, textClassName, children, ...props }, ref) => (
  <Pressable
    ref={ref}
    accessibilityRole="link"
    className={cn(className)}
    {...props}
  >
    {React.Children.map(children, (child) => {
      if (typeof child === "string" || typeof child === "number") {
        return (
          <Text
            className={cn("text-sm text-muted-foreground", textClassName)}
          >
            {child}
          </Text>
        );
      }
      return child;
    })}
  </Pressable>
));
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    accessibilityRole="text"
    accessibilityState={{ disabled: true }}
    className={cn("text-sm text-foreground", className)}
    {...props}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = React.forwardRef<
  View,
  ViewProps & { className?: string }
>(({ className, children, ...props }, ref) => (
  <View
    ref={ref}
    accessibilityElementsHidden
    className={cn("flex-row items-center", className)}
    {...props}
  >
    {children ?? <ChevronRight size={14} color="#A3A3A3" />}
  </View>
));
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = React.forwardRef<
  View,
  ViewProps & { className?: string }
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    accessibilityElementsHidden
    className={cn("h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal size={16} color="#A3A3A3" />
  </View>
));
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
