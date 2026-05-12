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
export * from "./products";
export * from "./orders";
export {
  listTiers,
  getActiveSubscription,
  cancelSubscription,
  type TierId,
  type Tier as SubscriptionTier,
} from "./subs";
export * from "./payments";
export * from "./likes";
export * from "./recommendations";
export * from "./feed";
export * from "./ads";
export * from "./push";
export * from "./vod-progress";
export * from "./rewards";

// Modules to mirror as backend routes land:
//   - admin, chat, users
//   - predictions / tips / lite-mode — collision, import directly with rename
//   - feature-specific: pickem, fantasy, rewards, creators, payment-methods,
//     ussd, downloads, apps, cast, embed, bots, sso, captions, ai-commentary,
//     commentary-tracks, forensic, api-keys, calendar, auto-clips, partners,
//     watch-parties
