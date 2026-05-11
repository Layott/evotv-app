---
name: expo-screen-scaffold
description: Use when scaffolding a brand-new screen — covers group selection, header style inheritance, dark-theme bg color, and SafeArea handling that matches the existing screens.
---

# Scaffold new screen

## Steps

1. **Pick the route group:**
   - Public, no auth → `app/(public)/<route>/index.tsx` + register in `_layout.tsx` (see `route-register` skill).
   - Logged-in only → `app/(authed)/<route>/index.tsx`. Auth gate is automatic via `_layout.tsx`.
   - Admin-only → `app/(admin)/<route>/index.tsx`. Role gate automatic.
   - Auth flow (login/signup/etc.) → `app/(auth)/<route>/index.tsx`.
   - Iframe-style player → `app/(embed)/<route>/index.tsx`.

2. **File skeleton:**
   ```tsx
   import { ScrollView, Text, View } from "react-native";
   import { Stack } from "expo-router";

   export default function <Route>Screen() {
     return (
       <>
         <Stack.Screen options={{ title: "<Title>" }} />
         <ScrollView className="flex-1 bg-background">
           <View className="px-4 py-6 gap-4">
             {/* content */}
           </View>
         </ScrollView>
       </>
     );
   }
   ```

3. **Header:** root `Stack` already sets header bg `#0A0A0A`, tint `#FAFAFA`, animation `slide_from_right`. Override per-screen with inline `<Stack.Screen options={{ ... }} />`.

4. **Theme classes:** use NativeWind tokens from `tailwind.config.js` — `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, etc. Avoid hardcoded hex except for the brand `#2CD7E3`.

5. **Auth read:** `const { user, role } = useMockAuth();` from `@/components/providers`.

6. **Data read:** `import { <fn> } from "@/lib/mock/<feature>"`. Wrap async calls in TanStack Query (`useQuery`) — `QueryProvider` is already mounted.

## Anti-patterns

- Don't import a `tasks/lessons.md`-style file inside a screen — that's tooling state.
- Don't use `SafeAreaView` from `react-native` (deprecated). Use `useSafeAreaInsets()` from `react-native-safe-area-context` if you need inset values.
- Don't put `<StatusBar />` per-screen — it's set globally at the root.

## Verify

- `pnpm typecheck` clean.
- Open the route in Expo Go (native) AND `pnpm web` — both should render without red boxes.
- Toggle role via `RoleSwitcher` (dev only) and walk auth-gated paths.
