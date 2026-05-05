import * as React from "react";
import { View, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";

export interface SeparatorProps extends ViewProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const Separator = React.forwardRef<View, SeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    return (
      <View
        ref={ref}
        accessibilityRole="none"
        className={cn(
          "bg-border shrink-0",
          orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
          className,
        )}
        {...props}
      />
    );
  },
);
Separator.displayName = "Separator";

export { Separator };
