import { DEFAULT_SETTINGS, SETTINGS_KEY, STATS_KEY } from "../shared/constants";
import { logger } from "../shared/logger";
import { measureDuration, recordTiming } from "../shared/timing";
import type { ExtensionSettings, ParsedTitle, RatingsResult } from "../shared/types";
import { renderRatingBadges, hasRatingBadges } from "./badgeRenderer";
import { findActiveNetflixModal } from "./domUtils";
import { parseNetflixModal } from "./modalParser";

const processedModals = new WeakSet<HTMLElement>();
let lastProcessedKey: string | null = null;
let scanScheduled = false;

export function shouldSkipModal(modal: HTMLElement, parsed: ParsedTitle): boolean {
  if (processedModals.has(modal)) return true;
  if (hasRatingBadges(modal)) return true;
  if (parsed.canonicalKey === lastProcessedKey) return true;
  return false;
}

export function resetDuplicateTracking(): void {
  lastProcessedKey = null;
}

export function createNetflixModalObserver(): MutationObserver | null {
  if (!document.body) return null;

  const observer = new MutationObserver(() => scheduleModalScan());
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  scheduleModalScan();
  return observer;
}

export function scheduleModalScan(): void {
  if (scanScheduled) return;
  scanScheduled = true;

  window.setTimeout(() => {
    scanScheduled = false;
    void scanAndRenderActiveModal();
  }, 80);
}

export async function scanAndRenderActiveModal(): Promise<void> {
  const totalStart = performance.now();
  const settings = await getSettings();
  if (!settings.enabled) return;

  const detectionStart = performance.now();
  const modal = findActiveNetflixModal();
  await recordTiming("modal_detection_ms", measureDuration(detectionStart));

  if (!modal) {
    resetDuplicateTracking();
    return;
  }

  const parsed = parseNetflixModal(modal);
  if (!parsed || shouldSkipModal(modal, parsed)) return;

  processedModals.add(modal);
  lastProcessedKey = parsed.canonicalKey;
  await updateLastDetectedTitle(parsed.title);

  try {
    const fetchStart = performance.now();
    const ratings = await requestRatings(parsed);
    await recordTiming("rating_fetch_ms", measureDuration(fetchStart));

    requestAnimationFrame(() => {
      const renderStart = performance.now();
      renderRatingBadges(modal, ratings);
      const renderDuration = measureDuration(renderStart);
      void recordTiming("ratings_overlay_render_ms", renderDuration);
      void recordTiming("total_overlay_ms", measureDuration(totalStart));
      logger.debug("ratings_overlay_render_ms", renderDuration);
    });
  } catch (error) {
    logger.warn("Ratings request failed", error);
    requestAnimationFrame(() => renderRatingBadges(modal, null));
  }
}

async function requestRatings(parsed: ParsedTitle): Promise<RatingsResult> {
  if (!globalThis.chrome?.runtime?.sendMessage) {
    throw new Error("Chrome runtime messaging is unavailable.");
  }

  return chrome.runtime.sendMessage({
    type: "GET_RATINGS",
    payload: parsed
  });
}

async function getSettings(): Promise<ExtensionSettings> {
  if (!globalThis.chrome?.storage?.local) return DEFAULT_SETTINGS;
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...(stored[SETTINGS_KEY] ?? {})
  };
}

async function updateLastDetectedTitle(title: string): Promise<void> {
  if (!globalThis.chrome?.storage?.local) return;
  const stored = await chrome.storage.local.get(STATS_KEY);
  await chrome.storage.local.set({
    [STATS_KEY]: {
      ...(stored[STATS_KEY] ?? {}),
      lastDetectedTitle: title
    }
  });
}
