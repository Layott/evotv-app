import * as React from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  type ModalProps,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "react-native";

import { cn } from "@/lib/utils";

interface AlertDialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(
  null,
);

function useAlertDialogContext() {
  const ctx = React.useContext(AlertDialogContext);
  if (!ctx)
    throw new Error(
      "AlertDialog subcomponents must be used within <AlertDialog>",
    );
  return ctx;
}

export interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function AlertDialog({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: AlertDialogProps) {
  const [internal, setInternal] = React.useState(!!defaultOpen);
  const isControlled = open !== undefined;
  const current = isControlled ? open : internal;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  return (
    <AlertDialogContext.Provider value={{ open: current, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

export interface AlertDialogTriggerProps extends Omit<PressableProps, "onPress"> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const AlertDialogTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  AlertDialogTriggerProps
>(({ asChild, children, ...props }, ref) => {
  const ctx = useAlertDialogContext();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onPress?: () => void }>, {
      onPress: () => ctx.setOpen(true),
    });
  }
  return (
    <Pressable ref={ref} onPress={() => ctx.setOpen(true)} {...props}>
      {children}
    </Pressable>
  );
});
AlertDialogTrigger.displayName = "AlertDialogTrigger";

export interface AlertDialogContentProps
  extends Omit<ModalProps, "visible" | "onRequestClose" | "transparent"> {
  className?: string;
  children?: React.ReactNode;
  overlayClassName?: string;
}

const AlertDialogContent = React.forwardRef<View, AlertDialogContentProps>(
  ({ className, overlayClassName, children, ...props }, ref) => {
    const ctx = useAlertDialogContext();
    return (
      <Modal
        visible={ctx.open}
        transparent
        animationType="fade"
        onRequestClose={() => ctx.setOpen(false)}
        {...props}
      >
        <View
          className={cn(
            "flex-1 bg-black/50 items-center justify-center px-4",
            overlayClassName,
          )}
        >
          <View
            ref={ref}
            className={cn(
              "w-full max-w-lg gap-4 rounded-lg border border-border bg-background p-6",
              className,
            )}
          >
            {children}
          </View>
        </View>
      </Modal>
    );
  },
);
AlertDialogContent.displayName = "AlertDialogContent";

const AlertDialogHeader = React.forwardRef<
  View,
  ViewProps & { className?: string }
>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn("gap-2", className)} {...props} />
));
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = React.forwardRef<
  View,
  ViewProps & { className?: string }
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("flex-row justify-end gap-2", className)}
    {...props}
  />
));
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
AlertDialogDescription.displayName = "AlertDialogDescription";

export interface AlertDialogActionProps
  extends Omit<PressableProps, "children"> {
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  AlertDialogActionProps
>(({ className, textClassName, onPress, children, ...props }, ref) => {
  const ctx = useAlertDialogContext();
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      onPress={(e) => {
        onPress?.(e);
        ctx.setOpen(false);
      }}
      className={cn(
        "h-9 flex-row items-center justify-center rounded-md bg-primary px-4",
        className,
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (typeof child === "string" || typeof child === "number") {
          return (
            <Text
              className={cn(
                "text-sm font-medium text-primary-foreground",
                textClassName,
              )}
            >
              {child}
            </Text>
          );
        }
        return child;
      })}
    </Pressable>
  );
});
AlertDialogAction.displayName = "AlertDialogAction";

export interface AlertDialogCancelProps
  extends Omit<PressableProps, "children"> {
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  AlertDialogCancelProps
>(({ className, textClassName, onPress, children, ...props }, ref) => {
  const ctx = useAlertDialogContext();
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      onPress={(e) => {
        onPress?.(e);
        ctx.setOpen(false);
      }}
      className={cn(
        "h-9 flex-row items-center justify-center rounded-md border border-input bg-background px-4",
        className,
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (typeof child === "string" || typeof child === "number") {
          return (
            <Text
              className={cn(
                "text-sm font-medium text-foreground",
                textClassName,
              )}
            >
              {child}
            </Text>
          );
        }
        return child;
      })}
    </Pressable>
  );
});
AlertDialogCancel.displayName = "AlertDialogCancel";

const AlertDialogPortal: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>;
const AlertDialogOverlay: React.FC<{ className?: string }> = () => null;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
