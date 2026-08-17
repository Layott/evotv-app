# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Org model:** project follows the 5-layer Agent Development Kit (ADK).
> `CLAUDE.md sets rules → Skills provide expertise → Hooks enforce quality → Subagents delegate work → Plugin distributes the bundle.`

---

## Project - at a glance

EVO TV native app - iOS / Android / Android TV + web SPA. Sibling of the web repo at `../EVOTV/`; mirrors the same brand, data shapes, screens, and flows.

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

## Layer 1 - CLAUDE.md (Memory)

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

- **`(public)/`** - `Tabs` host. The 6 visible tabs are wired in `app/(public)/_layout.tsx`: `home`, `events`, `discover`, `shop`, `library-tab`, `profile-tab`. **All other public sub-routes** (stream, vod, clip, event detail, channel, apps, calendar, api-access, etc.) are registered as `<Tabs.Screen ... options={{ href: null }} />` so they exist as routes but stay out of the tab bar. **When you add a new public route, you MUST also register it with `href: null` in this layout** or it auto-injects a tab. See the `route-register` skill for the recipe.
- **`(auth)/`** - login / signup / forgot / reset / verify / onboarding. Header hidden, slide-from-bottom.
- **`(authed)/`** - gated by `useAuth()`; redirects unauthenticated visitors to `/(auth)/login`. `Stack` navigator. Houses profile, library, watch-parties, fantasy, pickem, predictions, creator-dashboard, settings, cart, checkout, multi-stream, rewards, integrations, notifications, etc.
- **`(admin)/`** - same gate plus `user.role !== "admin"` redirect to `/`.
- **`(embed)/`** - iframe-style player screens; black background, fade animation.

`app/_layout.tsx` is the root: `GestureHandlerRootView` → `SafeAreaProvider` → `Providers` → `SplashGate` → `KeyboardAvoidingView` → root `Stack`. `app/index.tsx` redirects to `/(public)/home`.

#### Providers (`components/providers/`)

Order matters. `Providers` composes (outer → inner): `ThemeProvider` → `QueryProvider` → `AuthProvider` → children + `<Toaster>` + dev-only `<RoleSwitcher>`.

- **`AuthProvider`** (`components/providers/auth-provider.tsx`) - real auth against Better-Auth on the backend. Holds the bearer token, maps the backend user onto `Profile` (`name` → `displayName`, `image` → `avatarUrl`; do not cast, the field names differ), and owns the follows set (`evotv:follows`) and the onboarding flag (`evotv:onboarded`). Exposes `useAuth()`. The `useMockAuth` alias it used to carry is gone, along with the ~40 imports of that name: only the name was ever mock.
- **`SplashGate`** - holds the splash screen until fonts AND auth hydration finish.
- **`RoleSwitcher`** - `__DEV__`-only floating widget for swapping roles without a real login.

#### Data layer - `lib/api/`

**`lib/mock/` is gone** (deleted 2026-08-12, 44 files, ~7.8k lines). Every screen reads from `lib/api/<feature>.ts`, which talks HTTP to the Next backend at `EXPO_PUBLIC_API_BASE_URL`. Nothing in the app fabricates data any more.

If a feature has no backend route, the screen renders `ComingSoon`. Do not add a module that returns invented rows to fill the gap: `pickem`, `predictions` and `tips` were exactly that, wrappers over fabricated data that no screen called, and they were deleted with the mock layer. An empty screen is a missing feature; a fabricated one is a lie that ships.

<details>
<summary>Historical: the mock barrel's collision rules</summary>

The deleted `lib/mock/index.ts` was a barrel with three modules deliberately not re-exported:

- `predictions` and `tips` both export `getCoinBalance` (collision) and `predictions` also exports `getTeamById` (collision with `teams`). Import them directly with renamed bindings:
  ```ts
  import { getCoinBalance as getPredictionsBalance } from "@/lib/mock/predictions";
  import { getCoinBalance as getWalletBalance, sendTip } from "@/lib/mock/tips";
  ```
- `lite-mode` is `"use client"` - re-exporting it would taint the barrel client-only.

The `mock-feature-add` and `phase1a-swap` skills under `.claude/skills/` describe this layer and the swap away from it. Both are now history; the swap happened.

</details>

#### Persistence - `lib/storage/persist.ts`

Two surfaces over AsyncStorage:

