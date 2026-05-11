/**
 * HTTP-backed API mirror of lib/mock/*.
 *
 * Mirrors mock signatures so the Phase 1A swap is one import flip per call site:
 *   - from "@/lib/mock/events"  →  from "@/lib/api/events"
 *
 * Same barrel collision rules apply as the mock layer: predictions / tips /
 * lite-mode are intentionally NOT re-exported (would collide on getCoinBalance
 * and friends). Import those modules directly with renames.
 *
 * Backend lives at process.env.EXPO_PUBLIC_API_BASE_URL — points at the
 * ../EVOTV/ Next.js app (port 3060 in local dev, evo-tv.vercel.app in prod).
 */
export * from "./events";
export * from "./games";
export * from "./teams";
export * from "./players";
export * from "./streams";
export * from "./vods";
export * from "./search";
export * from "./polls";
export * from "./notifications";
export * from "./follows";

// Modules to mirror as backend routes land:
//   - admin, ads, chat, likes, orders, payments, products, push,
//     recommendations, subscriptions, teams, trending, users, vod-progress
//   - predictions / tips / lite-mode — collision, import directly with rename
//   - feature-specific: pickem, fantasy, rewards, creators, payment-methods,
//     ussd, downloads, apps, cast, embed, bots, sso, captions, ai-commentary,
//     commentary-tracks, forensic, api-keys, calendar, auto-clips, partners,
//     watch-parties
