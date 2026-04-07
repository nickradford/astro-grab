import { defineToolbarApp } from "astro/toolbar";
import {
  ASTRO_GRAB_TOOLBAR_STORAGE_KEY,
  DEFAULT_TRIGGER_KEY,
  formatShortcutDisplayLabel,
  normalizeTriggerKey,
  parseTriggerKey,
} from "../shared/index.js";

interface ToolbarConfig {
  enabled: boolean;
  key: string;
  hue: number;
  holdDuration: number;
}

const DEFAULT_CONFIG: ToolbarConfig = {
  enabled: true,
  key: DEFAULT_TRIGGER_KEY,
  hue: 30,
  holdDuration: 1000,
};

const STORAGE_KEY = ASTRO_GRAB_TOOLBAR_STORAGE_KEY;

const getConfig = (): ToolbarConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedConfig = JSON.parse(stored);
      if (typeof parsedConfig === "object" && parsedConfig !== null) {
        return {
          ...DEFAULT_CONFIG,
          ...parsedConfig,
          key: normalizeTriggerKey(parsedConfig.key),
        };
      }
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
};

const setConfig = (config: Partial<ToolbarConfig>): void => {
  const current = getConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(
    new CustomEvent("astro-grab:config-change", { detail: updated }),
  );
};

const updateAstroGrab = (config: Partial<ToolbarConfig>): void => {
  window.dispatchEvent(
    new CustomEvent("astro-grab:config-update", { detail: config }),
  );
};

const toggleAstroGrab = (enabled: boolean): void => {
  window.dispatchEvent(
    new CustomEvent("astro-grab:toggle", { detail: { enabled } }),
  );
};

