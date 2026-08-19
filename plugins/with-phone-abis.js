/**
 * Ship the two architectures a phone can run, and not the two it cannot.
 *
 * `expo prebuild` writes all four into `android/gradle.properties`:
 * armeabi-v7a, arm64-v8a, x86 and x86_64. The two x86 entries exist for the
 * Android emulator. Measured on build 197 they were 40.8 MB of a 95.7 MB
 * download, so 43% of what a viewer waited for was bytes their device can
 * never execute.
 *
 * The local build script has patched this since August, but a patch in a
 * PowerShell script only helps the builds that script makes. The first cloud
 * build after the move to EAS came out at 99.4 MB for exactly this reason, and
 * went to the website before anybody looked at the number. Prebuild config
 * belongs in the project, where every build sees it.
 *
 * Both ARM entries stay. arm64-v8a covers essentially every phone sold since
 * 2016; armeabi-v7a costs 13.5 MB and keeps the cheap 32-bit devices that are
 * still common in this market.
 *
 * If the emulator is ever needed, pass it for that build rather than putting it
 * back here:  ./gradlew assembleRelease -PreactNativeArchitectures=x86_64
 */
const { withGradleProperties } = require("@expo/config-plugins");

const KEY = "reactNativeArchitectures";
const PHONE_ABIS = "armeabi-v7a,arm64-v8a";

module.exports = function withPhoneAbis(config) {
  return withGradleProperties(config, (cfg) => {
    const existing = cfg.modResults.find(
      (item) => item.type === "property" && item.key === KEY,
    );
    if (existing) {
      existing.value = PHONE_ABIS;
    } else {
      cfg.modResults.push({ type: "property", key: KEY, value: PHONE_ABIS });
    }
    return cfg;
  });
};
