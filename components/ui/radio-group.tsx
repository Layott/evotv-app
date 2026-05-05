import * as React from "react";
import { Pressable, View, type PressableProps, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
);

function useRadioGroupContext() {
  const ctx = React.useContext(RadioGroupContext);
  if (!ctx)
    throw new Error("RadioGroupItem must be used within <RadioGroup>");
  return ctx;
}

export interface RadioGroupProps extends ViewProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const RadioGroup = React.forwardRef<View, RadioGroupProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const [internal, setInternal] = React.useState(defaultValue ?? "");
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
      <RadioGroupContext.Provider
        value={{ value: current ?? "", onValueChange: handleChange, disabled }}
      >
        <View ref={ref} className={cn("gap-3", className)} {...props}>
          {children}
        </View>
      </RadioGroupContext.Provider>
    );
  },
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps extends Omit<PressableProps, "children"> {
  value: string;
  className?: string;
  indicatorClassName?: string;
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  RadioGroupItemProps
>(({ className, indicatorClassName, value, disabled, ...props }, ref) => {
  const ctx = useRadioGroupContext();
  const checked = ctx.value === value;
  const isDisabled = disabled ?? ctx.disabled;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled: !!isDisabled }}
      disabled={isDisabled}
      onPress={() => ctx.onValueChange(value)}
      className={cn(
        "h-4 w-4 rounded-full border border-input items-center justify-center",
        isDisabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {checked ? (
        <View
          className={cn("h-2 w-2 rounded-full bg-brand", indicatorClassName)}
        />
      ) : null}
    </Pressable>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
