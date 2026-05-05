import * as React from "react";
import { ActivityIndicator, type ActivityIndicatorProps } from "react-native";

import { cn } from "@/lib/utils";

export interface SpinnerProps extends ActivityIndicatorProps {
  className?: string;
}

const Spinner = React.forwardRef<ActivityIndicator, SpinnerProps>(
  ({ className, color = "#2CD7E3", size = "small", ...props }, ref) => {
    return (
      <ActivityIndicator
        ref={ref}
        color={color}
        size={size}
        accessibilityLabel="Loading"
        className={cn(className)}
        {...props}
      />
    );
  },
);
Spinner.displayName = "Spinner";

export { Spinner };
