import * as React from "react";
import {
  Pressable,
  Text,
  View,
  type PressableProps,
  type ViewProps,
} from "react-native";

import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs subcomponents must be used within <Tabs>");
  return ctx;
}

export interface TabsProps extends ViewProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const Tabs = React.forwardRef<View, TabsProps>(
  (
    { className, value, defaultValue, onValueChange, children, ...props },
    ref,
  ) => {
    const [internal, setInternal] = React.useState<string>(defaultValue ?? "");
    const isControlled = value !== undefined;
    const current = isControlled ? value : internal;

    const handleChange = React.useCallback(
      (next: string) => {
        if (!isControlled) setInternal(next);
        onValueChange?.(next);
      },
      [isControlled, onValueChange],
    );

    return (
      <TabsContext.Provider
        value={{ value: current ?? "", onValueChange: handleChange }}
      >
        <View
          ref={ref}
          className={cn("flex-col gap-2", className)}
          {...props}
        >
          {children}
        </View>
      </TabsContext.Provider>
    );
  },
);
Tabs.displayName = "Tabs";

export interface TabsListProps extends ViewProps {
  className?: string;
}

const TabsList = React.forwardRef<View, TabsListProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        "flex-row items-center justify-center rounded-lg bg-muted p-[3px] h-9",
        className,
      )}
      {...props}
    />
  ),
);
TabsList.displayName = "TabsList";

export interface TabsTriggerProps extends Omit<PressableProps, "children"> {
  value: string;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  TabsTriggerProps
>(
  (
    { className, textClassName, value, disabled, children, ...props },
    ref,
  ) => {
    const ctx = useTabsContext();
    const active = ctx.value === value;

    return (
      <Pressable
        ref={ref}
        accessibilityRole="tab"
        accessibilityState={{ selected: active, disabled: !!disabled }}
        disabled={disabled}
        onPress={() => ctx.onValueChange(value)}
        className={cn(
          "flex-1 flex-row items-center justify-center gap-1.5 rounded-md px-2 py-1 h-[calc(100%-1px)]",
          active && "bg-background border border-border",
          disabled && "opacity-50",
          className,
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (typeof child === "string" || typeof child === "number") {
            return (
              <Text
                className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
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
    );
  },
);
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps extends ViewProps {
  value: string;
  className?: string;
}

const TabsContent = React.forwardRef<View, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = useTabsContext();
    if (ctx.value !== value) return null;
    return <View ref={ref} className={cn("flex-1", className)} {...props} />;
  },
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
