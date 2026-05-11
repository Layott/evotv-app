---
name: mock-feature-add
description: Use when adding a new mock data module under lib/mock/ — covers barrel re-export, signature-mirror rule for Phase 1A, and the predictions/tips/lite-mode collision exclusions.
---

# Add new mock module

## When to use

Adding new domain data (e.g., new `lib/mock/<feature>.ts`) before the real API exists.

## Steps

1. **Create** `lib/mock/<feature>.ts`. Export typed functions, not raw arrays. Use helpers from `lib/mock/_util.ts` (`now`, `daysAgo`, `pick`, `paginate`, `byId`, `bySlug`).
2. **Match signatures the web sibling already ships.** Phase 1A swaps `lib/mock/<feature>.ts` for `lib/api/<feature>.ts` one line per call site — only works if signatures stay identical.
3. **Re-export from barrel** in `lib/mock/index.ts` UNLESS the module collides:
   - `predictions` and `tips` both export `getCoinBalance`. Predictions also exports `getTeamById` (collides with `teams`).
   - `lite-mode` is `"use client"` and would taint the barrel.
   - **If your module collides**, skip the barrel and document the rename in the import site:
     ```ts
     import { getCoinBalance as get<Feature>Balance } from "@/lib/mock/<feature>";
     ```
4. **Persistence:** if writing user state, use `lib/storage/persist.ts`. Pick the async surface (`persist.get/set/remove`) by default. Use `syncGet/syncSet/syncRemove` only when porting a web call site that depends on synchronous `localStorage`.
5. **Storage keys:** namespace `evotv:<scope>` (matches `evotv:current-user`, `evotv:follows`, `evotv:onboarded`, `evotv:theme`).

## Verify

- `pnpm check` clean.
- Import the module from at least one screen; render the data; confirm no runtime error.
- Search the barrel for symbol collisions before merging.
