import "./popup.css";
import { DEFAULT_SETTINGS, DEFAULT_STATS, SETTINGS_KEY, STATS_KEY } from "../shared/constants";
import type { ExtensionSettings, RuntimeStats } from "../shared/types";

const enabledInput = document.querySelector<HTMLInputElement>("#enabled")!;
const debugInput = document.querySelector<HTMLInputElement>("#debug")!;
const providerMode = document.querySelector<HTMLElement>("#providerMode")!;
const cacheHits = document.querySelector<HTMLElement>("#cacheHits")!;
const cacheMisses = document.querySelector<HTMLElement>("#cacheMisses")!;
const lastTitle = document.querySelector<HTMLElement>("#lastTitle")!;
const lastLatency = document.querySelector<HTMLElement>("#lastLatency")!;
const clearCacheButton = document.querySelector<HTMLButtonElement>("#clearCache")!;
const statusNode = document.querySelector<HTMLElement>("#status")!;

void render();

enabledInput.addEventListener("change", () => updateSettings({ enabled: enabledInput.checked }));
debugInput.addEventListener("change", () => updateSettings({ debug: debugInput.checked }));
clearCacheButton.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "CLEAR_CACHE" });
  statusNode.textContent = "Cache cleared.";
  await render();
});

async function render(): Promise<void> {
  const { settings, stats } = await readState();
  enabledInput.checked = settings.enabled;
  debugInput.checked = settings.debug;
  providerMode.textContent = settings.providerMode;
  cacheHits.textContent = String(stats.cacheHits);
  cacheMisses.textContent = String(stats.cacheMisses);
  lastTitle.textContent = stats.lastDetectedTitle ?? "-";
  lastLatency.textContent = typeof stats.lastRenderLatency === "number" ? `${stats.lastRenderLatency} ms` : "-";
}

async function updateSettings(partial: Partial<ExtensionSettings>): Promise<void> {
  const { settings } = await readState();
  const next = { ...settings, ...partial };
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  statusNode.textContent = "Settings saved.";
  await render();
}

async function readState(): Promise<{ settings: ExtensionSettings; stats: RuntimeStats }> {
  const stored = await chrome.storage.local.get([SETTINGS_KEY, STATS_KEY]);
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      ...(stored[SETTINGS_KEY] ?? {})
    },
    stats: {
      ...DEFAULT_STATS,
      ...(stored[STATS_KEY] ?? {})
    }
  };
}
