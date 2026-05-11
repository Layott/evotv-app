# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Org model:** project follows the 5-layer Agent Development Kit (ADK).
> `CLAUDE.md sets rules → Skills provide expertise → Hooks enforce quality → Subagents delegate work → Plugin distributes the bundle.`

---

## Project — at a glance

EVO TV native app — iOS / Android / Android TV + web SPA. Sibling of the web repo at `../EVOTV/`; mirrors the same brand, data shapes, screens, and flows.

Stack: **Expo SDK 52** (RN 0.76, New Architecture on) · **Expo Router 4** (typed routes, file-based) · **NativeWind v4** (Tailwind in RN) · **TanStack Query** · **Zustand** · **expo-video** (HLS) · **expo-font** (Geist) · **AsyncStorage / expo-secure-store** · **pnpm** with `node-linker=hoisted` (Metro needs it).

### Commands

```bash
pnpm install
pnpm start                    # Expo dev server (QR for Expo Go)
pnpm ios                      # iOS simulator (macOS)
pnpm android                  # Android emulator
pnpm web                      # web preview
pnpm typecheck                # tsc --noEmit
pnpm lint                     # expo lint
pnpm check                    # alias for typecheck
pnpm expo export --platform web   # build web SPA → ./dist/
```

No test runner is wired up. `pnpm check` (typecheck) is the green-light gate. There is no script that runs a single test.

---

## Layer 1 — CLAUDE.md (Memory)

> *Always loaded. Always active. The project's constitution.*

This file is the project memory layer. It must capture what future Claude can't derive from the file system alone.

### What's in this layer

| Section | Purpose |
|---|---|
| `architecture.rules` (below) | How routes, providers, mocks, and platform splits fit together |
| `naming.conventions` (below) | File names, function names, casing, alias `@/*` |
| `test.expectations` (below) | `pnpm check` is the gate. No unit tests yet |
| `repo.map` (below) | Where every layer lives + why |

### architecture.rules

#### Route groups (`app/`)

Expo Router 4 with `expo-router/entry`. Routes are file-based; route groups use parentheses and don't show in URLs.

- **`(public)/`** — `Tabs` host. The 6 visible tabs are wired in `app/(public)/_layout.tsx`: `home`, `events`, `discover`, `shop`, `library-tab`, `profile-tab`. **All other public sub-routes** (stream, vod, clip, event detail, channel, apps, calendar, api-access, etc.) are registered as `<Tabs.Screen ... options={{ href: null }} />` so they exist as routes but stay out of the tab bar. **When you add a new public route, you MUST also register it with `href: null` in this layout** or it auto-injects a tab. See the `route-register` skill for the recipe.
- **`(auth)/`** — login / signup / forgot / reset / verify / onboarding. Header hidden, slide-from-bottom.
- **`(authed)/`** — gated by `useMockAuth()`; redirects unauthenticated visitors to `/(auth)/login`. `Stack` navigator. Houses profile, library, watch-parties, fantasy, pickem, predictions, creator-dashboard, settings, cart, checkout, multi-stream, rewards, integrations, notifications, etc.
- **`(admin)/`** — same gate plus `user.role !== "admin"` redirect to `/`.
- **`(embed)/`** — iframe-style player screens; black background, fade animation.

`app/_layout.tsx` is the root: `GestureHandlerRootView` → `SafeAreaProvider` → `Providers` → `SplashGate` → `KeyboardAvoidingView` → root `Stack`. `app/index.tsx` redirects to `/(public)/home`.

#### Providers (`components/providers/`)

Order matters. `Providers` composes (outer → inner): `ThemeProvider` → `QueryProvider` → `MockAuthProvider` → children + `<Toaster>` + dev-only `<RoleSwitcher>`.

- **`MockAuthProvider`** — currently the only auth. Picks a profile from `lib/mock/users.ts` by role (`guest|user|premium|admin`), persists `{role,userId}` to AsyncStorage under `evotv:current-user`. Also owns the follows set (`evotv:follows`) and onboarding flag (`evotv:onboarded`). Exposes `useMockAuth()` with `login/logout/switchRole/toggleFollow/isFollowing/updateProfile/completeOnboarding`.
- **`SplashGate`** — holds the splash screen until fonts AND auth hydration finish.
- **`RoleSwitcher`** — `__DEV__`-only floating widget for swapping roles without a real login.

