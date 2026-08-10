import * as React from "react";
import { Switch as RNSwitch, type SwitchProps as RNSwitchProps } from "react-native";

import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<RNSwitchProps, "value" | "onValueChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

const Switch = React.forwardRef<RNSwitch, SwitchProps>(
  ({ checked, onCheckedChange, disabled, className, ...props }, ref) => {
    return (
      <RNSwitch
        ref={ref}
        value={checked}
        onValueChange={onCheckedChange}
        disabled={disabled}
        trackColor={{ false: "#103133", true: "#46E3CE" }}
        thumbColor={checked ? "#EAF6F5" : "#9FBDBD"}
        ios_backgroundColor="#103133"
        className={cn(disabled ? "opacity-50" : "", className)}
        {...props}
      />
    );
  },
);
Switch.displayName = "Switch";

export { Switch };
