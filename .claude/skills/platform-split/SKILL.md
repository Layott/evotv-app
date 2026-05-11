---
name: platform-split
description: Use when a component needs different implementations on native vs web — Metro auto-resolves *.web.tsx over *.tsx on the web target so callers don't branch at runtime.
---

# Platform-split a component

## Why this exists

Metro bundler resolves `Component.web.tsx` over `Component.tsx` when target is web. Lets you ship two native impls with identical exports and no `Platform.OS === "web"` branches at the call site.

## Canonical example

`components/stream/hls-player.tsx` (native — `expo-video`) and `components/stream/hls-player.web.tsx` (web — `<video>` + `hls.js` polyfill). Same `HlsPlayerProps` shape. Same default + named exports.

## Steps

1. **Define the shared prop interface** once at the top of the native file. Export it.
2. **Write the native impl** in `Component.tsx`. Use RN APIs (`View`, `Pressable`, `expo-*`).
3. **Write the web impl** in `Component.web.tsx`. Use `React.createElement("video", {...})` for raw DOM, or the web-compatible APIs (`<input>`, etc.). Import the prop interface or duplicate it — same shape.
4. **Match exports exactly.** Both files: `export function Component`, `export default Component`, plus any named alias. Mismatched exports break web bundles.
5. **Imports stay neutral.** Callers do `import { Component } from "@/components/.../component"` — no `.web` suffix.

## When NOT to split

- Logic differs by a few lines → `Platform.select` or `Platform.OS` runtime check is fine.
- Component uses `nativewind` only → it already cross-targets; no split needed.
- DOM-only API call (alert, navigator.share) → use `Platform.OS === "web"` runtime branch.

## Web-target footguns to remember

- `expo-secure-store` falls back to `localStorage` on web — don't store real tokens.
- `expo-haptics` is a no-op on web.
- Reanimated worklets run on JS thread on web (slower).
- `app.json` has `web.output: "single"` (SPA). Static export trips Reanimated SSR.

## Verify

- `pnpm web` boots the component; no console errors.
- `pnpm ios`/`android` still uses the native impl.
- `pnpm expo export --platform web` produces a working `dist/` bundle.
