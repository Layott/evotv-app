import * as React from "react";
import { Text, View, type TextProps, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const FieldSet = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("flex-col gap-6", className)} {...props} />
  ),
);
FieldSet.displayName = "FieldSet";

export interface FieldLegendProps extends TextProps {
  variant?: "legend" | "label";
  className?: string;
}

const FieldLegend = React.forwardRef<Text, FieldLegendProps>(
  ({ className, variant = "legend", ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "mb-3 font-medium",
        variant === "legend" ? "text-base" : "text-sm",
        className,
      )}
      {...props}
    />
  ),
);
FieldLegend.displayName = "FieldLegend";

const FieldGroup = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="none"
      className={cn("flex-col gap-4", className)}
      {...props}
    />
  ),
);
FieldGroup.displayName = "FieldGroup";

const Field = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("gap-2", className)} {...props} />
  ),
);
Field.displayName = "Field";

const FieldContent = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("gap-1.5", className)} {...props} />
  ),
);
FieldContent.displayName = "FieldContent";

const FieldLabel = React.forwardRef<
  Text,
  React.ComponentProps<typeof Label> & { className?: string }
>(({ className, ...props }, ref) => (
  <Label ref={ref} className={cn(className)} {...props} />
));
FieldLabel.displayName = "FieldLabel";

const FieldTitle = React.forwardRef<Text, TextProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  ),
);
FieldTitle.displayName = "FieldTitle";

const FieldDescription = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
FieldDescription.displayName = "FieldDescription";

const FieldError = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("text-sm font-medium text-destructive", className)}
    {...props}
  />
));
FieldError.displayName = "FieldError";

const FieldSeparator = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("h-px bg-border", className)} {...props} />
  ),
);
FieldSeparator.displayName = "FieldSeparator";

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  FieldContent,
};
