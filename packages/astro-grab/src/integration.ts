import type { AstroIntegration } from "astro";
import { astroGrabVitePlugin } from "./server/index.js";
import type { AstroGrabOptions } from "./shared/index.js";
import { astroGrabToolbar } from "./toolbar/index.js";
import {
  ASTRO_GRAB_TOOLBAR_STORAGE_KEY,
  DEFAULT_TRIGGER_KEY,
  formatShortcutDisplayLabel,
  normalizeTriggerKey,
} from "./shared/index.js";

export const astroGrab = (options: AstroGrabOptions = {}): AstroIntegration => {
  const {
    enabled = true,
    key: configKey = DEFAULT_TRIGGER_KEY,
    holdDuration = 1000,
    contextLines = 5,
    autoInject = true,
    hue = 30,
    debug = false,
    toolbar = true,
    template,
  } = options;
  const key = normalizeTriggerKey(configKey);

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
          `Config: enabled=${enabled}, key=${key}, holdDuration=${holdDuration}, contextLines=${contextLines}, autoInject=${autoInject}, hue=${hue}, debug=${debug}, toolbar=${toolbar}, template=${template ? "custom" : "default"}`,
        );

        updateConfig({
          vite: {
            plugins: [astroGrabVitePlugin({ hue, contextLines })],
          },
        });
        logger.info("Vite plugin enabled");

        if (toolbar) {
          updateConfig({
            integrations: [astroGrabToolbar()],
          });
          logger.info("Adding astro-grab-toolbar");
        }

        if (autoInject) {
          const apiBaseUrl = forceEnable
            ? process.env.ASTRO_GRAB_API_BASE_URL
            : undefined;

          const templateConfig = template
            ? `template: ${JSON.stringify(template)},`
            : "";
          const script = `import { AstroGrab } from "astro-grab/client";
const toolbarStorageKey = ${JSON.stringify(ASTRO_GRAB_TOOLBAR_STORAGE_KEY)};
const toolbarConfig = (() => {
  try {
    const stored = localStorage.getItem(toolbarStorageKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}
  return {};
})();
const instance = new AstroGrab({
  enabled: toolbarConfig.enabled ?? true,
  key: toolbarConfig.key ?? ${JSON.stringify(key)},
  holdDuration: toolbarConfig.holdDuration ?? ${holdDuration},
  contextLines: ${contextLines},
  hue: toolbarConfig.hue ?? ${hue},
  debug: ${debug},
  apiBaseUrl: ${apiBaseUrl ? JSON.stringify(apiBaseUrl) : undefined},
  ${templateConfig}
});
window.__astroGrabInstance__ = instance;
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => instance.init());
} else {
  instance.init();
}`;
          logger.info(`Injecting script`);
          injectScript("page", script);
          logger.info(
            `Client script injected. Use ${formatShortcutDisplayLabel(key)} on your Astro site to select components.`,
          );
        }
      },
    },
  };
};
