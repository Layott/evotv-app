#!/usr/bin/env node
/**
 * Generate Play + Apple icon variants + Play feature graphic from
 * assets/icon.png. Output → assets/store/.
 *
 * Rules:
 *   - Play & Apple iconography reject alpha → flatten onto solid black bg.
 *   - Feature graphic 1024×500 PNG: brand-cyan radial bg, logo centered,
 *     "EVO TV" wordmark on right.
 *
 * Run: pnpm exec node scripts/build-store-assets.mjs
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SRC = resolve("assets/icon.png");
const OUT = resolve("assets/store");
const BG_BLACK = { r: 10, g: 10, b: 10, alpha: 1 };
const BRAND_CYAN = "#2CD7E3";

await mkdir(OUT, { recursive: true });

console.log("→ Play icon (512×512, no alpha)");
await sharp(SRC)
  .resize(512, 512, { fit: "contain", background: BG_BLACK })
  .flatten({ background: BG_BLACK })
  .png({ compressionLevel: 9 })
  .toFile(resolve(OUT, "play-icon-512.png"));

console.log("→ Apple icon (1024×1024, no alpha)");
await sharp(SRC)
  .resize(1024, 1024, { fit: "contain", background: BG_BLACK })
  .flatten({ background: BG_BLACK })
  .png({ compressionLevel: 9 })
  .toFile(resolve(OUT, "apple-icon-1024.png"));

console.log("→ Adaptive Android (1024×1024, transparent — Play TV format)");
await sharp(SRC)
  .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(resolve(OUT, "android-adaptive-1024.png"));

console.log("→ Feature graphic (1024×500)");
const logoBuf = await sharp(SRC)
  .resize(360, 360, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const featureBgSvg = `
<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="30%" cy="40%" r="80%">
      <stop offset="0%" stop-color="${BRAND_CYAN}" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="#0A0A0A" stop-opacity="1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="strip" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_CYAN}" stop-opacity="0.0"/>
      <stop offset="50%" stop-color="${BRAND_CYAN}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${BRAND_CYAN}" stop-opacity="0.0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="1010" width="6" height="500" fill="url(#strip)"/>
  <text x="430" y="245" font-family="Geist, Helvetica, Arial, sans-serif" font-size="98" font-weight="800" fill="#FAFAFA" letter-spacing="-2">
    EVO TV
  </text>
  <text x="432" y="295" font-family="Geist, Helvetica, Arial, sans-serif" font-size="22" font-weight="500" fill="${BRAND_CYAN}" letter-spacing="3">
    ESPORTS · ANIME · LIFESTYLE
  </text>
  <text x="432" y="355" font-family="Geist, Helvetica, Arial, sans-serif" font-size="18" font-weight="400" fill="rgba(250,250,250,0.6)">
    Africa's home for live streams, originals, and shows.
  </text>
</svg>`.trim();

await sharp(Buffer.from(featureBgSvg))
  .composite([
    {
      input: logoBuf,
      left: 40,
      top: 70,
    },
  ])
  .png({ compressionLevel: 9 })
  .toFile(resolve(OUT, "play-feature-graphic-1024x500.png"));

console.log("→ Screenshot template (1080×1920, brand frame for device captures)");
const phoneFrameSvg = `
<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_CYAN}" stop-opacity="0.18"/>
      <stop offset="50%" stop-color="#0A0A0A"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="60" y="60" width="960" height="100" rx="20" fill="rgba(44,215,227,0.08)" stroke="rgba(44,215,227,0.3)" stroke-width="1"/>
  <text x="540" y="120" text-anchor="middle" font-family="Geist, Arial, sans-serif" font-size="40" font-weight="700" fill="#FAFAFA">
    [ SCREENSHOT HEADLINE ]
  </text>
  <rect x="60" y="200" width="960" height="1620" rx="40" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="540" y="1010" text-anchor="middle" font-family="Geist, Arial, sans-serif" font-size="32" fill="rgba(250,250,250,0.4)">
    [ Device capture goes here ]
  </text>
  <text x="540" y="1880" text-anchor="middle" font-family="Geist, Arial, sans-serif" font-size="20" letter-spacing="4" fill="${BRAND_CYAN}">
    EVO TV
  </text>
</svg>`.trim();

await sharp(Buffer.from(phoneFrameSvg))
  .png({ compressionLevel: 9 })
  .toFile(resolve(OUT, "phone-screenshot-template-1080x1920.png"));

console.log("\n✓ Generated:");
for (const f of [
  "play-icon-512.png",
  "apple-icon-1024.png",
  "android-adaptive-1024.png",
  "play-feature-graphic-1024x500.png",
  "phone-screenshot-template-1080x1920.png",
]) {
  console.log("  assets/store/" + f);
}