- **Async** (`persist.get/set/remove`) - JSON-typed; use from effects and providers.
- **Sync-feeling** (`syncGet/syncSet/syncRemove`) - in-memory mirror that hydrates lazily. **Why it exists:** the web app's mocks call `localStorage.getItem` synchronously; AsyncStorage has no sync API. First call returns `null` (matches web SSR branch), kicks off hydration, then subsequent ticks see the real value. Don't replace these with `await persist.get` blindly.

#### Auth, and what "Phase 1A" turned into

That swap is done. The app authenticates against Better-Auth on the Next backend: real sign-up, sign-in, password reset and email verification, with the bearer token in `expo-secure-store` on native and `localStorage` on web.

Social sign-in is **Google only**. The backend registers a provider solely when its client id and secret are both set, and there is no Apple pair, so `/api/mobile-auth/start` rejects anything but `google`. The Apple buttons were removed on 2026-08-12; they only ever raised a "coming soon" toast.

#### Platform splits

Metro resolves `*.web.tsx` over `*.tsx` on the web target. Canonical example: `components/stream/hls-player.tsx` (native, `expo-video`) vs `hls-player.web.tsx` (web, `<video>` + `hls.js`). Same prop shape, same exports. See the `platform-split` skill for the recipe.

#### Theme + tokens

Dark-first. **Brand mint `#46E3CE`, background `#05191B`** (changed 2026-08-11; was cyan `#2CD7E3` on `#0A0A0A`). Both are sampled from the wordmark, which is a blue `#42ACE8` to mint `#46E3CE` gradient sitting on the dark teal in `evo-tv-hero.png`. `brand-blue` `#42ACE8` is the blue end.

Border is `#12383A`, deliberately almost invisible: the old `#262626` outlined every card, and the owner rejected that hairline-box look product-wide. Radii are 3/5/7/10, tightened from 6/8/10/14.

**Three files carry this palette and will silently drift:** `tailwind.config.js`, `lib/theme/tokens.ts`, and the web's `EVOTV/app/globals.css`. Change all three together.

Stack/Tabs hardcode the background colour, so keep those in sync too. Fonts: Geist + Geist Mono via `expo-font`; the web uses Bricolage Grotesque for headings and the app does **not** yet (no custom font is bundled, see `docs/` handover).

### naming.conventions

- TS `strict: true`. Path alias `@/*` → repo root. `experiments.typedRoutes` on in `app.json` - let Expo Router generate `.expo/types/router.d.ts`; don't hand-edit.
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
│   ├── (public)/            # Tabs host - 6 tabs + many href:null routes
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
│   ├── api/                 # data source. HTTP to the Next backend. lib/api/index.ts barrel
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
    ├── skills/              # Layer 2 - project knowledge
    ├── hooks/               # Layer 3 - guardrail scripts (inactive until wired)
    ├── agents/              # Layer 4 - delegation subagents
    └── plugins/             # Layer 5 - distribution bundle
