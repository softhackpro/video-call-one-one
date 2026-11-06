import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "@coaching-webrtc/core"],
  // Whole package is client-only (hooks + browser/WebRTC APIs). Inject "use
  // client" at the top of the built output so Next.js App Router accepts it
  // without every consumer needing their own directive/boundary file.
  // Verify this survives against a real Next.js app before publishing —
  // directive-stripping-by-bundler is a known footgun for npm UI packages.
  outputOptions: {
    banner: '"use client";',
  },
});
