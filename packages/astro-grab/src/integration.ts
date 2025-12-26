import type { AstroIntegration } from "astro";
import { astroGrabVitePlugin } from "astro-grab-server";
import type { AstroGrabOptions } from "astro-grab-shared";
import { astroGrabToolbar } from "astro-grab-toolbar";

export const astroGrab = (options: AstroGrabOptions = {}): AstroIntegration => {
  const {
    enabled = true,
    holdDuration = 1000,
    contextLines = 5,
    autoInject = true,
    hue = 30,
    debug = false,
    toolbar = true,
  } = options;

  return {
    name: "astro-grab",

    hooks: {
      "astro:config:setup": ({
        updateConfig,
        injectScript,
        command,
        logger,
      }) => {
        const forceEnable =
          process.env.ASTRO_GRAB_DANGEROUSLY_FORCE_ENABLE === "true";
        if ((command !== "dev" && !forceEnable) || !enabled) {
          return;
        }

        logger.info("Initializing...");
        logger.info(
          `[astro-grab] Config: enabled=${enabled}, holdDuration=${holdDuration}, contextLines=${contextLines}, autoInject=${autoInject}, hue=${hue}, debug=${debug}, toolbar=${toolbar}`,
        );

        updateConfig({
          vite: {
            plugins: [astroGrabVitePlugin({ hue, contextLines })],
          },
        });
        logger.info("Astro Vite plugin enabled");

        if (toolbar) {
          updateConfig({
            integrations: [astroGrabToolbar()],
          });
          logger.info("Adding astro-grab-toolbar");
        }

        if (autoInject) {
          const script = `import { AstroGrab } from "astro-grab-client";
const toolbarConfig = (() => {
  try {
    const stored = localStorage.getItem("astro-grab-toolbar-config");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}
  return {};
})();
const instance = new AstroGrab({ holdDuration: toolbarConfig.holdDuration ?? ${holdDuration}, contextLines: ${contextLines}, hue: toolbarConfig.hue ?? ${hue}, debug: ${debug} });
window.__astroGrabInstance__ = instance;
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => instance.init());
} else {
  instance.init();
}`;
          if (debug) {
            logger.info(`[astro-grab] Injecting script`);
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
