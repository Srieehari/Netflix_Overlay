import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_TTL_MS } from "../src/shared/constants";
import { clearExpiredRatings, getCachedRatings, isCacheFresh, memoryCache, setCachedRatings } from "../src/content/cache";
import type { RatingsResult } from "../src/shared/types";

const storage = new Map<string, unknown>();

beforeEach(() => {
  storage.clear();
  memoryCache.clear();
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (key: string | string[] | null) => {
          if (key === null) return Object.fromEntries(storage);
          if (Array.isArray(key)) return Object.fromEntries(key.map((item) => [item, storage.get(item)]));
          return { [key]: storage.get(key) };
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.entries(items).forEach(([key, value]) => storage.set(key, value));
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          (Array.isArray(keys) ? keys : [keys]).forEach((key) => storage.delete(key));
        })
      }
    }
  });
});

const ratings: RatingsResult = {
  imdb: { score: "8.7/10" },
  rottenTomatoes: { score: "94%" },
  metacritic: { score: "82" },
  source: "mock",
  fetchedAt: 1
};

describe("cache", () => {
  it("identifies fresh and expired cache entries", () => {
    expect(isCacheFresh({ value: {}, createdAt: 0, expiresAt: Date.now() + 1000 })).toBe(true);
    expect(isCacheFresh({ value: {}, createdAt: 0, expiresAt: Date.now() - 1000 })).toBe(false);
  });

  it("returns an in-memory cache hit", async () => {
    await setCachedRatings("breaking-bad:2008:series", ratings);
    const cached = await getCachedRatings("breaking-bad:2008:series");
    expect(cached?.imdb?.score).toBe("8.7/10");
    expect(cached?.source).toBe("cache");
  });

  it("hydrates memory cache from persistent storage", async () => {
    const key = "ratings:dark:2017:series";
    storage.set(key, {
      value: ratings,
      createdAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    const cached = await getCachedRatings("dark:2017:series");
    expect(cached?.metacritic?.score).toBe("82");
    expect(memoryCache.has(key)).toBe(true);
  });

  it("clears expired ratings from both layers", async () => {
    storage.set("ratings:old:unknown:movie", {
      value: ratings,
      createdAt: 0,
      expiresAt: 1
    });

    await clearExpiredRatings(2);
    expect(storage.has("ratings:old:unknown:movie")).toBe(false);
  });
});