#### Data layer — `lib/mock/`

Every screen reads from `lib/mock/<feature>.ts`. Functions return plain objects (or pagination wrappers from `paginate()` in `_util.ts`). `lib/mock/index.ts` is a barrel — but **three modules are deliberately not re-exported**:

- `predictions` and `tips` both export `getCoinBalance` (collision) and `predictions` also exports `getTeamById` (collision with `teams`). Import them directly with renamed bindings:
  ```ts
  import { getCoinBalance as getPredictionsBalance } from "@/lib/mock/predictions";
  import { getCoinBalance as getWalletBalance, sendTip } from "@/lib/mock/tips";
  ```
- `lite-mode` is `"use client"` — re-exporting it would taint the barrel client-only.

See the `mock-feature-add` skill before extending this layer.

#### Persistence — `lib/storage/persist.ts`

Two surfaces over AsyncStorage:

- **Async** (`persist.get/set/remove`) — JSON-typed; use from effects and providers.
- **Sync-feeling** (`syncGet/syncSet/syncRemove`) — in-memory mirror that hydrates lazily. **Why it exists:** the web app's mocks call `localStorage.getItem` synchronously; AsyncStorage has no sync API. First call returns `null` (matches web SSR branch), kicks off hydration, then subsequent ticks see the real value. Don't replace these with `await persist.get` blindly.

#### Phase 1A backend swap

App is currently 100% mock. When the web app exposes `/api/*` with bearer tokens, follow the `phase1a-swap` skill. Short version: mirror `lib/mock/<feature>.ts` → `lib/api/<feature>.ts` with identical signatures, swap import sources one line per call site, replace `MockAuthProvider` with Better-Auth, store JWT in `expo-secure-store` on native (NOT on web — falls back to `localStorage`).

#### Platform splits

Metro resolves `*.web.tsx` over `*.tsx` on the web target. Canonical example: `components/stream/hls-player.tsx` (native, `expo-video`) vs `hls-player.web.tsx` (web, `<video>` + `hls.js`). Same prop shape, same exports. See the `platform-split` skill for the recipe.

#### Theme + tokens

Dark-first. Brand cyan `#2CD7E3`. Background `#0A0A0A` (Stack/Tabs hardcode this; keep in sync if it ever changes). Fonts: Geist + Geist Mono via `expo-font`. `tailwind.config.js` defines the full shadcn semantic palette. `lib/theme/tokens.ts` is a small duplicate for places that need raw color values in JS.

### naming.conventions

- TS `strict: true`. Path alias `@/*` → repo root. `experiments.typedRoutes` on in `app.json` — let Expo Router generate `.expo/types/router.d.ts`; don't hand-edit.
- Imports: `@/components/...`, `@/lib/...`. Avoid deep relatives outside a feature folder.
- Money fields end in `Ngn` (`priceNgn`, `subtotalNgn`, ...). Stored in NGN as integers.
- All IDs are string UUIDs (`UUID = string`). All timestamps ISO 8601 strings (`ISODate = string`).
- Screen file naming: always `app/<group>/<route>/index.tsx`, not `app/<group>/<route>.tsx`.
- Storage keys namespaced `evotv:<scope>`.

### test.expectations

- `pnpm typecheck` is the green-light gate. Treat tsc errors as ship-blockers.
- No Jest / Vitest / Mocha. Don't add one without a brief.
- For UI changes: run `pnpm start` or `pnpm web` and walk the affected flow. Watch console for red.
- Phase 1A code: walk auth → restart app → confirm session persists.

### repo.map

