import * as React from "react";
import {
  PanResponder,
  View,
  type LayoutChangeEvent,
  type ViewProps,
} from "react-native";

import { cn } from "@/lib/utils";

export interface SliderProps extends Omit<ViewProps, "onChange"> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}

const Slider = React.forwardRef<View, SliderProps>(
  (
    {
      className,
      trackClassName,
      rangeClassName,
      thumbClassName,
      value,
      defaultValue,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [width, setWidth] = React.useState(0);
    const [internal, setInternal] = React.useState<number[]>(
      defaultValue ?? [min],
    );
    const isControlled = value !== undefined;
    const current = isControlled ? value : internal;
    const single = current[0] ?? min;

    const clamp = React.useCallback(
      (v: number) => {
        const stepped = Math.round((v - min) / step) * step + min;
        return Math.max(min, Math.min(max, stepped));
      },
      [min, max, step],
    );

    const setSingle = React.useCallback(
      (next: number) => {
        const arr = [clamp(next)];
        if (!isControlled) setInternal(arr);
        onValueChange?.(arr);
      },
      [clamp, isControlled, onValueChange],
    );

    const onLayout = (e: LayoutChangeEvent) =>
      setWidth(e.nativeEvent.layout.width);

    const panResponder = React.useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => !disabled,
          onMoveShouldSetPanResponder: () => !disabled,
          onPanResponderGrant: (_evt, gesture) => {
            if (!width) return;
            const ratio = Math.max(0, Math.min(1, gesture.x0 / width));
            setSingle(min + ratio * (max - min));
          },
          onPanResponderMove: (_evt, gesture) => {
            if (!width) return;
            const ratio = Math.max(
              0,
              Math.min(1, (gesture.moveX - (gesture.x0 - gesture.dx)) / width),
            );
            setSingle(min + ratio * (max - min));
          },
        }),
      [disabled, max, min, setSingle, width],
    );

    const pct = ((single - min) / (max - min)) * 100;

    return (
      <View
        ref={ref}
        onLayout={onLayout}
        className={cn(
          "relative h-6 w-full justify-center",
          disabled && "opacity-50",
          className,
        )}
        {...panResponder.panHandlers}
        {...props}
      >
        <View
          className={cn(
            "h-1.5 w-full overflow-hidden rounded-full bg-muted",
            trackClassName,
          )}
        >
          <View
            className={cn("h-full bg-brand", rangeClassName)}
            style={{ width: `${pct}%` }}
          />
        </View>
        <View
          className={cn(
            "absolute h-4 w-4 rounded-full border border-brand bg-background",
            thumbClassName,
          )}
          style={{
            left: `${pct}%`,
            transform: [{ translateX: -8 }],
          }}
          accessibilityRole="adjustable"
        />
      </View>
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
