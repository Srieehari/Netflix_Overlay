import { DEFAULT_SETTINGS, SETTINGS_KEY } from "../shared/constants";
import type { ExtensionSettings, ParsedTitle, RatingProviderMode, RatingsResult } from "../shared/types";

export async function fetchRatings(title: ParsedTitle): Promise<RatingsResult> {
  const mode = await getProviderMode();
  if (mode === "api") {
    return fetchApiRatings(title).catch(() => fetchMockRatings(title));
  }
  return fetchMockRatings(title);
}

export function fetchMockRatings(title: ParsedTitle): RatingsResult {
  const seed = hashString(title.canonicalKey);
  const imdbScore = (6.2 + (seed % 34) / 10).toFixed(1);
  const rtScore = 58 + (seed % 40);
  const audienceScore = Math.min(99, rtScore + ((seed >> 4) % 8) - 2);
  const metacritic = 50 + (seed % 45);
  const votes = formatVotes(20_000 + (seed % 1_900_000));

  return {
    imdb: {
      score: `${imdbScore}/10`,
      votes
    },
    rottenTomatoes: {
      score: `${rtScore}%`,
      audienceScore: `${audienceScore}%`
    },
    metacritic: {
      score: String(metacritic)
    },
    source: "mock",
    fetchedAt: Date.now()
  };
}

async function fetchApiRatings(title: ParsedTitle): Promise<RatingsResult> {
  const apiUrl = import.meta.env.NRO_RATINGS_API_URL as string | undefined;
  const apiKey = import.meta.env.NRO_RATINGS_API_KEY as string | undefined;
  if (!apiUrl || !apiKey) {
    return fetchMockRatings(title);
  }

  const url = new URL(apiUrl);
  url.searchParams.set("title", title.title);
  if (title.year) url.searchParams.set("year", title.year);
  if (title.type) url.searchParams.set("type", title.type);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Ratings API failed with ${response.status}`);
  }

  const result = (await response.json()) as RatingsResult;
  return {
    ...result,
    source: "api",
    fetchedAt: Date.now()
  };
}

async function getProviderMode(): Promise<RatingProviderMode> {
  if (!globalThis.chrome?.storage?.local) return DEFAULT_SETTINGS.providerMode;
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const settings: ExtensionSettings = {
    ...DEFAULT_SETTINGS,
    ...(stored[SETTINGS_KEY] ?? {})
  };
  return settings.providerMode;
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function formatVotes(votes: number): string {
  if (votes >= 1_000_000) return `${(votes / 1_000_000).toFixed(1)}M`;
  return `${Math.round(votes / 1000)}K`;
}
