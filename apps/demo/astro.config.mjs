import { defineConfig } from "astro/config";
import { astroGrab } from "astro-grab";
import vercel from "@astrojs/vercel/serverless";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),

  integrations: [astroGrab()],

  vite: {
    plugins: [tailwindcss()],
  },
});
