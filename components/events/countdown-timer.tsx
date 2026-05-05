import * as React from "react";
import { Text, View } from "react-native";

export interface CountdownTimerProps {
  target: string;
  label?: string;
  className?: string;
}

function diff(targetMs: number) {
  const now = Date.now();
  const ms = Math.max(0, targetMs - now);
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: ms === 0 };
}

export function CountdownTimer({
  target,
  label,
  className,
}: CountdownTimerProps) {
  const targetMs = React.useMemo(() => new Date(target).getTime(), [target]);
  const [t, setT] = React.useState(() => diff(targetMs));

  React.useEffect(() => {
    const id = setInterval(() => setT(diff(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const units = [
    { label: "Days", value: t.days },
    { label: "Hrs", value: t.hours },
    { label: "Min", value: t.minutes },
    { label: "Sec", value: t.seconds },
  ];

  return (
    <View className={className}>
      {label ? (
        <Text
          style={{
            marginBottom: 8,
            fontSize: 11,
            letterSpacing: 1,
            color: "#a3a3a3",
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
      ) : null}
      <View className="flex-row gap-2">
        {units.map((u) => (
          <View
            key={u.label}
            className="items-center rounded-lg border border-border bg-card px-3 py-2"
            style={{ minWidth: 54 }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: "#67e8f9",
                fontVariant: ["tabular-nums"],
              }}
            >
              {pad(u.value)}
            </Text>
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 1,
                color: "#737373",
                textTransform: "uppercase",
              }}
            >
              {u.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default CountdownTimer;
