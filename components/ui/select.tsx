import * as React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "react-native";
import { Check, ChevronDown } from "lucide-react-native";

import { cn } from "@/lib/utils";

interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  registerLabel: (value: string, label: string) => void;
  getLabel: (value: string) => string | undefined;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select subcomponents must be used within <Select>");
  return ctx;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

function Select({
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  children,
}: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const isValueControlled = value !== undefined;
  const currentValue = isValueControlled ? value : internalValue;

  const [internalOpen, setInternalOpen] = React.useState(!!defaultOpen);
  const isOpenControlled = open !== undefined;
  const currentOpen = isOpenControlled ? open : internalOpen;

  const labelMap = React.useRef<Map<string, string>>(new Map());

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isOpenControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isOpenControlled, onOpenChange],
  );

  const handleChange = React.useCallback(
    (next: string) => {
      if (!isValueControlled) setInternalValue(next);
      onValueChange?.(next);
      setOpen(false);
    },
    [isValueControlled, onValueChange, setOpen],
  );

  const registerLabel = React.useCallback((v: string, label: string) => {
    labelMap.current.set(v, label);
  }, []);

  const getLabel = React.useCallback(
    (v: string) => labelMap.current.get(v),
    [],
  );

  return (
    <SelectContext.Provider
      value={{
        open: currentOpen,
        setOpen,
        value: currentValue ?? "",
        onValueChange: handleChange,
        registerLabel,
        getLabel,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps extends Omit<PressableProps, "children"> {
  size?: "sm" | "default";
  className?: string;
  children?: React.ReactNode;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  SelectTriggerProps
>(({ className, size = "default", disabled, children, ...props }, ref) => {
  const ctx = useSelectContext();
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => ctx.setOpen(true)}
      className={cn(
        "flex-row items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3",
        size === "sm" ? "h-8" : "h-9",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <View className="flex-row items-center gap-2 flex-1">{children}</View>
      <ChevronDown size={16} color="#A3A3A3" />
    </Pressable>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export interface SelectValueProps extends TextProps {
  placeholder?: string;
  className?: string;
}

const SelectValue = React.forwardRef<Text, SelectValueProps>(
  ({ className, placeholder, ...props }, ref) => {
    const ctx = useSelectContext();
    const label = ctx.value ? ctx.getLabel(ctx.value) ?? ctx.value : "";
    const display = label || placeholder || "";
    const isPlaceholder = !ctx.value && !!placeholder;
    return (
      <Text
        ref={ref}
        numberOfLines={1}
        className={cn(
          "text-sm",
          isPlaceholder ? "text-muted-foreground" : "text-foreground",
          className,
        )}
        {...props}
      >
        {display}
      </Text>
    );
  },
);
SelectValue.displayName = "SelectValue";

export interface SelectContentProps extends ViewProps {
  className?: string;
  position?: "popper" | "item-aligned";
}

const SelectContent = React.forwardRef<View, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const ctx = useSelectContext();
    return (
      <Modal
        visible={ctx.open}
        transparent
        animationType="fade"
        onRequestClose={() => ctx.setOpen(false)}
      >
        <Pressable
          accessibilityLabel="Close select"
          onPress={() => ctx.setOpen(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <Pressable
            ref={ref as React.Ref<View>}
            onPress={(e) => e.stopPropagation()}
            className={cn(
              "max-h-[60%] rounded-t-xl border-t border-border bg-popover p-1",
              className,
            )}
            {...props}
          >
            <ScrollView className="p-1" keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  },
);
SelectContent.displayName = "SelectContent";

export interface SelectItemProps extends Omit<PressableProps, "children"> {
  value: string;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const SelectItem = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  SelectItemProps
>(({ className, textClassName, value, disabled, children, ...props }, ref) => {
  const ctx = useSelectContext();
  const selected = ctx.value === value;

  React.useEffect(() => {
    if (typeof children === "string") ctx.registerLabel(value, children);
  }, [children, ctx, value]);

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => ctx.onValueChange(value)}
      className={cn(
        "flex-row items-center gap-2 rounded-sm px-2 py-1.5 pr-8",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <View className="flex-1">
        {React.Children.map(children, (child) => {
          if (typeof child === "string" || typeof child === "number") {
            return (
              <Text
                className={cn("text-sm text-foreground", textClassName)}
              >
                {child}
              </Text>
            );
          }
          return child;
        })}
      </View>
      {selected ? (
        <View className="absolute right-2">
          <Check size={16} color="#2CD7E3" />
        </View>
      ) : null}
    </Pressable>
  );
});
SelectItem.displayName = "SelectItem";

const SelectGroup = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn(className)} {...props} />
  ),
);
SelectGroup.displayName = "SelectGroup";

const SelectLabel = React.forwardRef<Text, TextProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  ),
);
SelectLabel.displayName = "SelectLabel";

const SelectSeparator = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  ),
);
SelectSeparator.displayName = "SelectSeparator";

const SelectScrollUpButton: React.FC<{ className?: string }> = () => null;
const SelectScrollDownButton: React.FC<{ className?: string }> = () => null;

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
