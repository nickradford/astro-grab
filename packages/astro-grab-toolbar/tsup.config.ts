import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/app.ts"],
  format: ["esm"],
  dts: true,
  external: ["astro/toolbar", "astro"],
  clean: true,
  shims: true,
});