export default defineToolbarApp({
  init(canvas, app) {
    const config = getConfig();

    const toolbarWindow = document.createElement("astro-dev-toolbar-window");
    toolbarWindow.style.cssText =
      "display: flex; flex-direction: column; max-height: min(80vh, 680px);";

    const headerContainer = document.createElement("div");
    headerContainer.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; padding: 16px 16px 12px;";

    const title = document.createElement("div");
    title.textContent = "Astro Grab";
    title.style.cssText = "font-weight: 600; font-size: 14px;";

    const statusContainer = document.createElement("div");
    statusContainer.style.cssText =
      "display: flex; align-items: center; gap: 8px;";
    statusContainer.id = "astro-grab-status-container";

    const statusDot = document.createElement("div");
    statusDot.id = "astro-grab-status-dot";
    statusDot.style.cssText = `width: 8px; height: 8px; border-radius: 50%; background-color: ${config.enabled ? "#22c55e" : "#ef4444"};`;

    const statusText = document.createElement("div");
    statusText.id = "astro-grab-status-text";
    statusText.textContent = config.enabled ? "Enabled" : "Disabled";
    statusText.style.cssText = "font-size: 12px;";

    statusContainer.appendChild(statusDot);
    statusContainer.appendChild(statusText);
    headerContainer.appendChild(title);
    headerContainer.appendChild(statusContainer);

    const contentContainer = document.createElement("div");
    contentContainer.style.cssText =
      "padding: 12px 16px 16px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: min(64vh, 520px);";

    const enabledSection = document.createElement("div");
    enabledSection.style.cssText =
      "display: flex; justify-content: space-between; align-items: center;";

    const enabledLabel = document.createElement("div");
    enabledLabel.textContent = "Enable Astro Grab";
    enabledLabel.style.cssText = "font-size: 13px;";

    const toggle = document.createElement("astro-dev-toolbar-toggle");
    toggle.toggleStyle = config.enabled ? "green" : "gray";
    toggle.input.checked = config.enabled;

    enabledSection.appendChild(enabledLabel);
    enabledSection.appendChild(toggle);

    const hueSection = document.createElement("div");
    hueSection.style.cssText =
      "display: flex; flex-direction: column; gap: 8px;";

    const hueLabel = document.createElement("div");
    hueLabel.textContent = "Color Hue";
    hueLabel.style.cssText = "font-size: 13px; font-weight: 500;";

    const hueRow = document.createElement("div");
    hueRow.style.cssText = "display: flex; align-items: center; gap: 12px;";

    const huePreview = document.createElement("div");
    huePreview.id = "astro-grab-hue-preview";
    huePreview.style.cssText = `width: 24px; height: 24px; border-radius: 4px; background-color: hsl(${config.hue}, 70%, 50%); border: 1px solid #e5e7eb;`;

    const hueSlider = document.createElement("input");
    hueSlider.type = "range";
    hueSlider.min = "0";
    hueSlider.max = "360";
    hueSlider.value = config.hue.toString();
    hueSlider.id = "astro-grab-hue-slider";
    hueSlider.style.cssText =
      "flex: 1; height: 4px; -webkit-appearance: none; appearance: none; background: #e5e7eb; border-radius: 2px; cursor: pointer;";
    hueSlider.addEventListener("input", () => {
      const value = parseInt(hueSlider.value, 10);
      huePreview.style.backgroundColor = `hsl(${value}, 70%, 50%)`;
      updateAstroGrab({ hue: value });
      setConfig({ hue: value });
    });

    const hueValue = document.createElement("div");
    hueValue.id = "astro-grab-hue-value";
    hueValue.textContent = config.hue.toString();
    hueValue.style.cssText =
      "font-size: 12px; min-width: 32px; text-align: right; font-family: monospace;";

    hueRow.appendChild(huePreview);
    hueRow.appendChild(hueSlider);
    hueRow.appendChild(hueValue);
    hueSection.appendChild(hueLabel);
    hueSection.appendChild(hueRow);

    const keySection = document.createElement("div");
    keySection.style.cssText =
      "display: flex; flex-direction: column; gap: 8px;";

    const keyLabel = document.createElement("div");
    keyLabel.textContent = "Target Key";
    keyLabel.style.cssText = "font-size: 13px; font-weight: 500;";

    const keyRow = document.createElement("div");
    keyRow.style.cssText =
      "display: flex; align-items: center; gap: 12px; flex-wrap: wrap;";

    const keyPreview = document.createElement("div");
    keyPreview.id = "astro-grab-key-preview";
    keyPreview.textContent = formatShortcutDisplayLabel(config.key);
    keyPreview.style.cssText =
      "font-size: 12px; min-width: 96px; text-align: center; font-family: monospace; padding: 6px 8px; border-radius: 4px; background-color: #111827; color: #f9fafb;";

    const keyButton = document.createElement("astro-dev-toolbar-button");
    keyButton.textContent = "Change Key";
    keyButton.buttonStyle = "ghost";
    keyButton.size = "small";

    const keyNote = document.createElement("div");
    keyNote.textContent = "Press a single key. Cmd/Ctrl stays fixed.";
    keyNote.style.cssText = "font-size: 11px; color: #6b7280;";

    keyRow.appendChild(keyPreview);
    keyRow.appendChild(keyButton);
    keySection.appendChild(keyLabel);
    keySection.appendChild(keyRow);
    keySection.appendChild(keyNote);

    const durationSection = document.createElement("div");
    durationSection.style.cssText =
      "display: flex; flex-direction: column; gap: 8px;";

    const durationLabel = document.createElement("div");
    durationLabel.textContent = "Hold Duration";
    durationLabel.style.cssText = "font-size: 13px; font-weight: 500;";

    const durationRow = document.createElement("div");
    durationRow.style.cssText =
      "display: flex; align-items: center; gap: 12px;";

    const durationSlider = document.createElement("input");
    durationSlider.type = "range";
    durationSlider.min = "500";
    durationSlider.max = "3000";
    durationSlider.step = "100";
    durationSlider.value = config.holdDuration.toString();
    durationSlider.id = "astro-grab-duration-slider";
    durationSlider.style.cssText =
      "flex: 1; height: 4px; -webkit-appearance: none; appearance: none; background: #e5e7eb; border-radius: 2px; cursor: pointer;";
    durationSlider.addEventListener("input", () => {
      const value = parseInt(durationSlider.value, 10);
      durationValue.textContent = value.toString();
      updateAstroGrab({ holdDuration: value });
      setConfig({ holdDuration: value });
    });

    const durationValue = document.createElement("div");
    durationValue.id = "astro-grab-duration-value";
    durationValue.textContent = config.holdDuration.toString();
    durationValue.style.cssText =
      "font-size: 12px; min-width: 48px; text-align: right; font-family: monospace;";

    const durationUnit = document.createElement("div");
    durationUnit.textContent = "ms";
    durationUnit.style.cssText = "font-size: 12px;";

    durationRow.appendChild(durationSlider);
    durationRow.appendChild(durationValue);
    durationRow.appendChild(durationUnit);
    durationSection.appendChild(durationLabel);
    durationSection.appendChild(durationRow);

    const templateSection = document.createElement("div");
    templateSection.style.cssText =
      "display: flex; flex-direction: column; gap: 8px;";

    const templateLabel = document.createElement("div");
    templateLabel.textContent = "Template";
    templateLabel.style.cssText = "font-size: 13px; font-weight: 500;";

    const templateNote = document.createElement("div");
    templateNote.textContent = "Edit template in astro.config.mjs";
    templateNote.style.cssText =
      "font-size: 11px; color: #6b7280; font-style: italic;";

    const templateDisplay = document.createElement("pre");
    templateDisplay.id = "astro-grab-template-display";
    templateDisplay.style.cssText =
      "font-size: 11px; font-family: monospace; background-color: #1e1e1e; color: #d4d4d4; padding: 8px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; max-height: 96px; overflow-y: auto;";

    const astroGrabInstance = (
      window as unknown as { __astroGrabInstance__?: { getTemplate(): string } }
    ).__astroGrabInstance__;
    templateDisplay.textContent = astroGrabInstance
      ? astroGrabInstance.getTemplate()
      : "Template not available";

    const variablesLabel = document.createElement("div");
    variablesLabel.textContent = "Available variables:";
    variablesLabel.style.cssText = "font-size: 11px; color: #6b7280;";

    const variablesList = document.createElement("div");
    variablesList.style.cssText =
      "font-size: 10px; font-family: monospace; color: #9ca3af; line-height: 1.6;";
    variablesList.textContent =
      "{{file}} {{snippet}} {{startLine}} {{endLine}} {{targetLine}} {{language}}";

    templateSection.appendChild(templateLabel);
    templateSection.appendChild(templateNote);
    templateSection.appendChild(templateDisplay);
    templateSection.appendChild(variablesLabel);
    templateSection.appendChild(variablesList);

    const actionsContainer = document.createElement("div");
    actionsContainer.style.cssText =
      "display: flex; gap: 8px; padding-top: 8px;";

    const resetButton = document.createElement("astro-dev-toolbar-button");
    resetButton.textContent = "Reset";
    resetButton.buttonStyle = "ghost";
    resetButton.size = "small";

    const reloadButton = document.createElement("astro-dev-toolbar-button");
    reloadButton.textContent = "Apply & Reload";
    reloadButton.buttonStyle = "purple";
    reloadButton.size = "small";

    actionsContainer.appendChild(resetButton);
    actionsContainer.appendChild(reloadButton);

    contentContainer.appendChild(enabledSection);
    contentContainer.appendChild(hueSection);
    contentContainer.appendChild(keySection);
    contentContainer.appendChild(durationSection);
    contentContainer.appendChild(templateSection);
    contentContainer.appendChild(actionsContainer);

    toolbarWindow.appendChild(headerContainer);
    toolbarWindow.appendChild(contentContainer);
    canvas.appendChild(toolbarWindow);

    const handleOutsideClick = (event: MouseEvent): void => {
      const path = event.composedPath();
      const isInsideToolbar = path.some(
        (el) => el === canvas || el === toolbarWindow,
      );
      if (!isInsideToolbar) {
        app.toggleState({ state: false });
      }
    };

    let currentKey = config.key;
    let isCapturingKey = false;

    const setKeyCaptureState = (nextState: boolean): void => {
      isCapturingKey = nextState;
      keyButton.textContent = nextState ? "Cancel" : "Change Key";
      keyNote.textContent = nextState
        ? "Press a single key now. Press Escape to cancel."
        : "Press a single key. Cmd/Ctrl stays fixed.";
    };

    const updateKeyPreview = (nextKey: string): void => {
      currentKey = normalizeTriggerKey(nextKey);
      keyPreview.textContent = formatShortcutDisplayLabel(currentKey);
    };

    const handleKeyCapture = (event: KeyboardEvent): void => {
      if (!isCapturingKey) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        stopKeyCapture();
        return;
      }

      if (event.repeat) {
        return;
      }

      const capturedKey = parseTriggerKey(event.key);
      if (!capturedKey) {
        return;
      }

      updateKeyPreview(capturedKey);
      setConfig({ key: capturedKey });
      updateAstroGrab({ key: capturedKey });
      stopKeyCapture();
    };

    const stopKeyCapture = (): void => {
      window.removeEventListener("keydown", handleKeyCapture, true);
      setKeyCaptureState(false);
    };

    const startKeyCapture = (): void => {
      setKeyCaptureState(true);
      window.addEventListener("keydown", handleKeyCapture, true);
    };

    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 0);

    toggle.input.addEventListener("change", () => {
      const enabled = toggle.input.checked;
      toggle.toggleStyle = enabled ? "green" : "gray";

      const statusDot = document.getElementById("astro-grab-status-dot");
      const statusText = document.getElementById("astro-grab-status-text");
      if (statusDot && statusText) {
        statusDot.style.backgroundColor = enabled ? "#22c55e" : "#ef4444";
        statusText.textContent = enabled ? "Enabled" : "Disabled";
      }

      setConfig({ enabled });
      toggleAstroGrab(enabled);
    });

    keyButton.addEventListener("click", () => {
      if (isCapturingKey) {
        stopKeyCapture();
        return;
      }

      startKeyCapture();
    });

    resetButton.addEventListener("click", () => {
      stopKeyCapture();
      toggle.input.checked = DEFAULT_CONFIG.enabled;
      toggle.toggleStyle = DEFAULT_CONFIG.enabled ? "green" : "gray";

      hueSlider.value = DEFAULT_CONFIG.hue.toString();
      huePreview.style.backgroundColor = `hsl(${DEFAULT_CONFIG.hue}, 70%, 50%)`;
      hueValue.textContent = DEFAULT_CONFIG.hue.toString();

      updateKeyPreview(DEFAULT_CONFIG.key);

      durationSlider.value = DEFAULT_CONFIG.holdDuration.toString();
      durationValue.textContent = DEFAULT_CONFIG.holdDuration.toString();

      const statusDot = document.getElementById("astro-grab-status-dot");
      const statusText = document.getElementById("astro-grab-status-text");
      if (statusDot && statusText) {
        statusDot.style.backgroundColor = DEFAULT_CONFIG.enabled
          ? "#22c55e"
          : "#ef4444";
        statusText.textContent = DEFAULT_CONFIG.enabled
          ? "Enabled"
          : "Disabled";
      }

      setConfig(DEFAULT_CONFIG);
      toggleAstroGrab(DEFAULT_CONFIG.enabled);
      updateAstroGrab({
        key: DEFAULT_CONFIG.key,
        hue: DEFAULT_CONFIG.hue,
        holdDuration: DEFAULT_CONFIG.holdDuration,
      });
    });

    reloadButton.addEventListener("click", () => {
      setConfig({
        enabled: toggle.input.checked,
        key: currentKey,
        hue: parseInt(hueSlider.value, 10),
        holdDuration: parseInt(durationSlider.value, 10),
      });
      location.reload();
    });

    app.onToggled(({ state }) => {
      if (state) {
        document.addEventListener("click", handleOutsideClick);
      } else {
        stopKeyCapture();
        document.removeEventListener("click", handleOutsideClick);
      }
    });
  },
});
