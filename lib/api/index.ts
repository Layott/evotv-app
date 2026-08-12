/**
 * The app's data layer. Every screen reads from here.
 *
 * This was described as a "mirror of lib/mock/*", which it no longer is: the
 * mock layer is gone, so there is nothing to mirror and nothing to swap. If a
 * feature is not in this directory, the app does not have it, and the honest
 * move is a ComingSoon screen rather than a module that returns invented rows.
 *
 * Backend lives at process.env.EXPO_PUBLIC_API_BASE_URL, which points at the
 * Next app: port 3060 in local dev, https://api.evotv.co in production.
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

// `chat` is not re-exported: it is imported directly by the one component that
// uses it, and keeping it out of the barrel keeps its error class from
// colliding.
//
// Features the app shows as ComingSoon, waiting on backend routes rather than
// on client work: pick'em, predictions, tips listings, fantasy, creators,
// watch parties, USSD, cast, embed, captions, commentary, forensic marks,
// auto-clips, partners. Each had a module here or under lib/mock that returned
// fabricated rows; they were deleted rather than left to be wired up by
// somebody who assumed they were real.
