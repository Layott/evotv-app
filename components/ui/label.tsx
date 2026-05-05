import * as React from "react";
import { Text, type TextProps } from "react-native";

import { cn } from "@/lib/utils";

export interface LabelProps extends TextProps {
  className?: string;
}

const Label = React.forwardRef<Text, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
Label.displayName = "Label";

export { Label };
