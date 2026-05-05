import * as React from "react";
import { View, type ViewProps } from "react-native";

import { Stub } from "@/components/ui/_stub";
import { cn } from "@/lib/utils";

export const Menubar = ({ className, children, ...props }: ViewProps & { className?: string }) => (
  <View className={cn("flex-row gap-1", className)} {...props}>
    {children}
  </View>
);

const MenubarMenu: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const MenubarTrigger: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Stub name="MenubarTrigger">{children}</Stub>
);
const MenubarContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Stub name="MenubarContent">{children}</Stub>
);
const MenubarItem: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Stub name="MenubarItem">{children}</Stub>
);
const MenubarSeparator: React.FC = () => null;
const MenubarLabel: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const MenubarShortcut: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const MenubarGroup: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const MenubarPortal: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const MenubarSub: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const MenubarSubTrigger: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Stub name="MenubarSubTrigger">{children}</Stub>
);
const MenubarSubContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Stub name="MenubarSubContent">{children}</Stub>
);
const MenubarCheckboxItem: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Stub name="MenubarCheckboxItem">{children}</Stub>
);
const MenubarRadioGroup: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const MenubarRadioItem: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Stub name="MenubarRadioItem">{children}</Stub>
);

export {
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarShortcut,
  MenubarGroup,
  MenubarPortal,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
};
