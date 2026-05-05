import * as React from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  type PressableProps,
  type ViewProps,
} from "react-native";

import { cn } from "@/lib/utils";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error("Tooltip subcomponents must be used within <Tooltip>");
  return ctx;
}

export interface TooltipProviderProps {
  delayDuration?: number;
  children?: React.ReactNode;
}

function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

export interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Tooltip({ open, defaultOpen, onOpenChange, children }: TooltipProps) {
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
    <TooltipContext.Provider value={{ open: current, setOpen }}>
      {children}
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps extends Omit<PressableProps, "onLongPress"> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  TooltipTriggerProps
>(({ asChild, children, ...props }, ref) => {
  const ctx = useTooltipContext();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{ onLongPress?: () => void }>,
      { onLongPress: () => ctx.setOpen(true) },
    );
  }
  return (
    <Pressable
      ref={ref}
      onLongPress={() => ctx.setOpen(true)}
      delayLongPress={400}
      {...props}
    >
      {children}
    </Pressable>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

export interface TooltipContentProps extends ViewProps {
  className?: string;
  sideOffset?: number;
  textClassName?: string;
}

const TooltipContent = React.forwardRef<View, TooltipContentProps>(
  ({ className, textClassName, children, ...props }, ref) => {
    const ctx = useTooltipContext();
    return (
      <Modal
        visible={ctx.open}
        transparent
        animationType="fade"
        onRequestClose={() => ctx.setOpen(false)}
      >
        <Pressable
          accessibilityLabel="Dismiss tooltip"
          onPress={() => ctx.setOpen(false)}
          className="flex-1 items-center justify-center bg-black/50 px-4"
        >
          <View
            ref={ref}
            className={cn(
              "rounded-md bg-foreground px-3 py-1.5",
              className,
            )}
            {...props}
          >
            {React.Children.map(children, (child) => {
              if (typeof child === "string" || typeof child === "number") {
                return (
                  <Text
                    className={cn("text-xs text-background", textClassName)}
                  >
                    {child}
                  </Text>
                );
              }
              return child;
            })}
          </View>
        </Pressable>
      </Modal>
    );
  },
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
