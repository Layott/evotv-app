import * as React from "react";
import { Text, View } from "react-native";

import { cn } from "@/lib/utils";

export type PasswordStrength =
  | "empty"
  | "weak"
  | "medium"
  | "strong"
  | "very-strong";

// Hand-rolled scoring (no zxcvbn). Mirrors the web rule set, with a 4th tier
// added to match the deliverable's 4-bar meter.
export function scorePassword(password: string): PasswordStrength {
  if (!password) return "empty";
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  if (score <= 4) return "strong";
  return "very-strong";
}

const LABELS: Record<PasswordStrength, string> = {
  empty: "Enter a password",
  weak: "Weak",
  medium: "Medium",
  strong: "Strong",
  "very-strong": "Very strong",
};

const FILLED: Record<PasswordStrength, number> = {
  empty: 0,
  weak: 1,
  medium: 2,
  strong: 3,
  "very-strong": 4,
};

const COLOR: Record<PasswordStrength, string> = {
  empty: "#404040",
  weak: "#ef4444",
  medium: "#f59e0b",
  strong: "#22c55e",
  "very-strong": "#2CD7E3",
};

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  const strength = scorePassword(password);
  const filled = FILLED[strength];
  const color = COLOR[strength];

  return (
    <View
      className={cn("gap-1.5", className)}
      accessibilityLiveRegion="polite"
    >
      <View className="flex-row gap-1">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < filled ? color : "#262626",
            }}
          />
        ))}
      </View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "500",
          color: strength === "empty" ? "#737373" : color,
        }}
      >
        {LABELS[strength]}
      </Text>
    </View>
  );
}

export default PasswordStrengthMeter;
