import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRIGGER_KEY,
  formatPlatformShortcutDisplayLabel,
  formatShortcutDisplayLabel,
  normalizeTriggerKey,
  parseTriggerKey,
} from "../../src/shared/shortcut.js";

describe("trigger key helpers", () => {
  it("should normalize uppercase keys", () => {
    expect(normalizeTriggerKey("B")).toBe("b");
  });

  it("should preserve valid symbol keys", () => {
    expect(normalizeTriggerKey("/")).toBe("/");
  });

  it("should fall back to the default key for invalid values", () => {
    expect(normalizeTriggerKey("")).toBe(DEFAULT_TRIGGER_KEY);
    expect(normalizeTriggerKey(" ")).toBe(DEFAULT_TRIGGER_KEY);
    expect(normalizeTriggerKey("ArrowDown")).toBe(DEFAULT_TRIGGER_KEY);
  });

  it("should return null for invalid parsed keys", () => {
    expect(parseTriggerKey("Shift")).toBeNull();
    expect(parseTriggerKey("  ")).toBeNull();
  });

  it("should format generic shortcut labels", () => {
    expect(formatShortcutDisplayLabel("b")).toBe("Cmd/Ctrl+B");
  });

  it("should format platform-specific shortcut labels", () => {
    expect(formatPlatformShortcutDisplayLabel("b", "MacIntel")).toBe("Cmd+B");
    expect(formatPlatformShortcutDisplayLabel("b", "Win32")).toBe("Ctrl+B");
  });
});
