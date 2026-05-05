import * as React from "react";
import { View, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";

export interface ProgressProps extends ViewProps {
  value?: number;
  className?: string;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<View, ProgressProps>(
  ({ className, indicatorClassName, value = 0, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));

    return (
      <View
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          className,
        )}
        {...props}
      >
        <View
          className={cn("h-full rounded-full bg-brand", indicatorClassName)}
          style={{ width: `${clamped}%` }}
        />
      </View>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
