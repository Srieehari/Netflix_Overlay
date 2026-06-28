import { CACHE_PREFIX, CACHE_TTL_MS } from "../shared/constants";
import type { CacheEntry, RatingsResult } from "../shared/types";

export const memoryCache = new Map<string, CacheEntry<RatingsResult>>();

export function createCacheKey(canonicalKey: string): string {
  return `${CACHE_PREFIX}${canonicalKey}`;
}

export function isCacheFresh(entry: CacheEntry<unknown>, now = Date.now()): boolean {
  return entry.expiresAt > now;
}

export async function getCachedRatings(key: string): Promise<RatingsResult | null> {
  const cacheKey = createCacheKey(key);
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry && isCacheFresh(memoryEntry)) {
    return { ...memoryEntry.value, source: "cache" };
  }

  if (!globalThis.chrome?.storage?.local) return null;

  const stored = await chrome.storage.local.get(cacheKey);
  const entry = stored[cacheKey] as CacheEntry<RatingsResult> | undefined;
  if (!entry || !isCacheFresh(entry)) return null;

  memoryCache.set(cacheKey, entry);
  return { ...entry.value, source: "cache" };
}

export async function setCachedRatings(key: string, result: RatingsResult): Promise<void> {
  const cacheKey = createCacheKey(key);
  const entry: CacheEntry<RatingsResult> = {
    value: result,
    createdAt: Date.now(),
    expiresAt: Date.now() + CACHE_TTL_MS
  };

  memoryCache.set(cacheKey, entry);
  if (globalThis.chrome?.storage?.local) {
    await chrome.storage.local.set({ [cacheKey]: entry });
  }
}

export async function clearExpiredRatings(now = Date.now()): Promise<void> {
  for (const [key, entry] of memoryCache.entries()) {
    if (!isCacheFresh(entry, now)) memoryCache.delete(key);
  }

  if (!globalThis.chrome?.storage?.local) return;

  const stored = await chrome.storage.local.get(null);
  const expiredKeys = Object.entries(stored)
    .filter(([key, value]) => key.startsWith(CACHE_PREFIX) && !isCacheFresh(value as CacheEntry<unknown>, now))
    .map(([key]) => key);

  if (expiredKeys.length > 0) {
    await chrome.storage.local.remove(expiredKeys);
  }
}
