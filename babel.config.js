// NativeWind v4's `nativewind/babel` preset wraps `react-native-css-interop/babel`,
// which unconditionally adds `react-native-worklets/plugin` (only needed for
// reanimated 4+). On RN 0.76 + reanimated 3.16 this either fails to resolve
// (worklets not installed) or produces a duplicate libworklets.so at gradle
// merge. Inline the css-interop preset minus the worklets plugin.
const cssInteropBabelPlugin =
  require("react-native-css-interop/dist/babel-plugin").default;

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
    plugins: [
      cssInteropBabelPlugin,
      [
        "@babel/plugin-transform-react-jsx",
        { runtime: "automatic", importSource: "react-native-css-interop" },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
