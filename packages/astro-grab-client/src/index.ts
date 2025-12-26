import { StateMachine } from "./state-machine.js";
import { KeybindHandler } from "./keybind.js";
import { Overlay } from "./overlay.js";
import { TargetingHandler } from "./targeting.js";
import type { ClientConfig } from "@astro-grab/shared";

export class AstroGrab {
  private stateMachine: StateMachine;
  private keybind: KeybindHandler;
  private overlay: Overlay;
  private targeting: TargetingHandler;
  private debug: boolean;
  private holdDuration: number;
  private contextLines: number;
  private apiBaseUrl: string | undefined;
  private isEnabled = true;

  constructor(config: ClientConfig = {}) {
    const {
      holdDuration = 500,
      contextLines = 4,
      hue: configHue = 30,
      debug = false,
      apiBaseUrl,
    } = config;
    const hue = configHue;

    this.debug = debug;
    this.holdDuration = holdDuration;
    this.contextLines = contextLines;
    this.apiBaseUrl = apiBaseUrl;

    if (debug) {
      console.log("[astro-grab:constructor] config:", config);
      console.log("[astro-grab:constructor] Using hue:", hue);
    }

    this.stateMachine = new StateMachine();
    this.keybind = new KeybindHandler(this.stateMachine, holdDuration);
    this.overlay = new Overlay(this.stateMachine, hue);
    this.targeting = new TargetingHandler(
      this.stateMachine,
      this.overlay,
      contextLines,
      apiBaseUrl,
    );
  }

  init(): void {
    this.keybind.init();
    this.overlay.init();
    this.targeting.init(this.keybind);
    console.log("[astro-grab] Initialized - Hold Cmd/Ctrl+G to start");

    this.stateMachine.onEnter("targeting", () => {
      window.dispatchEvent(
        new CustomEvent("astro-grab:targeting-mode-started"),
      );
    });

    window.addEventListener(
      "astro-grab:config-update",
      this.handleConfigUpdate,
    );
    window.addEventListener("astro-grab:toggle", this.handleToggle);
  }

  destroy(): void {
    this.keybind.destroy();
    this.overlay.destroy();
    window.removeEventListener(
      "astro-grab:config-update",
      this.handleConfigUpdate,
    );
    window.removeEventListener("astro-grab:toggle", this.handleToggle);
  }

  private handleConfigUpdate = (event: Event): void => {
    const customEvent = event as CustomEvent<Partial<ClientConfig>>;
    const config = customEvent.detail;

    if (this.debug) {
      console.log("[astro-grab] Config update received:", config);
    }

    if (typeof config.hue === "number") {
      this.overlay.updateHue(config.hue);
    }

    if (typeof config.holdDuration === "number") {
      this.holdDuration = config.holdDuration;
      this.keybind.updateHoldDuration(config.holdDuration);
    }

    if (typeof config.contextLines === "number") {
      this.contextLines = config.contextLines;
      this.targeting.updateContextLines(config.contextLines);
    }

    if (typeof config.apiBaseUrl === "string") {
      this.apiBaseUrl = config.apiBaseUrl;
      // Note: apiBaseUrl changes require reinitializing TargetingHandler
      // For now, we'll log that this requires a page reload
      console.warn(
        "[astro-grab] apiBaseUrl changed - page reload may be required for changes to take effect",
      );
    }
  };

  private handleToggle = (event: Event): void => {
    const customEvent = event as CustomEvent<{ enabled: boolean }>;
    const { enabled } = customEvent.detail;

    if (this.debug) {
      console.log("[astro-grab] Toggle received:", enabled);
    }

    if (enabled && !this.isEnabled) {
      this.isEnabled = true;
      this.keybind.init();
      this.overlay.init();
    } else if (!enabled && this.isEnabled) {
      this.isEnabled = false;
      this.keybind.destroy();
      this.overlay.destroy();
    }
  };

  updateConfig(config: Partial<ClientConfig>): void {
    this.handleConfigUpdate(
      new CustomEvent("astro-grab:config-update", { detail: config }),
    );
  }
}

export type { ClientConfig } from "@astro-grab/shared";