```

---

## Layer 2 - Skills (Knowledge)

> *On-demand. Modular. Description-matched, auto-invoked context.*

Project-local skills live under `.claude/skills/`. Each `SKILL.md` carries a description Claude matches against; the relevant skill gets pulled into context only when needed.

| Skill | When to use |
|---|---|
| ~~`mock-feature-add`~~ | Obsolete. The mock layer it describes was deleted on 2026-08-12 |
| [`route-register`](./.claude/skills/route-register/SKILL.md) | Adding a public route - must register in `(public)/_layout.tsx` with `href: null` unless a tab |
| [`platform-split`](./.claude/skills/platform-split/SKILL.md) | Creating `.web.tsx` variants - canonical example: `hls-player` |
| [`expo-screen-scaffold`](./.claude/skills/expo-screen-scaffold/SKILL.md) | Scaffolding a brand-new screen - group selection, header inheritance, dark theme |
| ~~`phase1a-swap`~~ | Obsolete. The swap it describes is done; the app is on `lib/api/*` |

### Skill folder shape

```
.claude/skills/<skill-name>/
├── SKILL.md      # description Claude matches against
├── scripts/      # (optional) reference scripts the skill calls
├── templates/    # (optional) boilerplate the skill copies in
└── assets/       # (optional) images, fonts, configs
```

---

## Layer 3 - Hooks (Guardrail)

> *Deterministic shell. Not AI. Fires on agent events.*

Hook scripts live under `.claude/hooks/`. They are **inactive until wired into `.claude/settings.json`** - Claude Code's auto-classifier rightly blocks auto-installing self-executing hooks. To activate, drop the snippet below into `.claude/settings.json` after reviewing each script.

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

Windows note: scripts use `#!/usr/bin/env bash` - runs via Git Bash, WSL, or any POSIX shell on PATH. The `bash` invocation in the JSON is the same on Windows + macOS + Linux.

---

## Layer 4 - Subagents (Delegation)

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

## Layer 5 - Plugins (Distribution)

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

- `supabase` - enabled per `.claude/settings.local.json` (use only when explicitly asked).

---

## Project workflow (top-level non-negotiables)

> Per `../CLAUDE.md` (parent project memory).

1. **Plan-first** for non-trivial work (3+ steps or architectural). If something goes sideways: stop and re-plan.
2. **Subagents liberally** - offload research, parallel analysis, multi-module build.
3. **Self-improvement loop** - after any correction, update `tasks/lessons.md` with the pattern.
4. **Verification before done** - never claim complete on build pass alone. Walk the flow. Diff against `main` when relevant.
5. **Design parity** - every new page must read as the same designer who built `/wallets`, `/user-profile`, `/tournaments`.
6. **Elegance when warranted** - for non-trivial changes ask "is there a more elegant way?" Skip for obvious fixes.
7. **Autonomous bug fixing** - just fix it. Point at logs, errors, failing tests; resolve them.

---

## Env

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3060
EXPO_PUBLIC_PAYMENT_PROVIDER=mock
```

`EXPO_PUBLIC_*` is the only prefix RN reads at build time.

---

## Known follow-ups

- Calendar export: there is no `.ics` builder any more, it went with the mock layer. Wire `expo-file-system` + `expo-sharing` against a real endpoint when the calendar feature lands.
- `(public)/_layout.tsx` uses `name="home/index"` form. If routes ever stop resolving after an Expo Router upgrade, try folder-only `name="home"`.
- Embed + API-access screens are heavy on web-iframe semantics - rebuild RN-native or hide on app target.
- Watch-history / follow-aggregator / downloads-as-VODs shapes still need wiring inside library + profile screens.
- Geist `.ttf` files in `assets/fonts/` - drop the five files before first run or accept system-font fallback.

---

## 🛑 HARD RULE - Design: no hairline borders, no glow (owner, 2026-08-17)

Two bans. Absolute. Every project, every framework, every component. Applies to code I write AND designs I propose.

### Ban 1 - No hairline / outlined anything

Never build structure out of 1px strokes. Banned shapes:

- **outlined card** - thin line rectangle drawn around content
- **outlined pill / chip** - filter chips with a ring (`All games`, `Streams`, `Teams`, ...)
- **divider / rule** - line between rows, list items, or sections
- **dashed placeholder box** - dashed outline empty state ("No events match your filters.")
- any empty state or section that is just a thin-line rectangle with centered text

Grep-level ban (CSS, Tailwind, RN, SwiftUI, Flutter):
`border`, `border-t|b|l|r`, `border-1`, `1px solid`, `border-dashed`, `divide-x`, `divide-y`, `ring-1`, `ring-2`, `outline: 1px`, `<hr>`, `Divider`, `BorderSide`, `.border(...)`, `stroke` on container frames.

Build hierarchy with **surface + space**, not lines:

| Instead of | Use |
|---|---|
| outlined card | filled surface, bg one step off the page bg, radius 12-16px, no stroke |
| outlined chip | filled chip (muted bg). Selected = stronger fill + text color. Never a ring |
| divider line | whitespace, or a background step between sections |
| dashed empty box | centered muted text on the page bg, or a filled muted surface. No dashes |
| `<hr>` | more margin |
| table row lines | zebra fill or row padding |

Only exceptions: `:focus-visible` a11y focus ring (required, keep it), native form controls the platform draws itself, and an explicit user request for a border in that specific spot.

### Ban 2 - No glow, halos, or ambient animation

Never: glowing dots or orbs, neon halos, pulsing / breathing accents, animated gradient blobs, blurred color bloom behind elements. They always end up glowing or animating, and it looks cheap.

Grep-level ban:
`box-shadow: 0 0 <n> <color>`, `shadow-[0_0_...]`, `drop-shadow(0 0`, colored `text-shadow`, `filter: blur()` on decorative orbs, `blur-2xl` / `blur-3xl` background circles, `animate-pulse`, `animate-ping`, `@keyframes glow|pulse|breathe|shimmer`, `shadow-<color>-500/50`.

Replacements:
- live / status indicator: solid flat dot, no glow, no pulse. Or a text label plus color
- emphasis: color, weight, size, fill. Not light bloom
- shadows: neutral black elevation only (soft, downward, low opacity). Never colored, never centered bloom

### Pre-ship check

Screenshot the page (desktop + mobile). If any rectangle is drawn by a thin line, or anything glows or throbs, fix it before showing the user. Both bans outrank any design skill, template, or component library default.

---

## 🛑 HARD RULE - No vibecoded look (owner, 2026-08-17)

Source: aj.on.ai reel, "30 reasons your site looks vibecoded". If a stranger can tell an LLM generated the UI in 3 seconds, it is wrong. Redo it. Sits on top of the hairline-border + glow bans, never replaces them.

### A. Color and light - BANNED

- harsh gradients (hero washes, button gradients, big multi-hue sweeps)
- rainbow coloring (multi-hue accents with no system)
- purple + black as the default palette. Also the violet/indigo-on-dark AI look
- neon colors and neon accents
- generic pastel palette (baby blue / blush pink / mint / butter card sets)
- radial orbs, blurred color blobs, aurora backgrounds
- **blinking / pulsing neon dot** (the "live" dot with a breathing ring). Static solid dot or a text label. No pulse, no glow, no ping, ever

Use instead: one committed brand hue, neutrals doing most of the work, colors carrying meaning (live, win, loss, alert), flat fills.

### B. Layout cliches - BANNED

- 3 feature cards in a row
- bento grid
- dot-grid or graph-paper background
- 3-tier pricing table (good / better / best columns)
- fake terminal window mock
- colored left stripe / accent bar on cards and callouts
- checkmark bullet lists
- outlined cards, ring chips, divider lines, dashed empty boxes (see the hairline ban)

Use instead: layouts driven by the real content and its hierarchy. Asymmetry is allowed. Different section shapes per section.

### C. Icons and type - BANNED

- default Lucide icon set dropped in unchanged
- sparkle / star "AI" icons
- emoji used as UI (icons, bullets, status, buttons). Emoji in real user content is fine
- Inter, Geist, Space Grotesk as the default typeface

Use instead: a chosen type pairing with a real reason behind it, and an icon set that matches the product weight (or the platform's own set). If no direction is given, ask before picking.

### D. Copy - BANNED

- em dashes and en dashes (already a global hard rule)
- "it's not X, it's Y" construction, and its cousins ("not just a Z, but a W")
- fake testimonials, fake logo walls, invented stats or user counts
- filler marketing voice with no concrete claim

Use instead: real names, real numbers, real quotes. If it does not exist yet, say what the thing does in plain words.

### E. Surface and depth - BANNED

- pure white (`#fff`) page background. Also pure black (`#000`)
- drop shadows sprinkled on everything
- liquid glass / frosted glass / heavy backdrop blur panels
- one soft corner radius applied uniformly to every element

Use instead: off-white or a real dark surface, a small radius scale used with intent (small elements small radius, big surfaces bigger), elevation only where something genuinely floats.

### F. Motion - BANNED

- hover animation on everything (lift, scale, glow, translate)
- animated arrows, marching chevrons, bouncing CTAs
- sparkle / shimmer / breathing effects

Use instead: instant state changes (fill, color, weight) for hover. Motion only for real feedback: opening, closing, loading, arriving. Respect `prefers-reduced-motion`.

### G. Missing pieces that scream vibecoded - REQUIRED

- **real product demo**: real screenshots, real data, real video. Not a mock frame with placeholder text
- **loading, empty, and error states**: skeletons or a real loader, a written empty state, a real error path. Every list and page
- **Terms of Service** and **Privacy Policy** pages that exist and are linked, on anything public facing
- real content everywhere. No lorem ipsum, no `Feature One`, no placeholder avatars shipped

### Pre-ship check

Ask: could this be any AI-generated landing page from this year? If yes, it is not done. Screenshot desktop + mobile, walk the list above, fix every hit before showing the user.
