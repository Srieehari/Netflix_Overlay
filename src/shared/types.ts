export type TitleType = "movie" | "series" | "unknown";

export type ParsedTitle = {
  title: string;
  year?: string;
  type?: TitleType;
  netflixId?: string;
  canonicalKey: string;
};

export type RatingProviderMode = "mock" | "api";

export type RatingScore = {
  score: string;
  votes?: string;
  audienceScore?: string;
  url?: string;
};

export type RatingsResult = {
  imdb?: RatingScore;
  rottenTomatoes?: RatingScore;
  metacritic?: RatingScore;
  source: "api" | "mock" | "cache";
  fetchedAt: number;
};

export type CacheEntry<T> = {
  value: T;
  createdAt: number;
  expiresAt: number;
};

export type ExtensionSettings = {
  enabled: boolean;
  debug: boolean;
  providerMode: RatingProviderMode;
};

export type RuntimeStats = {
  cacheHits: number;
  cacheMisses: number;
  lastDetectedTitle?: string;
  lastRenderLatency?: number;
  lastProviderSource?: RatingsResult["source"];
  timings: Array<{
    name: string;
    duration: number;
    at: number;
  }>;
};

export type GetRatingsMessage = {
  type: "GET_RATINGS";
  payload: ParsedTitle;
};

export type ClearCacheMessage = {
  type: "CLEAR_CACHE";
};

export type RuntimeMessage = GetRatingsMessage | ClearCacheMessage;
