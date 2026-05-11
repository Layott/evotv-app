#!/usr/bin/env bash
# Layer 3 — Hook: SessionStart
# Fires when a new session begins. Loads EVOTV-app context Claude can't derive
# from the file system alone.

set -eu

cat <<'EOF'
=========================================================
EVOTV-app — session context
=========================================================
Stack: Expo SDK 52 · RN 0.76 (New Arch) · Expo Router 4 · NativeWind v4
Phase: F (mock parity). Phase 1A swap point lives at lib/mock/* → lib/api/*.

CRITICAL REMINDERS
-----------------------------------------------
1. Public routes are TABS by default.
   New file under app/(public)/<route>/index.tsx → must register in
   app/(public)/_layout.tsx with options={{ href: null }} unless it IS a tab.

2. Mock barrel has collisions.
   lib/mock/predictions, lib/mock/tips, lib/mock/lite-mode are NOT re-exported
   from lib/mock/index.ts. Import directly with rename:
     import { getCoinBalance as getPredictionsBalance } from "@/lib/mock/predictions";
     import { getCoinBalance as getWalletBalance } from "@/lib/mock/tips";

3. Platform split is filename-based.
   Component.web.tsx wins on web target. Native Component.tsx wins elsewhere.
   Match exports exactly across both files.

4. Persistence has two surfaces.
   - persist.get/set/remove → async, JSON-typed (default).
   - syncGet/syncSet/syncRemove → sync mirror over AsyncStorage, ONLY for porting web localStorage call sites.

5. Verification gate.
   pnpm typecheck. No unit test runner is wired up.
=========================================================
EOF
