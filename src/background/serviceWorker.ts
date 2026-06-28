import { CACHE_PREFIX, DEFAULT_STATS, STATS_KEY } from "../shared/constants";
import { hydrateLoggerFromStorage, logger } from "../shared/logger";
import type { RuntimeMessage, RuntimeStats } from "../shared/types";
import { clearExpiredRatings, getCachedRatings, setCachedRatings, memoryCache } from "../content/cache";
import { fetchRatings } from "./ratingProvider";

void hydrateLoggerFromStorage();
void clearExpiredRatings();

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === "GET_RATINGS") {
    void handleGetRatings(message.payload.canonicalKey, async () => fetchRatings(message.payload))
      .then(sendResponse)
      .catch((error) => {
        logger.warn("GET_RATINGS failed", error);
        sendResponse(null);
      });
    return true;
  }

  if (message.type === "CLEAR_CACHE") {
    void clearRatingsCache().then(sendResponse);
    return true;
  }

  return false;
});

async function handleGetRatings<T extends Awaited<ReturnType<typeof fetchRatings>>>(
  canonicalKey: string,
  loadRatings: () => Promise<T>
): Promise<T> {
  const cached = await getCachedRatings(canonicalKey);
  if (cached) {
    await incrementCacheStat("cacheHits", cached.source);
    logger.debug("ratings_cache_hit", canonicalKey);
    return cached as T;
  }

  await incrementCacheStat("cacheMisses");
  logger.debug("ratings_cache_miss", canonicalKey);
  const result = await loadRatings();
  await setCachedRatings(canonicalKey, result);
  return result;
}

async function clearRatingsCache(): Promise<{ ok: true }> {
  memoryCache.clear();
  const stored = await chrome.storage.local.get(null);
  const cacheKeys = Object.keys(stored).filter((key) => key.startsWith(CACHE_PREFIX));
  if (cacheKeys.length > 0) {
    await chrome.storage.local.remove(cacheKeys);
  }
  await chrome.storage.local.set({ [STATS_KEY]: DEFAULT_STATS });
  return { ok: true };
}

async function incrementCacheStat(stat: "cacheHits" | "cacheMisses", source?: string): Promise<void> {
  const stored = await chrome.storage.local.get(STATS_KEY);
  const stats: RuntimeStats = {
    ...DEFAULT_STATS,
    ...(stored[STATS_KEY] ?? {})
  };

  stats[stat] += 1;
  if (source) stats.lastProviderSource = "cache";

  await chrome.storage.local.set({ [STATS_KEY]: stats });
}
