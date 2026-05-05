import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  className?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, placeholderTextColor = "#A3A3A3", ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor}
        className={cn(
          "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base text-foreground",
          props.editable === false && "opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
