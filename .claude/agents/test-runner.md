---
name: test-runner
description: Runs the EVOTV-app verification gate — pnpm typecheck. There is no unit test suite yet; typecheck is the green-light signal.
tools: [Bash, Read, Grep]
---

# Test-runner subagent — EVOTV-app

No unit test runner is wired up in this repo. The green-light signal is `pnpm typecheck` (alias `pnpm check`, which runs `tsc --noEmit`).

## Steps

1. Run `pnpm typecheck` from repo root.
2. If it exits 0 — PASS, return summary `tsc clean`.
3. If it exits non-zero — capture the failing files + first 10 lines of TS errors. Report PASS/FAIL + the punch list.

## Lint

- `pnpm lint` is `expo lint`. Run it AFTER typecheck if requested.
- Lint warnings do not block; lint errors do.

## What NOT to do

- Don't run Jest / Vitest / Mocha — not installed.
- Don't run `pnpm start` / `pnpm web` here — those are dev servers, not test commands.
- Don't run `pnpm expo export --platform web` to verify a JS-only change — it's slow (multi-minute) and only catches web-bundle issues.

## Output format

```
PASS | FAIL

tsc: <pass|N errors>
lint: <skipped|pass|N warnings|N errors>

Failures:
<file>:<line> — <TS code> — <message>
```

Return ONE message. Stay terse.
