import * as React from "react";
import { Text, View } from "react-native";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const AFRICAN_COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "SN", name: "Senegal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "CM", name: "Cameroon" },
  { code: "TZ", name: "Tanzania" },
  { code: "ET", name: "Ethiopia" },
  { code: "UG", name: "Uganda" },
  { code: "RW", name: "Rwanda" },
] as const;

export type CountryCode = (typeof AFRICAN_COUNTRIES)[number]["code"];

export interface CountrySelectProps {
  value: string;
  onValueChange: (v: string) => void;
  invalid?: boolean;
}

export function CountrySelect({
  value,
  onValueChange,
  invalid,
}: CountrySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={
          invalid
            ? "h-11 w-full border border-red-500 bg-card text-foreground"
            : "h-11 w-full border border-border bg-card text-foreground"
        }
      >
        <SelectValue placeholder="Select country" />
      </SelectTrigger>
      <SelectContent>
        {AFRICAN_COUNTRIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <View className="flex-row items-center gap-2">
              <Text className="font-mono text-xs text-muted-foreground">
                {c.code}
              </Text>
              <Text className="text-foreground">{c.name}</Text>
            </View>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
