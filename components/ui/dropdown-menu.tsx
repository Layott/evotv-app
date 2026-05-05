import * as React from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "react-native";
import { Check, ChevronRight, Circle } from "lucide-react-native";

import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(
  null,
);

function useDropdownContext() {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx)
    throw new Error(
      "DropdownMenu subcomponents must be used within <DropdownMenu>",
    );
  return ctx;
}

export interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function DropdownMenu({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: DropdownMenuProps) {
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
    <DropdownMenuContext.Provider value={{ open: current, setOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

export interface DropdownMenuTriggerProps extends Omit<PressableProps, "onPress"> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  DropdownMenuTriggerProps
>(({ asChild, children, ...props }, ref) => {
  const ctx = useDropdownContext();
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
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export interface DropdownMenuContentProps extends ViewProps {
  className?: string;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  children?: React.ReactNode;
}

const DropdownMenuContent = React.forwardRef<View, DropdownMenuContentProps>(
  ({ className, align = "end", children, ...props }, ref) => {
    const ctx = useDropdownContext();
    const alignClass =
      align === "start"
        ? "items-start pl-4"
        : align === "center"
          ? "items-center"
          : "items-end pr-4";
    return (
      <Modal
        visible={ctx.open}
        transparent
        animationType="fade"
        onRequestClose={() => ctx.setOpen(false)}
      >
        <Pressable
          accessibilityLabel="Close menu"
          onPress={() => ctx.setOpen(false)}
          className={cn("flex-1 pt-12", alignClass)}
        >
          <Pressable
            ref={ref as React.Ref<View>}
            onPress={(e) => e.stopPropagation()}
            className={cn(
              "min-w-[8rem] rounded-md border border-border bg-popover p-1",
              className,
            )}
            {...props}
          >
            {children}
          </Pressable>
        </Pressable>
      </Modal>
    );
  },
);
DropdownMenuContent.displayName = "DropdownMenuContent";

export interface DropdownMenuItemProps extends Omit<PressableProps, "children"> {
  inset?: boolean;
  variant?: "default" | "destructive";
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  DropdownMenuItemProps
>(
  (
    {
      className,
      textClassName,
      inset,
      variant = "default",
      disabled,
      onPress,
      children,
      ...props
    },
    ref,
  ) => {
    const ctx = useDropdownContext();
    return (
      <Pressable
        ref={ref}
        accessibilityRole="menuitem"
        disabled={disabled}
        onPress={(e) => {
          onPress?.(e);
          ctx.setOpen(false);
        }}
        className={cn(
          "flex-row items-center gap-2 rounded-sm px-2 py-1.5",
          inset && "pl-8",
          disabled && "opacity-50",
          className,
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (typeof child === "string" || typeof child === "number") {
            return (
              <Text
                className={cn(
                  "text-sm",
                  variant === "destructive"
                    ? "text-destructive"
                    : "text-foreground",
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
  },
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export interface DropdownMenuCheckboxItemProps
  extends Omit<PressableProps, "children"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  DropdownMenuCheckboxItemProps
>(
  (
    {
      className,
      textClassName,
      checked,
      onCheckedChange,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <Pressable
        ref={ref}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!checked, disabled: !!disabled }}
        disabled={disabled}
        onPress={() => onCheckedChange?.(!checked)}
        className={cn(
          "flex-row items-center gap-2 rounded-sm py-1.5 pl-8 pr-2",
          disabled && "opacity-50",
          className,
        )}
        {...props}
      >
        <View className="absolute left-2 h-3.5 w-3.5 items-center justify-center">
          {checked ? <Check size={14} color="#2CD7E3" /> : null}
        </View>
        {React.Children.map(children, (child) => {
          if (typeof child === "string" || typeof child === "number") {
            return (
              <Text className={cn("text-sm text-foreground", textClassName)}>
                {child}
              </Text>
            );
          }
          return child;
        })}
      </Pressable>
    );
  },
);
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

interface DropdownMenuRadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const DropdownMenuRadioGroupContext =
  React.createContext<DropdownMenuRadioGroupContextValue | null>(null);

export interface DropdownMenuRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}

function DropdownMenuRadioGroup({
  value = "",
  onValueChange,
  children,
}: DropdownMenuRadioGroupProps) {
  const handle = React.useCallback(
    (v: string) => onValueChange?.(v),
    [onValueChange],
  );
  return (
    <DropdownMenuRadioGroupContext.Provider
      value={{ value, onValueChange: handle }}
    >
      <View>{children}</View>
    </DropdownMenuRadioGroupContext.Provider>
  );
}

export interface DropdownMenuRadioItemProps
  extends Omit<PressableProps, "children"> {
  value: string;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  DropdownMenuRadioItemProps
>(({ className, textClassName, value, disabled, children, ...props }, ref) => {
  const ctx = React.useContext(DropdownMenuRadioGroupContext);
  if (!ctx)
    throw new Error(
      "DropdownMenuRadioItem must be used within <DropdownMenuRadioGroup>",
    );
  const checked = ctx.value === value;
  return (
    <Pressable
      ref={ref}
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => ctx.onValueChange(value)}
      className={cn(
        "flex-row items-center gap-2 rounded-sm py-1.5 pl-8 pr-2",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <View className="absolute left-2 h-3.5 w-3.5 items-center justify-center">
        {checked ? <Circle size={8} color="#2CD7E3" fill="#2CD7E3" /> : null}
      </View>
      {React.Children.map(children, (child) => {
        if (typeof child === "string" || typeof child === "number") {
          return (
            <Text className={cn("text-sm text-foreground", textClassName)}>
              {child}
            </Text>
          );
        }
        return child;
      })}
    </Pressable>
  );
});
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuLabel = React.forwardRef<
  Text,
  TextProps & { className?: string; inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-medium text-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<
  View,
  ViewProps & { className?: string }
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuShortcut = React.forwardRef<
  Text,
  TextProps & { className?: string }
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn(
      "ml-auto text-xs tracking-widest text-muted-foreground",
      className,
    )}
    {...props}
  />
));
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

const DropdownMenuGroup: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <View>{children}</View>;

const DropdownMenuPortal: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

const DropdownMenuSub: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  DropdownMenuItemProps
>(({ className, textClassName, inset, children, ...props }, ref) => (
  <Pressable
    ref={ref}
    className={cn(
      "flex-row items-center gap-2 rounded-sm px-2 py-1.5",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {React.Children.map(children, (child) => {
      if (typeof child === "string" || typeof child === "number") {
        return (
          <Text className={cn("text-sm text-foreground", textClassName)}>
            {child}
          </Text>
        );
      }
      return child;
    })}
    <View className="ml-auto">
      <ChevronRight size={16} color="#A3A3A3" />
    </View>
  </Pressable>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef<
  View,
  ViewProps & { className?: string }
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      "min-w-[8rem] rounded-md border border-border bg-popover p-1",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
