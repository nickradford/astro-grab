import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: [
    "src/index.ts",
    "src/client/index.ts",
    "src/client/auto.ts",
    "src/toolbar/index.ts",
    "src/toolbar/app.ts",
  ],
  format: ["esm"],
  dts: !options.watch, // Disable DTS generation in watch mode
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ["astro", "vite", "astro/toolbar", "@astrojs/compiler"],
}));
