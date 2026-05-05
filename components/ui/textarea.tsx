import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";

export interface TextareaProps extends TextInputProps {
  className?: string;
}

const Textarea = React.forwardRef<TextInput, TextareaProps>(
  ({ className, placeholderTextColor = "#A3A3A3", ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        multiline
        textAlignVertical="top"
        placeholderTextColor={placeholderTextColor}
        className={cn(
          "min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base text-foreground",
          props.editable === false && "opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
