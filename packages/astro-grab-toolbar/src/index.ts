import type { AstroIntegration } from "astro";

export const astroGrabToolbar = (): AstroIntegration => {
  return {
    name: "astro-grab-toolbar",

    hooks: {
      "astro:config:setup": ({ addDevToolbarApp }) => {
        addDevToolbarApp({
          id: "astro-grab-toolbar",
          name: "Astro Grab",
          icon: "🫳",
          entrypoint: new URL("./app.js", import.meta.url).pathname,
        });
      },
    },
  };
};
