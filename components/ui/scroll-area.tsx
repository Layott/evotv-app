import * as React from "react";
import { ScrollView, type ScrollViewProps } from "react-native";

import { cn } from "@/lib/utils";

export interface ScrollAreaProps extends ScrollViewProps {
  className?: string;
  contentClassName?: string;
}

const ScrollArea = React.forwardRef<ScrollView, ScrollAreaProps>(
  ({ className, contentClassName, contentContainerStyle, children, ...props }, ref) => {
    return (
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        className={cn("flex-1", className)}
        contentContainerStyle={contentContainerStyle}
        {...props}
      >
        {children}
      </ScrollView>
    );
  },
);
ScrollArea.displayName = "ScrollArea";

const ScrollBar: React.FC<{ orientation?: "vertical" | "horizontal" }> = () => null;

export { ScrollArea, ScrollBar };
