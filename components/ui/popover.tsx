import * as React from "react";
import {
  Modal,
  Pressable,
  View,
  type PressableProps,
  type ViewProps,
} from "react-native";

import { cn } from "@/lib/utils";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error("Popover subcomponents must be used within <Popover>");
  return ctx;
}

export interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Popover({ open, defaultOpen, onOpenChange, children }: PopoverProps) {
  const [internal, setInternal] = React.useState(!!defaultOpen);
  const isControlled = open !== undefined;
  const current = isControlled ? open : internal;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  return (
    <PopoverContext.Provider value={{ open: current, setOpen }}>
      {children}
    </PopoverContext.Provider>
  );
}

export interface PopoverTriggerProps extends Omit<PressableProps, "onPress"> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  PopoverTriggerProps
>(({ asChild, children, ...props }, ref) => {
  const ctx = usePopoverContext();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onPress?: () => void }>, {
      onPress: () => ctx.setOpen(true),
    });
  }
  return (
    <Pressable ref={ref} onPress={() => ctx.setOpen(true)} {...props}>
      {children}
    </Pressable>
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

export interface PopoverContentProps extends ViewProps {
  className?: string;
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

const PopoverContent = React.forwardRef<View, PopoverContentProps>(
  ({ className, align = "center", children, ...props }, ref) => {
    const ctx = usePopoverContext();
    const alignClass =
      align === "start"
        ? "items-start pl-4"
        : align === "end"
          ? "items-end pr-4"
          : "items-center";
    return (
      <Modal
        visible={ctx.open}
        transparent
        animationType="fade"
        onRequestClose={() => ctx.setOpen(false)}
      >
        <Pressable
          accessibilityLabel="Close popover"
          onPress={() => ctx.setOpen(false)}
          className={cn("flex-1 pt-12", alignClass)}
        >
          <Pressable
            ref={ref as React.Ref<View>}
            onPress={(e) => e.stopPropagation()}
            className={cn(
              "w-72 rounded-md border border-border bg-popover p-4",
              className,
            )}
            {...props}
          >
            {children}
          </Pressable>
        </Pressable>
      </Modal>
    );
  },
);
PopoverContent.displayName = "PopoverContent";

const PopoverAnchor: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
