export {
  Sheet as Drawer,
  SheetTrigger as DrawerTrigger,
  SheetClose as DrawerClose,
  SheetContent as DrawerContent,
  SheetHeader as DrawerHeader,
  SheetFooter as DrawerFooter,
  SheetTitle as DrawerTitle,
  SheetDescription as DrawerDescription,
} from "@/components/ui/sheet";

import * as React from "react";
const DrawerPortal: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);
const DrawerOverlay: React.FC<{ className?: string }> = () => null;

export { DrawerPortal, DrawerOverlay };
