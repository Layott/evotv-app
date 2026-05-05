import * as React from "react";
import { Pressable, Text, View } from "react-native";

import type { ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface VariantPickerProps {
  variants: ProductVariant[];
  value: string | null;
  onChange: (id: string) => void;
}

export function VariantPicker({
  variants,
  value,
  onChange,
}: VariantPickerProps) {
  if (!variants.length) return null;
  const selectedInventory = variants.find((v) => v.id === value)?.inventory ?? 0;
  return (
    <View>
      <Text
        style={{
          marginBottom: 8,
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.5,
          color: "#a3a3a3",
          textTransform: "uppercase",
        }}
      >
        Size
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {variants.map((v) => {
          const selected = v.id === value;
          const oos = v.inventory <= 0;
          return (
            <Pressable
              key={v.id}
              accessibilityRole="button"
              disabled={oos}
              onPress={() => onChange(v.id)}
              className={cn(
                "rounded-lg border px-3 py-2 active:opacity-80",
                selected
                  ? "border-brand"
                  : "border-border bg-card",
                oos && "opacity-40",
              )}
              style={{
                minWidth: 48,
                backgroundColor: selected ? "rgba(44,215,227,0.15)" : undefined,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: selected ? "#67e8f9" : "#e5e5e5",
                  textDecorationLine: oos ? "line-through" : "none",
                  textAlign: "center",
                }}
              >
                {v.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {value ? (
        <Text style={{ marginTop: 8, fontSize: 11, color: "#737373" }}>
          {selectedInventory} in stock
        </Text>
      ) : null}
    </View>
  );
}

export default VariantPicker;
