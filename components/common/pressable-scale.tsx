import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  /** Scale at full press. 0.96 = subtle. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Pressable with a subtle, GPU-accelerated press-scale (transform only — 60fps
 * on native + web). 120ms in / 160ms out, ease-out (no bounce). Drop-in for any
 * tappable card; `className` (NativeWind) passes through untouched.
 */
export function PressableScale({
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  style,
  ...props
}: Props) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
  }));
  return (
    <AnimatedPressable
      onPressIn={(e) => {
        pressed.value = withTiming(1, {
          duration: 120,
          easing: Easing.out(Easing.quad),
        });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, {
          duration: 160,
          easing: Easing.out(Easing.quad),
        });
        onPressOut?.(e);
      }}
      style={[animatedStyle, style]}
      {...props}
    />
  );
}

export default PressableScale;
