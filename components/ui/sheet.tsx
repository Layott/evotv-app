import * as React from "react";
import {
  Animated,
  Dimensions,
  Easing,
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

type SheetSide = "top" | "right" | "bottom" | "left";

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("Sheet subcomponents must be used within <Sheet>");
  return ctx;
}

export interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Sheet({ open, defaultOpen, onOpenChange, children }: SheetProps) {
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
    <SheetContext.Provider value={{ open: current, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export interface SheetTriggerProps extends Omit<PressableProps, "onPress"> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const SheetTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  SheetTriggerProps
>(({ asChild, children, ...props }, ref) => {
  const ctx = useSheetContext();
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
SheetTrigger.displayName = "SheetTrigger";

export interface SheetCloseProps extends Omit<PressableProps, "onPress"> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const SheetClose = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  SheetCloseProps
>(({ asChild, children, ...props }, ref) => {
  const ctx = useSheetContext();
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
SheetClose.displayName = "SheetClose";

export interface SheetContentProps
  extends Omit<ModalProps, "visible" | "onRequestClose" | "transparent"> {
  className?: string;
  side?: SheetSide;
  showCloseButton?: boolean;
  children?: React.ReactNode;
  overlayClassName?: string;
}

const SCREEN = Dimensions.get("window");

const SheetContent = React.forwardRef<View, SheetContentProps>(
  (
    {
      className,
      side = "bottom",
      showCloseButton = true,
      overlayClassName,
      children,
      ...props
    },
    ref,
  ) => {
    const ctx = useSheetContext();
    const [mounted, setMounted] = React.useState(ctx.open);
    const offFor = React.useCallback((s: SheetSide) => {
      if (s === "bottom") return SCREEN.height;
      if (s === "top") return -SCREEN.height;
      if (s === "right") return SCREEN.width;
      return -SCREEN.width;
    }, []);
    const translate = React.useRef(new Animated.Value(offFor(side))).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      if (ctx.open) {
        setMounted(true);
        translate.setValue(offFor(side));
        opacity.setValue(0);
        Animated.parallel([
          Animated.timing(translate, {
            toValue: 0,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (mounted) {
        Animated.parallel([
          Animated.timing(translate, {
            toValue: offFor(side),
            duration: 240,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) setMounted(false);
        });
      }
    }, [ctx.open, side, mounted, offFor, opacity, translate]);

    if (!mounted) return null;

    const sideClasses = (() => {
      if (side === "bottom")
        return "absolute inset-x-0 bottom-0 border-t border-border rounded-t-xl max-h-[90%]";
      if (side === "top")
        return "absolute inset-x-0 top-0 border-b border-border rounded-b-xl max-h-[90%]";
      if (side === "right")
        return "absolute inset-y-0 right-0 w-3/4 max-w-sm border-l border-border";
      return "absolute inset-y-0 left-0 w-3/4 max-w-sm border-r border-border";
    })();

    const transformStyle =
      side === "bottom" || side === "top"
        ? { transform: [{ translateY: translate }] }
        : { transform: [{ translateX: translate }] };

    return (
      <Modal
        visible={mounted}
        transparent
        animationType="none"
        onRequestClose={() => ctx.setOpen(false)}
        statusBarTranslucent
        {...props}
      >
        <View className="flex-1">
          <Animated.View style={{ opacity }} className="absolute inset-0">
            <Pressable
              accessibilityLabel="Close sheet"
              onPress={() => ctx.setOpen(false)}
              className={cn("flex-1 bg-black/50", overlayClassName)}
            />
          </Animated.View>
          <Animated.View style={transformStyle} className={cn(sideClasses)}>
            <View
              ref={ref}
              className={cn("flex-col gap-4 bg-background p-4", className)}
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
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  },
);
SheetContent.displayName = "SheetContent";

const SheetHeader = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("gap-1.5", className)} {...props} />
  ),
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn("mt-auto gap-2", className)} {...props} />
  ),
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<Text, TextProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  ),
);
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
