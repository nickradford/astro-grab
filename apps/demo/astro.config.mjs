import { defineConfig } from "astro/config";
import { astroGrab } from "astro-grab";

// https://astro.build/config
export default defineConfig({
  integrations: [
    astroGrab()
  ],
});
