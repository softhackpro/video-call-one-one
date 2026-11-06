import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  // react-native-webrtc / react-native-incall-manager are peer deps —
  // never bundle them in, the consumer's own copy (with native code linked)
  // must be the one used at runtime.
  external: [
    "react",
    "react-native",
    "react-native-webrtc",
    "react-native-incall-manager",
    "@coaching-webrtc/core",
  ],
});
