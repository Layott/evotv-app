import * as React from "react";
import {
  Pressable,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "react-native";
import { ChevronDown } from "lucide-react-native";

import { cn } from "@/lib/utils";

interface AccordionContextValue {
  type: "single" | "multiple";
  value: string | string[];
  onValueChange: (value: string) => void;
  collapsible: boolean;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null,
);

function useAccordionContext() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion subcomponents must be used within <Accordion>");
  return ctx;
}

interface AccordionItemContextValue {
  value: string;
  open: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(
  null,
);

export interface AccordionSingleProps extends ViewProps {
  type: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  collapsible?: boolean;
  className?: string;
}

export interface AccordionMultipleProps extends ViewProps {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

const Accordion = React.forwardRef<View, AccordionProps>((props, ref) => {
  const { className, type, children, ...rest } = props;
  const isSingle = type === "single";
  const collapsible = isSingle
    ? (props as AccordionSingleProps).collapsible ?? true
    : true;

  const defaultValue = isSingle
    ? (props as AccordionSingleProps).defaultValue ?? ""
    : (props as AccordionMultipleProps).defaultValue ?? [];
  const valueProp = isSingle
    ? (props as AccordionSingleProps).value
    : (props as AccordionMultipleProps).value;

  const [internal, setInternal] = React.useState<string | string[]>(
    defaultValue,
  );
  const isControlled = valueProp !== undefined;
  const current = isControlled ? (valueProp as string | string[]) : internal;

  const handleChange = React.useCallback(
    (next: string) => {
      if (isSingle) {
        const newValue = current === next && collapsible ? "" : next;
        if (!isControlled) setInternal(newValue);
        (props as AccordionSingleProps).onValueChange?.(newValue);
      } else {
        const arr = Array.isArray(current) ? current : [];
        const newArr = arr.includes(next)
          ? arr.filter((v) => v !== next)
          : [...arr, next];
        if (!isControlled) setInternal(newArr);
        (props as AccordionMultipleProps).onValueChange?.(newArr);
      }
    },
    [collapsible, current, isControlled, isSingle, props],
  );

  return (
    <AccordionContext.Provider
      value={{ type, value: current, onValueChange: handleChange, collapsible }}
    >
      <View ref={ref} className={cn(className)} {...(rest as ViewProps)}>
        {children}
      </View>
    </AccordionContext.Provider>
  );
});
Accordion.displayName = "Accordion";

export interface AccordionItemProps extends ViewProps {
  value: string;
  className?: string;
}

const AccordionItem = React.forwardRef<View, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const ctx = useAccordionContext();
    const open = Array.isArray(ctx.value)
      ? ctx.value.includes(value)
      : ctx.value === value;
    return (
      <AccordionItemContext.Provider value={{ value, open }}>
        <View
          ref={ref}
          className={cn("border-b border-border", className)}
          {...props}
        >
          {children}
        </View>
      </AccordionItemContext.Provider>
    );
  },
);
AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps extends Omit<PressableProps, "children"> {
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  AccordionTriggerProps
>(({ className, textClassName, children, ...props }, ref) => {
  const ctx = useAccordionContext();
  const item = React.useContext(AccordionItemContext);
  if (!item) throw new Error("AccordionTrigger must be inside <AccordionItem>");

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ expanded: item.open }}
      onPress={() => ctx.onValueChange(item.value)}
      className={cn(
        "flex-row items-center justify-between gap-2 py-4",
        className,
      )}
      {...props}
    >
      <View className="flex-1">
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
      </View>
      <View
        style={{
          transform: [{ rotate: item.open ? "180deg" : "0deg" }],
        }}
      >
        <ChevronDown size={16} color="#A3A3A3" />
      </View>
    </Pressable>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

export interface AccordionContentProps extends ViewProps {
  className?: string;
  textClassName?: string;
}

const AccordionContent = React.forwardRef<View, AccordionContentProps>(
  ({ className, textClassName, children, ...props }, ref) => {
    const item = React.useContext(AccordionItemContext);
    if (!item || !item.open) return null;
    return (
      <View ref={ref} className={cn("pb-4", className)} {...props}>
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
      </View>
    );
  },
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
