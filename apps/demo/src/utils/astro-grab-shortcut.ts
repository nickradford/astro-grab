import {
  formatPlatformShortcutDisplayLabel,
  getStoredTriggerKey,
} from "../../../../packages/astro-grab/src/shared/shortcut.js";

export const getCurrentShortcutLabel = (): string => {
  if (typeof navigator === "undefined") {
    return formatPlatformShortcutDisplayLabel(getStoredTriggerKey(), "unknown");
  }

  const userAgentData = Reflect.get(navigator, "userAgentData");
  const platform =
    typeof userAgentData === "object" &&
    userAgentData !== null &&
    "platform" in userAgentData &&
    typeof userAgentData.platform === "string"
      ? userAgentData.platform
      : navigator.platform || "unknown";

  return formatPlatformShortcutDisplayLabel(
    getStoredTriggerKey(),
    platform,
  );
};

export const onShortcutChange = (
  callback: (shortcutLabel: string) => void,
): (() => void) => {
  const updateShortcutLabel = (): void => {
    callback(getCurrentShortcutLabel());
  };

  updateShortcutLabel();
  if (typeof window !== "undefined") {
    window.addEventListener("astro-grab:config-update", updateShortcutLabel);
  }

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener(
        "astro-grab:config-update",
        updateShortcutLabel,
      );
    }
  };
};
