import * as React from "react";
import { View, type ViewProps } from "react-native";

import { Stub } from "@/components/ui/_stub";
import { cn } from "@/lib/utils";

export const ResizablePanelGroup: React.FC<
  ViewProps & { className?: string; direction?: "horizontal" | "vertical" }
> = ({ className, direction = "horizontal", children, ...props }) => (
  <View
    className={cn(
      direction === "horizontal" ? "flex-row" : "flex-col",
      className,
    )}
    {...props}
  >
    {children}
  </View>
);

export const ResizablePanel: React.FC<
  ViewProps & { className?: string; defaultSize?: number; minSize?: number; maxSize?: number }
> = ({ className, children, ...props }) => (
  <View className={cn("flex-1", className)} {...props}>
    {children}
  </View>
);

export const ResizableHandle: React.FC<{ className?: string; withHandle?: boolean }> = (props) => (
  <Stub name="ResizableHandle" {...props} />
);
