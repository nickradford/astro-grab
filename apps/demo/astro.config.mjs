import { defineConfig } from "astro/config";
import { astroGrab } from "astro-grab";

import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  integrations: [astroGrab()],
  output: "server",
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});