```
EVOTV-app/
├── app/                     # Expo Router file-based routes
│   ├── (auth)/              # login, signup, forgot, verify, onboarding
│   ├── (public)/            # Tabs host — 6 tabs + many href:null routes
│   ├── (authed)/            # Stack, auth-gated
│   ├── (admin)/             # Stack, admin-gated
│   ├── (embed)/             # iframe-style player
│   ├── _layout.tsx          # root: GestureHandler → SafeArea → Providers → SplashGate → Stack
│   └── index.tsx            # redirect → /(public)/home
├── components/
│   ├── ui/                  # NativeWind shadcn twins (_stub.tsx for unported)
│   ├── providers/           # Theme, Query, MockAuth, SplashGate, RoleSwitcher, FontLoader
│   └── <domain>/            # feature-scoped (home, stream, vod, profile, library, shop, events, creators, admin, ...)
├── lib/
│   ├── mock/                # data source. lib/mock/index.ts barrel (with collision exclusions)
│   ├── storage/persist.ts   # AsyncStorage helpers + sync mirror
│   ├── theme/tokens.ts      # JS-side color tokens
│   ├── types.ts             # shared TS types (UUID, ISODate, Profile, Stream, ...)
│   └── utils.ts             # cn() = twMerge(clsx())
├── assets/                  # icons, splash, Geist fonts (manual drop)
├── tailwind.config.js       # full shadcn semantic palette + brand cyan
├── metro.config.js          # withNativeWind(global.css)
├── babel.config.js          # babel-preset-expo with jsxImportSource: "nativewind" + reanimated/plugin
├── app.json                 # web.output: "single" (SPA), typedRoutes, scheme "evotv", bundle id com.evotv.app
├── vercel.json              # web SPA build → dist/, rewrites /(.*) → /index.html
└── .claude/                 # 5-layer ADK scaffold (this directory)
    ├── skills/              # Layer 2 — project knowledge
    ├── hooks/               # Layer 3 — guardrail scripts (inactive until wired)
    ├── agents/              # Layer 4 — delegation subagents
    └── plugins/             # Layer 5 — distribution bundle
```

---

## Layer 2 — Skills (Knowledge)

> *On-demand. Modular. Description-matched, auto-invoked context.*

Project-local skills live under `.claude/skills/`. Each `SKILL.md` carries a description Claude matches against; the relevant skill gets pulled into context only when needed.

| Skill | When to use |
|---|---|
| [`mock-feature-add`](./.claude/skills/mock-feature-add/SKILL.md) | Adding new `lib/mock/<feature>.ts` — covers signature-mirror rule + barrel collision exclusions |
| [`route-register`](./.claude/skills/route-register/SKILL.md) | Adding a public route — must register in `(public)/_layout.tsx` with `href: null` unless a tab |
| [`platform-split`](./.claude/skills/platform-split/SKILL.md) | Creating `.web.tsx` variants — canonical example: `hls-player` |
| [`expo-screen-scaffold`](./.claude/skills/expo-screen-scaffold/SKILL.md) | Scaffolding a brand-new screen — group selection, header inheritance, dark theme |
| [`phase1a-swap`](./.claude/skills/phase1a-swap/SKILL.md) | Swapping mock data for real `/api/*` once the backend ships |

### Skill folder shape

```
.claude/skills/<skill-name>/
├── SKILL.md      # description Claude matches against
├── scripts/      # (optional) reference scripts the skill calls
├── templates/    # (optional) boilerplate the skill copies in
└── assets/       # (optional) images, fonts, configs
```

---

## Layer 3 — Hooks (Guardrail)

> *Deterministic shell. Not AI. Fires on agent events.*

Hook scripts live under `.claude/hooks/`. They are **inactive until wired into `.claude/settings.json`** — Claude Code's auto-classifier rightly blocks auto-installing self-executing hooks. To activate, drop the snippet below into `.claude/settings.json` after reviewing each script.

### What ships

| File | When | Behavior |
|---|---|---|
| `.claude/hooks/SessionStart.sh` | Session start | Prints stack + 5 critical reminders (route registration, mock barrel collisions, platform split, persistence surfaces, verification gate) |
| `.claude/hooks/PreToolUse.sh` | Before every tool | Blocks `rm -rf /|~|.|node_modules|.expo|dist`, force-push to main/master, `--no-verify`, `--no-gpg-sign` |
| `.claude/hooks/PostToolUse.sh` | After every tool | Appends an audit entry to `.claude/audit/tool-use.log` |
| `.claude/hooks/SubagentStop.sh` | After every subagent run | Appends subagent name + timestamp to the audit log |

### Activation snippet (review first, then merge into `.claude/settings.json`)

```jsonc
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "SessionStart": [
      { "matcher": "startup|clear|compact",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/SessionStart.sh" }] }
    ],
    "PreToolUse": [
      { "matcher": "Bash|PowerShell",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/PreToolUse.sh" }] }
    ],
    "PostToolUse": [
      { "matcher": "*",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/PostToolUse.sh" }] }
    ],
    "SubagentStop": [
      { "matcher": "*",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/SubagentStop.sh" }] }
    ]
  }
}
```

