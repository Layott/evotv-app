import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { TextInput, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";

export interface TextareaProps extends TextInputProps {
  className?: string;
}

const Textarea = React.forwardRef<TextInput, TextareaProps>(
  ({ className, placeholderTextColor, ...props }, ref) => {
    const palette = useTokens();
    return (
      <TextInput
        ref={ref}
        multiline
        textAlignVertical="top"
        placeholderTextColor={placeholderTextColor ?? palette.muted}
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
