import { defineToolbarApp } from "astro/toolbar";

interface ToolbarConfig {
  enabled: boolean;
  hue: number;
  holdDuration: number;
}

const DEFAULT_CONFIG: ToolbarConfig = {
  enabled: true,
  hue: 30,
  holdDuration: 1000,
};

const STORAGE_KEY = "astro-grab-toolbar-config";

const getConfig = (): ToolbarConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
};

const setConfig = (config: Partial<ToolbarConfig>): void => {
  const current = getConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(
    new CustomEvent("astro-grab-config-change", { detail: updated }),
  );
};

const updateAstroGrab = (config: Partial<ToolbarConfig>): void => {
  window.dispatchEvent(
    new CustomEvent("astro-grab-config-update", { detail: config }),
  );
};

const toggleAstroGrab = (enabled: boolean): void => {
  window.dispatchEvent(
    new CustomEvent("astro-grab-toggle", { detail: { enabled } }),
  );
};

export default defineToolbarApp({
  init(canvas, app) {
    const config = getConfig();

    const toolbarWindow = document.createElement("astro-dev-toolbar-window");

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
      "padding: 12px 16px 16px; display: flex; flex-direction: column; gap: 16px;";

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
    contentContainer.appendChild(durationSection);
    contentContainer.appendChild(actionsContainer);

    toolbarWindow.appendChild(headerContainer);
    toolbarWindow.appendChild(contentContainer);
    canvas.appendChild(toolbarWindow);

    const handleOutsideClick = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (!canvas.contains(target)) {
        app.toggleState({ state: false });
      }
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

    resetButton.addEventListener("click", () => {
      toggle.input.checked = DEFAULT_CONFIG.enabled;
      toggle.toggleStyle = DEFAULT_CONFIG.enabled ? "green" : "gray";

      hueSlider.value = DEFAULT_CONFIG.hue.toString();
      huePreview.style.backgroundColor = `hsl(${DEFAULT_CONFIG.hue}, 70%, 50%)`;
      hueValue.textContent = DEFAULT_CONFIG.hue.toString();

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
        hue: DEFAULT_CONFIG.hue,
        holdDuration: DEFAULT_CONFIG.holdDuration,
      });
    });

    reloadButton.addEventListener("click", () => {
      setConfig({
        enabled: toggle.input.checked,
        hue: parseInt(hueSlider.value, 10),
        holdDuration: parseInt(durationSlider.value, 10),
      });
      location.reload();
    });

    app.onToggled(({ state }) => {
      if (state) {
        document.addEventListener("click", handleOutsideClick);
      } else {
        document.removeEventListener("click", handleOutsideClick);
      }
    });
  },
});
