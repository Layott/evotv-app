import * as React from "react";
import { Platform, Text, TextInput } from "react-native";

/**
 * Gives every `<Text>` and `<TextInput>` Archivo as its starting font.
 *
 * React Native has no cascade. On the website `body` carries `font-sans` and
 * every element inherits it; here each `<Text>` is its own leaf, and one with
 * no font class renders in the platform's system face. Bundling Archivo and
 * pointing `tailwind.config.js` at it does nothing for those.
 *
 * That is not a rare case: body copy is exactly the text that carries no weight
 * class. Measured on the home screen before this landed, 5 of 21 text nodes
 * were still on the system stack, and all five were plain sentences - empty
 * states, helper lines, descriptions.
 *
 * ## Why the render patch and not defaultProps
 *
 * `Text.defaultProps = {style: ...}` is the recipe you will find everywhere,
 * and it does nothing here. React's automatic JSX runtime - which Expo uses,
 * and which is why there is no `import React` at the top of most files - does
 * not resolve `defaultProps`. Only the legacy `createElement` path did. So the
 * assignment succeeds, no warning fires, and every paragraph stays on Roboto.
 * Verified by measuring computed styles, not by reading the code.
 *
 * Patching `render` intercepts at the point the element is actually built, so
 * it is independent of which JSX runtime compiled the call site.
 *
 * ## Why it patches the props going in, not the element coming out
 *
 * The obvious version clones the returned element and merges a style onto it.
 * That is also a no-op, for a different reason: by the time `Text.render` has
 * returned on web, react-native-web has already compiled the style prop into
 * atomic CSS classes and handed back a plain `div`. Handing that DOM element a
 * React Native style array does nothing. Only the incoming props are still in
 * RN's own format on both platforms, so that is where the default belongs.
 *
 * The family goes *underneath* whatever the call site passed, so every weight
 * class still wins - `global.css` maps `font-medium` / `font-semibold` /
 * `font-bold` onto their own families.
 *
 * ## Native only
 *
 * On web this patch is actively wrong, which the measurements caught. NativeWind
 * hands `className` straight to the DOM there, so a weight class is plain CSS,
 * while an injected `style` becomes a react-native-web atomic class that lands
 * later in the stylesheet and beats it. Applying it on web put every heading
 * and label back to regular weight. The web default is set in `global.css`
 * instead, in the same cascade the weight classes live in.
 *
 * Called once from `app/_layout.tsx`, before anything renders.
 */

type TextProps = { style?: unknown };
type Renderable = {
  render?: (props: TextProps, ref: React.Ref<unknown>) => React.ReactElement;
};

const DEFAULT_STYLE = { fontFamily: "Archivo" } as const;

let applied = false;

export function applyDefaultTextFont(): void {
  // See the note above: on web this makes things worse, not better.
  if (Platform.OS === "web") return;

  // Fast Refresh re-runs module side effects. Without this the patch wraps
  // itself on every reload and the style array grows without bound.
  if (applied) return;
  applied = true;

  for (const Component of [Text, TextInput] as unknown as Renderable[]) {
    const original = Component.render;
    if (typeof original !== "function") continue;

    Component.render = function patched(props: TextProps, ref: React.Ref<unknown>) {
      return original.call(this, { ...props, style: [DEFAULT_STYLE, props.style] }, ref);
    };
  }
}
