import * as React from "react";
import { View, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";

export interface AspectRatioProps extends ViewProps {
  ratio?: number;
  className?: string;
}

const AspectRatio = React.forwardRef<View, AspectRatioProps>(
  ({ className, ratio = 1, style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[{ aspectRatio: ratio, width: "100%" }, style]}
        className={cn(className)}
        {...props}
      />
    );
  },
);
AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
