import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { Switch as RNSwitch, type SwitchProps as RNSwitchProps } from "react-native";

import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<RNSwitchProps, "value" | "onValueChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

const Switch = React.forwardRef<RNSwitch, SwitchProps>(
  ({ checked, onCheckedChange, disabled, className, ...props }, ref) => {
    const palette = useTokens();
    return (
      <RNSwitch
        ref={ref}
        value={checked}
        onValueChange={onCheckedChange}
        disabled={disabled}
        trackColor={{ false: palette.subtle, true: palette.brand }}
        thumbColor={checked ? palette.fg : palette.muted}
        ios_backgroundColor={palette.subtle}
        className={cn(disabled ? "opacity-50" : "", className)}
        {...props}
      />
    );
  },
);
Switch.displayName = "Switch";

export { Switch };
