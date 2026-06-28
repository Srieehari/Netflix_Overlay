import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./constants";
import type { ExtensionSettings } from "./types";

let debugEnabled = false;

export function setLoggerDebug(enabled: boolean): void {
  debugEnabled = enabled;
}

export async function hydrateLoggerFromStorage(): Promise<void> {
  if (!globalThis.chrome?.storage?.local) return;
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const settings: ExtensionSettings = {
    ...DEFAULT_SETTINGS,
    ...(stored[SETTINGS_KEY] ?? {})
  };
  debugEnabled = settings.debug;
}

export const logger = {
  debug(message: string, context?: unknown): void {
    if (debugEnabled) {
      console.debug(`[NRO] ${message}`, context ?? "");
    }
  },
  info(message: string, context?: unknown): void {
    console.info(`[NRO] ${message}`, context ?? "");
  },
  warn(message: string, context?: unknown): void {
    console.warn(`[NRO] ${message}`, context ?? "");
  },
  error(message: string, context?: unknown): void {
    console.error(`[NRO] ${message}`, context ?? "");
  }
};
