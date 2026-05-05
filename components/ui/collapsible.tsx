import * as React from "react";
import { Pressable, View, type PressableProps, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(
  null,
);

function useCollapsibleContext() {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx)
    throw new Error("Collapsible subcomponents must be used within <Collapsible>");
  return ctx;
}

export interface CollapsibleProps extends ViewProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const Collapsible = React.forwardRef<View, CollapsibleProps>(
  ({ className, open, defaultOpen, onOpenChange, children, ...props }, ref) => {
    const [internal, setInternal] = React.useState(!!defaultOpen);
    const isControlled = open !== undefined;
    const current = isControlled ? !!open : internal;
    const setOpen = React.useCallback(
      (next: boolean) => {
        if (!isControlled) setInternal(next);
        onOpenChange?.(next);
      },
      [isControlled, onOpenChange],
    );
    return (
      <CollapsibleContext.Provider value={{ open: current, setOpen }}>
        <View ref={ref} className={cn(className)} {...props}>
          {children}
        </View>
      </CollapsibleContext.Provider>
    );
  },
);
Collapsible.displayName = "Collapsible";

export interface CollapsibleTriggerProps
  extends Omit<PressableProps, "onPress"> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  CollapsibleTriggerProps
>(({ asChild, children, ...props }, ref) => {
  const ctx = useCollapsibleContext();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onPress?: () => void }>, {
      onPress: () => ctx.setOpen(!ctx.open),
    });
  }
  return (
    <Pressable
      ref={ref}
      onPress={() => ctx.setOpen(!ctx.open)}
      accessibilityRole="button"
      accessibilityState={{ expanded: ctx.open }}
      {...props}
    >
      {children}
    </Pressable>
  );
});
CollapsibleTrigger.displayName = "CollapsibleTrigger";

const CollapsibleContent = React.forwardRef<
  View,
  ViewProps & { className?: string }
>(({ className, children, ...props }, ref) => {
  const ctx = useCollapsibleContext();
  if (!ctx.open) return null;
  return (
    <View ref={ref} className={cn(className)} {...props}>
      {children}
    </View>
  );
});
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
