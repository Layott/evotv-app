import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "@/components/icons";

import { resolveRange, type RangeInput } from "@/lib/analytics-range";

/**
 * A month grid, because the app has no date field.
 *
 * The web picker uses a native `<input type="date">`, which React Native has no
 * equivalent of, and `components/ui/calendar.tsx` in this repo is a stub that
 * renders a placeholder. Rather than pull in a picker library for one screen,
 * this is a plain grid: tap a day to set the start, tap a second to close the
 * window, tap the same day twice for a single day.
 *
 * Everything is UTC day keys (`YYYY-MM-DD`), matching the API and the buckets
 * the numbers come from. Local dates here would put the boundary an hour out on
 * the Lagos droplet, which is the bug the shared resolver exists to prevent.
 */

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_MS = 86_400_000;

function keyOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function startOfMonthMs(year: number, month: number): number {
  return Date.UTC(year, month, 1);
}

/** Monday-first offset for the first of the month. */
function leadingBlanks(year: number, month: number): number {
  const weekday = new Date(startOfMonthMs(year, month)).getUTCDay();
  return (weekday + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function DayPicker({
  value,
  onChange,
}: {
  value: RangeInput;
  onChange: (next: RangeInput) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = React.useState({
    year: today.getUTCFullYear(),
    month: today.getUTCMonth(),
  });
  /** The first tap of a window, waiting for its second. */
  const [anchor, setAnchor] = React.useState<string | null>(null);

  const resolved = resolveRange(value);
  const hasWindow = Boolean(value.from);

  function pick(day: string) {
    if (day > keyOf(Date.now())) return;
    if (!anchor) {
      setAnchor(day);
      onChange({ from: day, to: day });
      return;
    }
    const [from, to] = anchor <= day ? [anchor, day] : [day, anchor];
    setAnchor(null);
    onChange({ from, to });
  }

  function shiftMonth(by: number) {
    setCursor((c) => {
      const next = new Date(Date.UTC(c.year, c.month + by, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  const blanks = leadingBlanks(cursor.year, cursor.month);
  const total = daysInMonth(cursor.year, cursor.month);
  const cells: (string | null)[] = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: total }, (_, i) =>
      keyOf(startOfMonthMs(cursor.year, cursor.month) + i * DAY_MS),
    ),
  ];

  const todayKey = keyOf(Date.now());

  return (
    <View className="gap-3 rounded-xl bg-card p-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => shiftMonth(-1)}
          hitSlop={8}
          className="rounded-lg bg-muted/40 p-2"
          accessibilityLabel="Previous month"
        >
          <ChevronLeft size={16} color="#9fbdbd" />
        </Pressable>
        <Text className="text-sm font-semibold text-foreground">
          {MONTHS[cursor.month]} {cursor.year}
        </Text>
        <Pressable
          onPress={() => shiftMonth(1)}
          hitSlop={8}
          className="rounded-lg bg-muted/40 p-2"
          accessibilityLabel="Next month"
        >
          <ChevronRight size={16} color="#9fbdbd" />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((d, i) => (
          <Text
            key={`${d}-${i}`}
            className="flex-1 text-center text-[11px] text-muted-foreground"
          >
            {d}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (!day) {
            return <View key={`blank-${i}`} style={{ width: `${100 / 7}%` }} className="h-10" />;
          }
          const inRange =
            hasWindow && day >= resolved.fromDay && day <= resolved.toDay;
          const isEdge =
            hasWindow && (day === resolved.fromDay || day === resolved.toDay);
          const future = day > todayKey;
          return (
            <View key={day} style={{ width: `${100 / 7}%` }} className="h-10 p-0.5">
              <Pressable
                disabled={future}
                onPress={() => pick(day)}
                className={
                  isEdge
                    ? "flex-1 items-center justify-center rounded-lg bg-sky-600"
                    : inRange
                      ? "flex-1 items-center justify-center rounded-lg bg-sky-500/25"
                      : "flex-1 items-center justify-center rounded-lg"
                }
              >
                <Text
                  className={
                    future
                      ? "text-xs text-muted-foreground/40"
                      : isEdge
                        ? "text-xs font-semibold text-white"
                        : "text-xs text-foreground"
                  }
                >
                  {Number(day.slice(8))}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text className="text-xs text-muted-foreground">
        {anchor
          ? "Tap a second day to close the window, or the same day again for one day."
          : `Showing ${resolved.label}`}
      </Text>
    </View>
  );
}
