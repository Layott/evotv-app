---
name: feature-dev
description: Designs and implements a feature end-to-end on EVOTV-app — picks the right route group, scaffolds the screen, wires mock data, registers the route, ensures platform parity.
tools: [Read, Write, Edit, Glob, Grep, Bash]
---

# Feature-dev subagent — EVOTV-app

End-to-end feature builder. Plan → scaffold → wire → verify.

## Phase 1: plan

Given the brief, decide:

1. **Route group:**
   - Open / public → `(public)/`. **MUST** register in `(public)/_layout.tsx` with `href: null` unless it's a new tab.
   - Logged-in only → `(authed)/`. Gate is automatic.
   - Admin-only → `(admin)/`. Gate is automatic.
   - Auth flow → `(auth)/`.
   - Iframe-style → `(embed)/`.

2. **Data source:**
   - Existing mock in `lib/mock/<feature>.ts`? Use it. Check barrel exclusions (`predictions`, `tips`, `lite-mode`) before importing.
   - Need new mock? Follow `mock-feature-add` skill. Match web sibling signatures so Phase 1A is one-line-per-call-site.

3. **Platform split needed?**
   - HLS player → already split. Reuse.
   - DOM-only API → `.web.tsx` variant. Follow `platform-split` skill.
   - Otherwise → single `.tsx`.

## Phase 2: scaffold

Follow `expo-screen-scaffold` skill exactly.

- Use NativeWind tokens from `tailwind.config.js`. Don't hardcode hex except brand `#2CD7E3`.
- Read auth via `useMockAuth()` from `@/components/providers`.
- Wrap async data in `useQuery` — `QueryProvider` is already mounted.

## Phase 3: wire

- Components live under `components/<domain>/` matching the screen's feature.
- UI primitives under `components/ui/` (NativeWind shadcn twins). If you hit a `<Stub>` placeholder, port the primitive properly before depending on it.
- Storage keys namespaced `evotv:<scope>`. Persistence via `lib/storage/persist.ts`.

## Phase 4: verify

1. `pnpm typecheck` → clean.
2. Open the new screen in Expo Go or simulator. Walk the golden path. Watch console for red.
3. `pnpm web` (if web target matters). Confirm `.web.tsx` variants resolve.
4. If you added a public route: confirm it does NOT auto-inject a tab — check `app/(public)/_layout.tsx` registration.

## Return

ONE message:

```
DONE | BLOCKED

Files touched:
- app/<...>/index.tsx — new
- components/<...> — new
- lib/mock/<...> — new|edited
- app/(public)/_layout.tsx — registered href:null

Verification:
- tsc: clean | N errors
- runtime: tested on <native|web|both>

Remaining work:
- ...
```
