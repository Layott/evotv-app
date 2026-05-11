---
name: phase1a-swap
description: Use when the web app ships bearer-token /api/* endpoints and you need to swap mock data for the real backend — the swap is intentionally one line per call site if signatures stayed identical.
---

# Phase 1A backend swap

## Pre-flight

- Web sibling (`../EVOTV/`) ships `/api/auth/*` and feature endpoints with bearer-token auth.
- `EXPO_PUBLIC_API_BASE_URL` resolves correctly (default `http://localhost:3060` for local).
- All `lib/mock/<feature>.ts` signatures match what the web sibling exposes. If not, fix the mock first — don't reshape at the boundary.

## Steps

1. **Mirror module:** create `lib/api/<feature>.ts` for each `lib/mock/<feature>.ts`. Function names, parameter shapes, return types — identical.
2. **Real HTTP:** body of each function does `fetch(\`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/<path>\`, { headers: { Authorization: \`Bearer ${token}\` } })`. Pull token from `expo-secure-store` (already a dep).
3. **Swap imports:** call sites change `from "@/lib/mock/<feature>"` → `from "@/lib/api/<feature>"`. One line per site, or add a barrel re-export indirection in `@/lib/data/<feature>` that you flip in one place.
4. **Auth provider:** replace `MockAuthProvider` (`components/providers/mock-auth-provider.tsx`) with an `AuthProvider` that runs Better-Auth bearer sign-in/sign-out against the web API. Keep the `useMockAuth()` hook NAME or rename + sweep — the `(authed)` + `(admin)` gates depend on `user` + `role` + `isLoading` from that hook.
5. **Token storage:** `expo-secure-store` for native (Keychain/Keystore). Web falls back to `localStorage` — **do not store real tokens there.** Either:
   - Disable web auth entirely until Web Push / cookie-based session lands, OR
   - Use httpOnly cookies via `fetch(..., { credentials: "include" })` on web and SecureStore on native.
6. **TanStack Query:** existing `QueryProvider` settings (`staleTime: 30_000`, `refetchOnWindowFocus: false`, `retry: 1`) are sensible — leave alone. Use `useQuery` + `useMutation` for the new API calls.

## Risks

- The collision-skipped modules (`predictions`, `tips`, `lite-mode`) — verify their swap targets also avoid the same name clashes, or rename at boundary on the API side first.
- Some mocks expose **persisted** state via the sync cache (e.g., follows). Real API state needs server round-trip; remove the local cache reads or use it strictly as optimistic UI.

## Verify

- `pnpm check` clean.
- Walk: `(auth)/login` → token persists → restart app → still authed.
- Walk: `(public)/home` → data loads from real API (check Network tab on web / Flipper on native).
- Toggle airplane mode → React Query retries / falls back gracefully.
