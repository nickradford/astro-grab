import { defineConfig } from "astro/config";
import { astroGrab } from "astro-grab";

import tailwindcss from "@tailwindcss/vite";
import vercelServerless from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  integrations: [astroGrab()],
  output: "server",
  adapter: vercelServerless(),
  vite: {
    plugins: [tailwindcss()],
  },
});
