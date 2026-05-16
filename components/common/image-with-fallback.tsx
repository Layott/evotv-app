import * as React from "react";
import {
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Image, type ImageContentFit } from "expo-image";

/**
 * Resilient image. Renders a tinted placeholder (with optional initial letter
 * or icon) whenever the source is empty, undefined, or fails to load.
 *
 * Drop-in replacement for `<Image source={x.thumbnailUrl} ... />` anywhere a
 * backend column may be empty (very common across streams/vods/clips/products
 * during seed gaps). Keeps the layout stable instead of rendering a flat
 * black/grey rectangle.
 */
interface ImageWithFallbackProps {
  source: string | { uri?: string } | null | undefined;
  style?: StyleProp<ImageStyle>;
  className?: string;
  contentFit?: ImageContentFit;
  /** First letter shown inside the placeholder (e.g. title initial). */
  fallbackLabel?: string;
  /** Custom JSX rendered inside the placeholder (overrides fallbackLabel). */
  fallbackChildren?: React.ReactNode;
  /**
   * Background gradient seed. Same string → same color so a single card stays
   * stable across rerenders. Pass the row id / slug for variety across grids.
   */
  tintSeed?: string;
}

const TINTS = [
  ["#0f172a", "#1e293b"],
  ["#0a0a0a", "#1f2937"],
  ["#1a1a2e", "#16213e"],
  ["#1f1147", "#2d1b69"],
  ["#0a3d62", "#1e6091"],
  ["#3d1a1a", "#5c2929"],
  ["#1a3d2e", "#2c5c4a"],
  ["#3d2f1a", "#5c4429"],
] as const;

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function tintFor(seed?: string): { from: string; to: string } {
  const t = TINTS[hashSeed(seed ?? "default") % TINTS.length]!;
  return { from: t[0], to: t[1] };
}

export function ImageWithFallback({
  source,
  style,
  className,
  contentFit = "cover",
  fallbackLabel,
  fallbackChildren,
  tintSeed,
}: ImageWithFallbackProps) {
  const [errored, setErrored] = React.useState(false);

  const rawUri =
    typeof source === "string" ? source : (source?.uri ?? "");
  const isEmpty = !rawUri || rawUri.length === 0;

  if (isEmpty || errored) {
    const { from, to } = tintFor(tintSeed ?? fallbackLabel);
    return (
      <View
        className={className}
        style={[
          {
            backgroundColor: from,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          },
          style as StyleProp<ViewStyle>,
        ]}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: to,
            opacity: 0.5,
          }}
        />
        {fallbackChildren ?? (
          <Text
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 28,
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            {(fallbackLabel ?? "·").slice(0, 1).toUpperCase()}
          </Text>
        )}
      </View>
    );
  }

  return (
    <Image
      source={rawUri}
      style={[{ width: "100%", height: "100%" }, style]}
      className={className}
      contentFit={contentFit}
      onError={() => setErrored(true)}
    />
  );
}
