import * as React from "react";
import { Animated, Easing, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";

export interface SkeletonProps extends ViewProps {
  className?: string;
}

const Skeleton = React.forwardRef<Animated.LegacyRef<typeof Animated.View>, SkeletonProps>(
  ({ className, style, ...props }, ref) => {
    const opacity = React.useRef(new Animated.Value(0.5)).current;

    React.useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }, [opacity]);

    return (
      <Animated.View
        ref={ref as never}
        className={cn("rounded-md bg-accent", className)}
        style={[{ opacity }, style]}
        {...props}
      />
    );
  },
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
