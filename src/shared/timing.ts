import { DEFAULT_STATS, MAX_TIMING_ENTRIES, STATS_KEY } from "./constants";
import type { RuntimeStats } from "./types";

export function measureDuration(start: number, end = performance.now()): number {
  return Number((end - start).toFixed(2));
}

export async function recordTiming(name: string, duration: number): Promise<void> {
  if (!globalThis.chrome?.storage?.local) return;
  const stored = await chrome.storage.local.get(STATS_KEY);
  const stats: RuntimeStats = {
    ...DEFAULT_STATS,
    ...(stored[STATS_KEY] ?? {})
  };

  stats.timings = [
    { name, duration, at: Date.now() },
    ...(stats.timings ?? [])
  ].slice(0, MAX_TIMING_ENTRIES);

  if (name === "total_overlay_ms" || name === "ratings_overlay_render_ms") {
    stats.lastRenderLatency = duration;
  }

  await chrome.storage.local.set({ [STATS_KEY]: stats });
}
