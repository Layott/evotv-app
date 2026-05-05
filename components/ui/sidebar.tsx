import * as React from "react";
import { View, type ViewProps } from "react-native";

import { Stub } from "@/components/ui/_stub";
import { cn } from "@/lib/utils";

export const SidebarProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

export const Sidebar: React.FC<ViewProps & { className?: string }> = ({
  children,
  className,
  ...props
}) => (
  <View className={cn(className)} {...props}>
    {children}
  </View>
);

const SidebarTrigger: React.FC<{ className?: string }> = (props) => (
  <Stub name="SidebarTrigger" {...props} />
);
const SidebarRail: React.FC = () => null;
const SidebarInset: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarHeader: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarFooter: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarContent: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarGroup: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarGroupLabel: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarGroupContent: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarGroupAction: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarMenu: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarMenuItem: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarMenuButton: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarMenuAction: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarMenuBadge: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarMenuSkeleton: React.FC<{ className?: string }> = () => (
  <Stub name="SidebarMenuSkeleton" />
);
const SidebarMenuSub: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarMenuSubItem: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarMenuSubButton: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <View className={cn(className)}>{children}</View>;
const SidebarSeparator: React.FC<{ className?: string }> = () => null;
const SidebarInput: React.FC<{ className?: string }> = (props) => (
  <Stub name="SidebarInput" {...props} />
);
const useSidebar = () => ({
  open: false,
  setOpen: (_v: boolean) => {},
  openMobile: false,
  setOpenMobile: (_v: boolean) => {},
  isMobile: true,
  state: "collapsed" as const,
  toggleSidebar: () => {},
});

export {
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  SidebarInput,
  useSidebar,
};
