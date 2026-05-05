import * as React from "react";
import { Text, View, type TextProps, type ViewProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "w-full flex-row gap-3 items-start rounded-lg border px-4 py-3",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        destructive: "bg-card border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface AlertContextValue {
  variant: "default" | "destructive";
}

const AlertContext = React.createContext<AlertContextValue>({
  variant: "default",
});

export interface AlertProps
  extends ViewProps,
    VariantProps<typeof alertVariants> {
  className?: string;
  icon?: React.ReactNode;
}

const Alert = React.forwardRef<View, AlertProps>(
  ({ className, variant = "default", icon, children, ...props }, ref) => {
    return (
      <AlertContext.Provider value={{ variant: variant ?? "default" }}>
        <View
          ref={ref}
          accessibilityRole="alert"
          className={cn(alertVariants({ variant }), className)}
          {...props}
        >
          {icon ? (
            <View className="mt-0.5 shrink-0">{icon}</View>
          ) : null}
          <View className="flex-1 gap-1">{children}</View>
        </View>
      </AlertContext.Provider>
    );
  },
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<Text, TextProps & { className?: string }>(
  ({ className, ...props }, ref) => {
    const { variant } = React.useContext(AlertContext);
    return (
      <Text
        ref={ref}
        className={cn(
          "font-medium tracking-tight",
          variant === "destructive" ? "text-destructive" : "text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => {
  const { variant } = React.useContext(AlertContext);
  return (
    <Text
      ref={ref}
      className={cn(
        "text-sm leading-relaxed",
        variant === "destructive"
          ? "text-destructive opacity-90"
          : "text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
});
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
