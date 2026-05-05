import * as React from "react";
import { Pressable, type PressableProps } from "react-native";
import { Check } from "lucide-react-native";

import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<PressableProps, "children"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  iconClassName?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  CheckboxProps
>(
  (
    {
      className,
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [internal, setInternal] = React.useState(!!defaultChecked);
    const isControlled = checked !== undefined;
    const current = isControlled ? !!checked : internal;

    const handlePress = () => {
      const next = !current;
      if (!isControlled) setInternal(next);
      onCheckedChange?.(next);
    };

    return (
      <Pressable
        ref={ref}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: current, disabled: !!disabled }}
        disabled={disabled}
        onPress={handlePress}
        className={cn(
          "h-4 w-4 shrink-0 rounded-[4px] border border-input items-center justify-center",
          current && "bg-brand border-brand",
          disabled && "opacity-50",
          className,
        )}
        {...props}
      >
        {current ? <Check size={14} color="#000000" /> : null}
      </Pressable>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
