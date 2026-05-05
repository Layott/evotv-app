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
import { X } from "lucide-react-native";

import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog subcomponents must be used within <Dialog>");
  return ctx;
}

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Dialog({ open, defaultOpen, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(!!defaultOpen);
  const isControlled = open !== undefined;
  const current = isControlled ? open : internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <DialogContext.Provider value={{ open: current, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogTriggerProps extends Omit<PressableProps, "onPress"> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  DialogTriggerProps
>(({ asChild, children, ...props }, ref) => {
  const ctx = useDialogContext();
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
DialogTrigger.displayName = "DialogTrigger";

export interface DialogCloseProps extends Omit<PressableProps, "onPress"> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const DialogClose = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  DialogCloseProps
>(({ asChild, children, ...props }, ref) => {
  const ctx = useDialogContext();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onPress?: () => void }>, {
      onPress: () => ctx.setOpen(false),
    });
  }
  return (
    <Pressable ref={ref} onPress={() => ctx.setOpen(false)} {...props}>
      {children}
    </Pressable>
  );
});
DialogClose.displayName = "DialogClose";

export interface DialogContentProps
  extends Omit<ModalProps, "visible" | "onRequestClose" | "transparent"> {
  className?: string;
  showCloseButton?: boolean;
  children?: React.ReactNode;
  overlayClassName?: string;
}

const DialogContent = React.forwardRef<View, DialogContentProps>(
  (
    { className, showCloseButton = true, overlayClassName, children, ...props },
    ref,
  ) => {
    const ctx = useDialogContext();
    return (
      <Modal
        visible={ctx.open}
        transparent
        animationType="fade"
        onRequestClose={() => ctx.setOpen(false)}
        {...props}
      >
        <Pressable
          accessibilityLabel="Close dialog"
          onPress={() => ctx.setOpen(false)}
          className={cn(
            "flex-1 bg-black/50 items-center justify-center px-4",
            overlayClassName,
          )}
        >
          <Pressable
            ref={ref as React.Ref<View>}
            onPress={(e) => e.stopPropagation()}
            className={cn(
              "w-full max-w-lg gap-4 rounded-lg border border-border bg-background p-6",
              className,
            )}
          >
            {children}
            {showCloseButton ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => ctx.setOpen(false)}
                className="absolute top-4 right-4"
                hitSlop={8}
              >
                <X size={16} color="#FAFAFA" />
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    );
  },
);
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("gap-2", className)} {...props} />
  ),
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row justify-end gap-2", className)}
      {...props}
    />
  ),
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<Text, TextProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none text-foreground",
        className,
      )}
      {...props}
    />
  ),
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogPortal: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);
const DialogOverlay: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
}) => <>{children}</>;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
