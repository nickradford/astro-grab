import { StateMachine } from "./state-machine.js";
import { KeybindHandler } from "./keybind.js";
import { Overlay } from "./overlay.js";
import { TargetingHandler } from "./targeting.js";
import {
  DEFAULT_TEMPLATE,
  type ClientConfig,
  formatShortcutDisplayLabel,
  normalizeTriggerKey,
} from "../shared/index.js";

export class AstroGrab {
  private stateMachine: StateMachine;
  private keybind: KeybindHandler;
  private overlay: Overlay;
  private targeting: TargetingHandler;
  private debug: boolean;
  private key: string;
  private holdDuration: number;
  private contextLines: number;
  private apiBaseUrl: string | undefined;
  private template: string;
  private isEnabled: boolean;
  private isInitialized = false;

  constructor(config: ClientConfig = {}) {
    const {
      enabled = true,
      key: configKey,
      holdDuration = 500,
      contextLines = 4,
      hue: configHue = 30,
      debug = false,
      apiBaseUrl,
      template = DEFAULT_TEMPLATE,
    } = config;
    const hue = configHue;

    this.debug = debug;
    this.isEnabled = enabled;
    this.key = normalizeTriggerKey(configKey);
    this.holdDuration = holdDuration;
    this.contextLines = contextLines;
    this.apiBaseUrl = apiBaseUrl;
    this.template = template;

    if (debug) {
      console.log("[astro-grab:constructor] config:", config);
      console.log("[astro-grab:constructor] Using hue:", hue);
    }

    this.stateMachine = new StateMachine();
    this.keybind = new KeybindHandler(
      this.stateMachine,
      holdDuration,
      this.key,
    );
    this.overlay = new Overlay(this.stateMachine, hue);
    this.targeting = new TargetingHandler(
      this.stateMachine,
      this.overlay,
      contextLines,
      apiBaseUrl,
      template,
    );
  }

  init(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    this.stateMachine.onEnter("holding", this.handleHoldingEnter);
    this.stateMachine.onEnter("targeting", this.handleTargetingEnter);
    window.addEventListener(
      "astro-grab:config-update",
      this.handleConfigUpdate,
    );
    window.addEventListener("astro-grab:toggle", this.handleToggle);

    if (this.isEnabled) {
      this.activate();
    }

    console.log(
      `[astro-grab] Initialized - Hold ${formatShortcutDisplayLabel(this.key)} to start`,
    );
  }

  private handleHoldingEnter = (): void => {
    window.dispatchEvent(new CustomEvent("astro-grab:key-held"));
  };

  private handleTargetingEnter = (): void => {
    window.dispatchEvent(
      new CustomEvent("astro-grab:targeting-mode-started"),
    );
  };

  private activate(): void {
    this.keybind.init();
    this.overlay.init();
    this.targeting.init(this.keybind);
  }

  private deactivate(): void {
    this.stateMachine.reset();
    this.targeting.destroy();
    this.keybind.destroy();
    this.overlay.destroy();
  }

  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    this.deactivate();
    this.stateMachine.offEnter("holding", this.handleHoldingEnter);
    this.stateMachine.offEnter("targeting", this.handleTargetingEnter);
    window.removeEventListener(
      "astro-grab:config-update",
      this.handleConfigUpdate,
    );
    window.removeEventListener("astro-grab:toggle", this.handleToggle);
    this.isInitialized = false;
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

    if (typeof config.key === "string") {
      this.key = normalizeTriggerKey(config.key);
      this.keybind.updateKey(this.key);
    }

    if (typeof config.holdDuration === "number") {
      this.holdDuration = config.holdDuration;
      this.keybind.updateHoldDuration(config.holdDuration);
    }

    if (typeof config.contextLines === "number") {
      this.contextLines = config.contextLines;
      this.targeting.updateContextLines(config.contextLines);
    }

    if ("apiBaseUrl" in config) {
      this.apiBaseUrl = config.apiBaseUrl;
      this.targeting.updateApiBaseUrl(config.apiBaseUrl);
    }

    if (typeof config.enabled === "boolean") {
      this.setEnabled(config.enabled);
    }

    if (typeof config.template === "string") {
      this.template = config.template;
      this.targeting.updateTemplate(config.template);
    }
  };

  private handleToggle = (event: Event): void => {
    const customEvent = event as CustomEvent<{ enabled: boolean }>;
    const { enabled } = customEvent.detail;

    if (this.debug) {
      console.log("[astro-grab] Toggle received:", enabled);
    }

    this.setEnabled(enabled);
  };

  private setEnabled(enabled: boolean): void {
    if (enabled === this.isEnabled) {
      return;
    }

    this.isEnabled = enabled;
    if (!this.isInitialized) {
      return;
    }

    if (enabled) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  updateConfig(config: Partial<ClientConfig>): void {
    this.handleConfigUpdate(
      new CustomEvent("astro-grab:config-update", { detail: config }),
    );
  }

  getTemplate(): string {
    return this.template;
  }
}

export type { ClientConfig } from "../shared/index.js";
