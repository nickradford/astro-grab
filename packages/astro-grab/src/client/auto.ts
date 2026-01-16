import { AstroGrab } from "./index.js";

if (typeof window !== "undefined") {
  const config = (window as any).__ASTRO_GRAB_CONFIG__ || {};
  if (config.debug) {
    console.log("[astro-grab:auto] Config from window:", config);
  }
  const instance = new AstroGrab(config);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => instance.init());
  } else {
    instance.init();
  }
}
