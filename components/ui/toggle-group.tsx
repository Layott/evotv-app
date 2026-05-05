import * as React from "react";
import { Pressable, Text, View, type PressableProps, type ViewProps } from "react-native";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

type ToggleVariants = VariantProps<typeof toggleVariants>;

interface ToggleGroupContextValue extends ToggleVariants {
  type: "single" | "multiple";
  value: string | string[];
  onValueChange: (value: string) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  type: "single",
  value: "",
  onValueChange: () => {},
  size: "default",
  variant: "default",
});

export interface ToggleGroupSingleProps extends ViewProps, ToggleVariants {
  type: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export interface ToggleGroupMultipleProps extends ViewProps, ToggleVariants {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
}

export type ToggleGroupProps =
  | ToggleGroupSingleProps
  | ToggleGroupMultipleProps;

const ToggleGroup = React.forwardRef<View, ToggleGroupProps>(
  (props, ref) => {
    const {
      className,
      variant,
      size,
      children,
      type,
      ...rest
    } = props;

    const isSingle = type === "single";
    const defaultValue = isSingle
      ? (props as ToggleGroupSingleProps).defaultValue ?? ""
      : (props as ToggleGroupMultipleProps).defaultValue ?? [];
    const valueProp = isSingle
      ? (props as ToggleGroupSingleProps).value
      : (props as ToggleGroupMultipleProps).value;

    const [internal, setInternal] = React.useState<string | string[]>(
      defaultValue,
    );
    const isControlled = valueProp !== undefined;
    const current = isControlled ? (valueProp as string | string[]) : internal;

    const handleChange = React.useCallback(
      (next: string) => {
        if (isSingle) {
          const newValue = current === next ? "" : next;
          if (!isControlled) setInternal(newValue);
          (props as ToggleGroupSingleProps).onValueChange?.(newValue);
        } else {
          const arr = Array.isArray(current) ? current : [];
          const newArr = arr.includes(next)
            ? arr.filter((v) => v !== next)
            : [...arr, next];
          if (!isControlled) setInternal(newArr);
          (props as ToggleGroupMultipleProps).onValueChange?.(newArr);
        }
      },
      [current, isControlled, isSingle, props],
    );

    return (
      <ToggleGroupContext.Provider
        value={{
          type,
          value: current,
          onValueChange: handleChange,
          variant,
          size,
        }}
      >
        <View
          ref={ref}
          className={cn("flex-row items-center rounded-md", className)}
          {...(rest as ViewProps)}
        >
          {children}
        </View>
      </ToggleGroupContext.Provider>
    );
  },
);
ToggleGroup.displayName = "ToggleGroup";

export interface ToggleGroupItemProps
  extends Omit<PressableProps, "children" | "value">,
    ToggleVariants {
  value: string;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ToggleGroupItemProps
>(
  (
    {
      className,
      textClassName,
      value,
      variant,
      size,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const ctx = React.useContext(ToggleGroupContext);
    const active = Array.isArray(ctx.value)
      ? ctx.value.includes(value)
      : ctx.value === value;
    const v = ctx.variant ?? variant;
    const s = ctx.size ?? size;

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityState={{ selected: active, disabled: !!disabled }}
        disabled={disabled}
        onPress={() => ctx.onValueChange(value)}
        className={cn(
          toggleVariants({ variant: v, size: s }),
          "flex-1 rounded-none first:rounded-l-md last:rounded-r-md",
          v === "outline" && "border-l-0 first:border-l",
          active && "bg-accent",
          disabled && "opacity-50",
          className,
        )}
        {...props}
      >
        <View className="flex-row items-center gap-2">
          {React.Children.map(children, (child) => {
            if (typeof child === "string" || typeof child === "number") {
              return (
                <Text
                  className={cn(
                    "text-sm font-medium",
                    active ? "text-accent-foreground" : "text-foreground",
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
      </Pressable>
    );
  },
);
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
