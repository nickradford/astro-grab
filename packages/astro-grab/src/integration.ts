import type { AstroIntegration } from "astro";
import { astroGrabVitePlugin } from "astro-grab-server";
import type { AstroGrabOptions } from "astro-grab-shared";

export const astroGrab = (options: AstroGrabOptions = {}): AstroIntegration => {
  const {
    enabled = true,
    holdDuration = 1000,
    contextLines = 4,
    autoInject = true,
    hue = 30,
    debug = false,
  } = options;

  return {
    name: "astro-grab",

    hooks: {
      "astro:config:setup": ({ updateConfig, injectScript, command, logger }) => {
        if (command !== "dev" || !enabled) {
          return;
        }

        logger.info("Initializing...");
        logger.info(`[astro-grab] Config: enabled=${enabled}, holdDuration=${holdDuration}, contextLines=${contextLines}, autoInject=${autoInject}, hue=${hue}, debug=${debug}`);

        updateConfig({
          vite: {
            plugins: [astroGrabVitePlugin({ hue, contextLines })],
          },
        });
        logger.info("Astro Vite plugin enabled");

        if (autoInject) {
          const script = `import { AstroGrab } from "astro-grab-client";
const instance = new AstroGrab({ holdDuration: ${holdDuration}, contextLines: ${contextLines}, hue: ${hue}, debug: ${debug } });
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => instance.init());
} else {
  instance.init();
}`;
          if (debug) {
            logger.info(`[astro-grab] Injecting script: ${script}`);
          }
          injectScript("page", script);
          logger.info(
            `Client script injected. Use crtl/cmd+g on your Astro site to select components.`,
          );
        }
      },
    },
  };
};
