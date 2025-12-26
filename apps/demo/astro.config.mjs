import { defineConfig } from "astro/config";
import { astroGrab } from "astro-grab";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [
    astroGrab()
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});