export type {
  SourceLocation,
  SnippetResponse,
  ClientConfig,
  ClientState,
  AstroGrabOptions,
} from "./types.js";

export { DEFAULT_TEMPLATE } from "./types.js";

export {
  ASTRO_GRAB_TOOLBAR_STORAGE_KEY,
  DEFAULT_TRIGGER_KEY,
  formatPlatformShortcutDisplayLabel,
  formatShortcutDisplayLabel,
  getStoredTriggerKey,
  isTriggerKeyValid,
  normalizeTriggerKey,
  parseTriggerKey,
} from "./shortcut.js";

export {
  encodeSourceLocation,
  decodeSourceLocation,
  normalizePath,
  extractSnippet,
} from "./utils.js";
