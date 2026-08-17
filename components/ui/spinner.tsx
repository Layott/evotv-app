import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { ActivityIndicator, type ActivityIndicatorProps } from "react-native";

import { cn } from "@/lib/utils";

export interface SpinnerProps extends ActivityIndicatorProps {
  className?: string;
}

const Spinner = React.forwardRef<ActivityIndicator, SpinnerProps>(
  ({ className, color, size = "small", ...props }, ref) => {
    // Resolved in the body, not as a default parameter: a default cannot call
    // a hook, and the brand colour differs between light and dark.
    const palette = useTokens();
    return (
      <ActivityIndicator
        ref={ref}
        color={color ?? palette.brand}
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
