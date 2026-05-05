import * as React from "react";
import { View, type ViewProps } from "react-native";

import { Stub } from "@/components/ui/_stub";
import { cn } from "@/lib/utils";

export const NavigationMenu = ({
  className,
  children,
  ...props
}: ViewProps & { className?: string }) => (
  <View className={cn("flex-row gap-1", className)} {...props}>
    {children}
  </View>
);

const NavigationMenuList: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn("flex-row gap-1", className)}>{children}</View>;

const NavigationMenuItem: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);
const NavigationMenuTrigger: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Stub name="NavigationMenuTrigger">{children}</Stub>
);
const NavigationMenuContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Stub name="NavigationMenuContent">{children}</Stub>
);
const NavigationMenuLink: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);
const NavigationMenuViewport: React.FC = () => null;
const NavigationMenuIndicator: React.FC = () => null;
const navigationMenuTriggerStyle = () => "";

export {
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuIndicator,
  navigationMenuTriggerStyle,
};