Windows note: scripts use `#!/usr/bin/env bash` — runs via Git Bash, WSL, or any POSIX shell on PATH. The `bash` invocation in the JSON is the same on Windows + macOS + Linux.

---

## Layer 4 — Subagents (Delegation)

> *Own context window. Returns ONE message. Keeps the main thread clean.*

Project-local subagents live under `.claude/agents/`. Dispatch with `Agent({ subagent_type: "<name>" })` when work is independent or research is too noisy for the main thread.

| Agent | Role |
|---|---|
| [`code-reviewer`](./.claude/agents/code-reviewer.md) | Reviews diffs against EVOTV-app conventions: route registration, mock barrel, platform split, theme tokens, persistence boundaries |
| [`test-runner`](./.claude/agents/test-runner.md) | Runs `pnpm typecheck` (the green-light gate). Optionally `pnpm lint` |
| [`explorer`](./.claude/agents/explorer.md) | Read-only mapper: route locations, mock data graph, provider order, platform-split inventory |
| [`feature-dev`](./.claude/agents/feature-dev.md) | End-to-end feature builder: plans group → scaffolds screen → wires mock → registers route → verifies |

### Dispatch rules

- Independent work → parallel (multi-tool-call in one message).
- Dependent work → sequential.
- Brief like a smart colleague who just walked in: goal + file/line refs + length cap.
- Trust but verify: agent summary ≠ what it actually did. Diff before claiming done.

---

## Layer 5 — Plugins (Distribution)

> *Bundle. Ship. Install. One package, every teammate aligned.*

`.claude/plugins/evotv-app-kit/` packages the project's skills, agents, and hook scripts as a distributable plugin.

```
.claude/plugins/evotv-app-kit/
└── .claude-plugin/
    └── plugin.json    # manifest: name, version, skills[], agents[], hooks[]
```

The manifest references files in sibling `.claude/skills/`, `.claude/agents/`, `.claude/hooks/` via relative paths so the same scaffold serves as both local project context AND a publishable plugin.

### Future publish

1. Bump `version` in `plugin.json`.
2. Push the `.claude/plugins/evotv-app-kit/` subtree to its own marketplace repo (or use a monorepo marketplace).
3. Teammates: `claude plugin install evotv-app-kit` to get all skills + agents + hook scripts in one shot.

---

## MCP Servers (side rail)

External tools wired in at the user level. Project-local additions go in `.claude/settings.local.json` (`enabledMcpjsonServers`).

Currently enabled for this repo:

- `supabase` — enabled per `.claude/settings.local.json` (use only when explicitly asked).

---

## Project workflow (top-level non-negotiables)

> Per `../CLAUDE.md` (parent project memory).

1. **Plan-first** for non-trivial work (3+ steps or architectural). If something goes sideways: stop and re-plan.
2. **Subagents liberally** — offload research, parallel analysis, multi-module build.
3. **Self-improvement loop** — after any correction, update `tasks/lessons.md` with the pattern.
4. **Verification before done** — never claim complete on build pass alone. Walk the flow. Diff against `main` when relevant.
5. **Design parity** — every new page must read as the same designer who built `/wallets`, `/user-profile`, `/tournaments`.
6. **Elegance when warranted** — for non-trivial changes ask "is there a more elegant way?" Skip for obvious fixes.
7. **Autonomous bug fixing** — just fix it. Point at logs, errors, failing tests; resolve them.

---

## Env

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3060
EXPO_PUBLIC_PAYMENT_PROVIDER=mock
```

`EXPO_PUBLIC_*` is the only prefix RN reads at build time.

---

## Known follow-ups

- `lib/mock/calendar.ts` `downloadIcs()` is a no-op shim — wire `expo-file-system` + `expo-sharing` when calendar feature lands.
- `(public)/_layout.tsx` uses `name="home/index"` form. If routes ever stop resolving after an Expo Router upgrade, try folder-only `name="home"`.
- Embed + API-access screens are heavy on web-iframe semantics — rebuild RN-native or hide on app target.
- Watch-history / follow-aggregator / downloads-as-VODs shapes still need wiring inside library + profile screens.
- Geist `.ttf` files in `assets/fonts/` — drop the five files before first run or accept system-font fallback.
