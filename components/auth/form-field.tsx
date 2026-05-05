import * as React from "react";
import { TextInput, View, Text, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FieldWrapperProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function FieldWrapper({
  label,
  error,
  hint,
  className,
  children,
}: FieldWrapperProps) {
  return (
    <View className={cn("gap-1.5", className)}>
      <Label className="font-semibold text-foreground">{label}</Label>
      {children}
      {error ? (
        <Text className="text-xs" style={{ color: "#f87171" }}>
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-xs text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}

export interface TextFieldProps extends TextInputProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputClassName?: string;
}

export const FormField = React.forwardRef<TextInput, Omit<TextFieldProps, "id">>(
  function FormField({ label, error, hint, containerClassName, leftIcon, rightIcon, inputClassName, ...props }, ref) {
    return (
      <FieldWrapper id={label || "field"} label={label} error={error} hint={hint} className={containerClassName}>
        <View className="relative">
          {leftIcon ? <View className="absolute left-3 top-0 bottom-0 z-10 justify-center" pointerEvents="none">{leftIcon}</View> : null}
          <Input
            ref={ref}
            placeholderTextColor="#737373"
            className={cn("h-11 border bg-card text-foreground", leftIcon && "pl-10", rightIcon && "pr-10", error && "border-red-500", !error && "border-border", inputClassName)}
            {...props}
          />
          {rightIcon ? <View className="absolute right-3 top-0 bottom-0 z-10 justify-center">{rightIcon}</View> : null}
        </View>
      </FieldWrapper>
    );
  },
);

export const TextField = React.forwardRef<TextInput, TextFieldProps>(
  function TextField(
    {
      id,
      label,
      error,
      hint,
      containerClassName,
      leftIcon,
      rightIcon,
      inputClassName,
      ...props
    },
    ref,
  ) {
    return (
      <FieldWrapper
        id={id}
        label={label}
        error={error}
        hint={hint}
        className={containerClassName}
      >
        <View className="relative">
          {leftIcon ? (
            <View
              className="absolute left-3 top-0 bottom-0 z-10 justify-center"
              pointerEvents="none"
            >
              {leftIcon}
            </View>
          ) : null}
          <Input
            ref={ref}
            placeholderTextColor="#737373"
            className={cn(
              "h-11 border bg-card text-foreground",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500",
              !error && "border-border",
              inputClassName,
            )}
            {...props}
          />
          {rightIcon ? (
            <View
              className="absolute right-3 top-0 bottom-0 z-10 justify-center"
            >
              {rightIcon}
            </View>
          ) : null}
        </View>
      </FieldWrapper>
    );
  },
);
