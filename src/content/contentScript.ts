import { hydrateLoggerFromStorage, logger, setLoggerDebug } from "../shared/logger";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "../shared/constants";
import { createNetflixModalObserver } from "./modalObserver";

async function bootstrap(): Promise<void> {
  if (!location.hostname.endsWith("netflix.com")) return;

  await hydrateLoggerFromStorage();
  await ensureDefaultSettings();
  createNetflixModalObserver();
  logger.debug("Netflix Ratings Overlay content script started");
}

async function ensureDefaultSettings(): Promise<void> {
  if (!globalThis.chrome?.storage?.local) return;
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(stored[SETTINGS_KEY] ?? {})
  };
  setLoggerDebug(settings.debug);
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

void bootstrap();
