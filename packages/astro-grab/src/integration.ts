import type { AstroIntegration } from "astro";
import { astroGrabVitePlugin } from "astro-grab-server";
import type { AstroGrabOptions } from "astro-grab-shared";

export const astroGrab = (options: AstroGrabOptions = {}): AstroIntegration => {
  const {
    enabled = true,
    /* TODO: set this up later holdDuration = 1000,*/ contextLines = 4,
    autoInject = true,
  } = options;

  return {
    name: "astro-grab",

    hooks: {
      "astro:config:setup": ({ updateConfig, injectScript, command, logger }) => {
        if (command !== "dev" || !enabled) {
          return;
        }

        logger.info("Initializing...");

        updateConfig({
          vite: {
            plugins: [astroGrabVitePlugin({ contextLines })],
          },
        });
        logger.info("Astro Vite plugin enabled");

        if (autoInject) {
          injectScript("page", `import "astro-grab-client/auto";`);
          logger.info(
            `Client script injected. Use crtl/cmd+g on your Astro site to select components.`,
          );
        }
      },
    },
  };
};
