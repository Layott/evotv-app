---
name: route-register
description: Use when adding a new route under app/(public)/ — the public group is a Tabs host and every new screen MUST be registered or it auto-injects into the tab bar.
---

# Register new public route

## Why this exists

`app/(public)/_layout.tsx` is a `Tabs` navigator. The 6 visible tabs are wired by name. **Any other public sub-route appears in the tab bar by default** unless explicitly hidden with `href: null`.

## Steps

1. **Create the screen file** at `app/(public)/<route>/index.tsx` (Expo Router pattern). Use `index.tsx` form, not bare `<route>.tsx` — keeps room for nested routes.
2. **Open** `app/(public)/_layout.tsx`.
3. **Decide:** tab or hidden?
   - **Tab** — add a `<Tabs.Screen name="<route>/index" options={{ title, tabBarIcon }} />` with a Lucide icon.
   - **Hidden** — add `<Tabs.Screen name="<route>/index" options={{ href: null }} />`. This is the default for almost all public routes (stream, vod, clip, event detail, channel, apps, calendar, api-access, etc.).
4. **Dynamic segments** (e.g., `[id]/index`): register the FULL name path: `<Tabs.Screen name="<route>/[id]/index" options={{ href: null }} />`.

## Gated groups

- `app/(authed)/` — `Stack` navigator with `useMockAuth()` guard. Just add the file; no registration needed beyond the file system.
- `app/(admin)/` — same, but with `role === "admin"` guard.
- `app/(auth)/` and `app/(embed)/` — bare `Stack`. File system alone.

## Verify

- App boots without the new route shoving an extra icon into the tab bar.
- Deep-linking to the route resolves the screen.
- `typedRoutes` (experiment enabled in `app.json`) regenerates `.expo/types/router.d.ts` — `pnpm typecheck` should pick up the new typed href.
