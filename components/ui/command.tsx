import * as React from "react";
import { View } from "react-native";

import { Stub } from "@/components/ui/_stub";

const Command: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
}) => <Stub name="Command">{children}</Stub>;

const CommandDialog: React.FC<{
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
}> = ({ children }) => <Stub name="CommandDialog">{children}</Stub>;

const CommandInput: React.FC<{ placeholder?: string; className?: string }> = () => (
  <Stub name="CommandInput" />
);
const CommandList: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
}) => <View>{children}</View>;
const CommandEmpty: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
}) => <View>{children}</View>;
const CommandGroup: React.FC<{ children?: React.ReactNode; className?: string; heading?: string }> = ({
  children,
}) => <View>{children}</View>;
const CommandItem: React.FC<{ children?: React.ReactNode; className?: string; onSelect?: () => void; value?: string }> = ({
  children,
}) => <View>{children}</View>;
const CommandSeparator: React.FC = () => null;
const CommandShortcut: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
};
