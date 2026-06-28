import type { ExtensionSettings, RuntimeStats } from "./types";

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const FAILURE_CACHE_TTL_MS = 5 * 60 * 1000;
export const CACHE_PREFIX = "ratings:";
export const SETTINGS_KEY = "settings";
export const STATS_KEY = "runtimeStats";
export const MAX_TIMING_ENTRIES = 20;

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  debug: false,
  providerMode: "mock"
};

export const DEFAULT_STATS: RuntimeStats = {
  cacheHits: 0,
  cacheMisses: 0,
  timings: []
};

export const MODAL_SELECTORS = [
  '[role="dialog"]',
  ".previewModal--wrapper",
  ".jawBone",
  '[data-uia*="previewModal"]'
];

export const TITLE_SELECTORS = [
  '[data-uia="previewModal-title"]',
  '[data-uia="title-info-title"]',
  ".previewModal--boxart-title",
  ".title-title",
  "h1",
  "h2"
];

export const META_SELECTORS = [
  '[data-uia="item-year"]',
  ".year",
  ".previewModal--tags .tag",
  ".videoMetadata--year",
  ".title-info-metadata-item"
];
