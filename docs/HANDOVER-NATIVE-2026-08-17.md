# Native app handover, 2026-08-17

Live log. The owner walked the app on a phone and reported a list; this records
what each report actually was, what shipped, and what is still open.

## Shipped

### App lock ([#5](https://github.com/Layott/evotv-app/pull/5), branch `fix/app-lock-and-signin`)

Two reports, two causes.

**"Every time you minimize the app, when you open it, you have to unlock it
again."** `RELOCK_AFTER_MS` was 60 seconds, which is the length of replying to
one message. Now 15 minutes.

The worse half: **the unlock prompt was locking the app itself.** iOS reports
`inactive` when a system dialog opens, which the listener already skipped.
Android reports a full `background`, so asking for a fingerprint started the
away clock, and any unlock slower than the window re-locked the instant it
succeeded. `promptingRef` now makes the AppState listener ignore every
transition while our own dialog is open, and the timestamp is cleared on
success.

**"You are supposed to be able to still sign in with email or Google and still
be able to use fingerprint or face unlock simultaneously."** The lock screen
offered biometrics or "Sign out instead" - the same action described as a loss,
with no route to the login form. It now offers **Sign in with email or Google**
as a real second button beside Unlock.

### Coming-soon screens and the Library tab (branch `chore/app-parity`)

**42 route files** rendered a COMING SOON panel and nothing else. Deleted, not
relabelled: `auto-clipper`, `creator-dashboard`, `creator-program`, `fantasy`,
`integrations`, `multi-stream`, `pickem`, `predictions`, `rewards`, `tips`,
`ussd`, `watch-parties`, the whole `(embed)` group, `apps`, `calendar`,
`embed-marketing`, `partners`, `stream/[id]/co-stream`.

Everything pointing at them went too: the `href: null` registrations in
`(public)/_layout.tsx`, the feature-drawer entries, and the drawer's whole
**gated** mechanism (the SOON badge and the sheet that opened a "launching
soon" blurb instead of a screen). `components/home/quick-access.tsx` was
deleted outright - imported by nothing, and a ten-tile rainbow grid with seven
tiles pointing at screens that no longer exist.

**Library** was the only tab that redirected. The tab was a stub calling
`router.replace` into a Stack screen under `(authed)`, which left the tab bar
behind and pushed a different-looking screen over the top - hence "the library
page shows like a separate page and you can still go to a new page". The screen
now lives at `(public)/library-tab/index.tsx` and renders in place like every
other tab. `(authed)/library` is gone.

Verified signed in on web: `/library-tab` keeps all six tab items and does not
change URL; `/rewards`, `/watch-parties`, `/apps` answer Not Found.

## Open, with the owner's decisions recorded

The owner was asked and chose:

| question | answer |
|---|---|
| Light appearance does nothing | **Build a real light theme** |
| App admin is a second CMS | **Rebuild it to match the website** |
| Coming-soon screens | **Delete routes and nav entries** (done) |

### Light theme, and why it is big

`darkMode: "class"` is set and there are **zero `dark:` variants in the entire
app**. There is one fixed dark palette, so the setting has nothing to switch to.

The scale, measured rather than guessed:

- **884 hardcoded hex colours across 130 `.tsx` files.** The top twelve cover
  most of it: `#9FBDBD` (129), `#46E3CE` (129), `#737373` (83), `#05191B` (73),
  `#67E8F9` (68), `#EAF6F5` (64), `#103133` (31).
- `lib/theme/tokens.ts` is a static object, used at 16 sites.
- Navigator chrome (`Stack`/`Tabs` `screenOptions`) hardcodes `#05191B` and
  `#EAF6F5` in several layouts.

The right order:

1. **CSS variables in `global.css`** with `:root` and `.dark:root`, and
   `tailwind.config.js` colours switched to `rgb(var(--x) / <alpha-value>)`.
   NativeWind 4.1 supports this. This themes every `bg-background`,
   `text-foreground`, `bg-card` surface **without touching a single component**,
   and is by far the best value.
2. Turn `lib/theme/tokens.ts` into a `useTokens()` hook so inline styles and
   lucide `color=` props (which need JS values, not classes) can follow.
3. Navigator chrome.
4. The long tail of inline hex. Note that some sit in **module-scope
   constants**, which cannot call a hook, so those need restructuring rather
   than a find-and-replace.

Do not attempt step 4 as a blind codemod.

### App admin rebuild

The app carries **20 admin screens under `(admin)/`** that are a parallel
implementation of the website CMS, which is why it looks nothing like it. It
does open - signing in as an admin and visiting `/admin` works - but the only
link to it is buried in the home feature drawer, which is why the owner
reported it "can't even open".

### Upgrade page

Reads real tiers, but: COMING SOON badges on mobile money and USSD payment
methods, and `Sparkles` / `Star` / `Crown` icons with checkmark bullet lists.
**The website's `/upgrade` has the same icons and checkmark lists**, so
"match the website" here means fixing both to the rule the owner set on
2026-08-17, not copying one into the other.

## Local setup notes

To run the app against the local backend you need **both** ends changed, and
both are reverted after testing:

- `EVOTV-app/.env.local`: `EXPO_PUBLIC_API_BASE_URL=http://localhost:3060`
- `backend/.env.local`: `ALLOWED_ORIGINS` must **list** the origin.
  `ALLOWED_ORIGINS=*` does not work - Better-Auth treats it as a literal, and
  sign-in answers **403**.

Expo web: `pnpm exec expo start --web --port 8090` (8081 is usually taken, and
the CLI cannot prompt in this environment). Not `npx`.
