export const ASTRO_GRAB_TOOLBAR_STORAGE_KEY = 'astro-grab-toolbar-config';
export const DEFAULT_TRIGGER_KEY = 'g';

const SINGLE_PRINTABLE_KEY_PATTERN = /^\S$/u;

export const parseTriggerKey = (key?: string): string | null => {
  if (typeof key !== 'string') {
    return null;
  }

  const trimmedKey = key.trim();
  if (
    Array.from(trimmedKey).length !== 1 ||
    !SINGLE_PRINTABLE_KEY_PATTERN.test(trimmedKey)
  ) {
    return null;
  }

  return trimmedKey.toLowerCase();
};

export const isTriggerKeyValid = (key?: string): boolean => {
  return parseTriggerKey(key) !== null;
};

export const normalizeTriggerKey = (key?: string): string => {
  return parseTriggerKey(key) ?? DEFAULT_TRIGGER_KEY;
};

const formatTriggerKey = (key?: string): string => {
  return normalizeTriggerKey(key).toUpperCase();
};

export const formatShortcutDisplayLabel = (key?: string): string => {
  return `Cmd/Ctrl+${formatTriggerKey(key)}`;
};

export const formatPlatformShortcutDisplayLabel = (
  key?: string,
  platform?: string,
): string => {
  const normalizedPlatform = platform?.toLowerCase() ?? '';
  const modifierLabel = normalizedPlatform.includes('mac') ? 'Cmd' : 'Ctrl';

  return `${modifierLabel}+${formatTriggerKey(key)}`;
};

export const getStoredTriggerKey = (): string => {
  if (typeof window === 'undefined') {
    return DEFAULT_TRIGGER_KEY;
  }

  try {
    const storedConfig = localStorage.getItem(
      ASTRO_GRAB_TOOLBAR_STORAGE_KEY,
    );

    if (!storedConfig) {
      return DEFAULT_TRIGGER_KEY;
    }

    const parsedConfig = JSON.parse(storedConfig);
    if (
      typeof parsedConfig === 'object' &&
      parsedConfig !== null &&
      'key' in parsedConfig &&
      typeof parsedConfig.key === 'string'
    ) {
      return normalizeTriggerKey(parsedConfig.key);
    }
  } catch {}

  return DEFAULT_TRIGGER_KEY;
};
