import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: !options.watch, // Disable DTS generation in watch mode
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ["@astrojs/compiler", "astro", "vite"],
}));
