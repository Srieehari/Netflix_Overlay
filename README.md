# Netflix Ratings Overlay

Netflix Ratings Overlay is a production-minded Manifest V3 Chrome Extension that injects IMDb, Rotten Tomatoes, and Metacritic-style ratings into Netflix title modals. It uses a lightweight MutationObserver content script, background service-worker fetching, duplicate modal detection, and a two-layer cache so modal updates stay quick and the extension works immediately in deterministic mock mode.

## Published Extension

Published on the Chrome Web Store: [Netflix Rater: IMDb, Rotten Tomatoes, Metacritic](https://chromewebstore.google.com/detail/netflix-rater-imdb-rotten/gglglkfgbgihjjldilpjeoimcnodopcc?hl=en)

![Netflix ratings badge preview](docs/assets/netflix-rater-badge-preview.png)

## Features

- Injects IMDb, Rotten Tomatoes, and Metacritic badges into Netflix modals.
- Detects multiple Netflix modal variants instead of relying on one brittle selector.
- Parses title, year, type, Netflix ID, and a normalized canonical key.
- Uses background message passing for provider and persistent cache work.
- Ships with deterministic mock ratings by default; no API key is required.
- Supports optional API adapter mode without scraping protected ratings sites.
- Prevents duplicate rendering with canonical keys, badge detection, and `WeakSet` modal tracking.
- Uses in-memory cache plus `chrome.storage.local` with a 24-hour TTL.
- Defers DOM writes with `requestAnimationFrame`.
- Includes a popup for enable/disable, debug logging, cache clearing, and runtime stats.
- Includes Vitest/JSDOM unit coverage for parsing, rendering, caching, provider, duplicate detection, and timing helpers.

## Architecture

```text
Netflix Page
   |
   v
Content Script
   |
   |-- MutationObserver detects active modals
   |-- Modal parser extracts title/year/type
   |-- Badge renderer injects rating UI
   |
   v
Background Service Worker
   |
   |-- In-memory cache
   |-- chrome.storage.local cache
   |-- Ratings provider adapter
   |
   v
Ratings API or Mock Provider
```

## Project Structure

```text
src/
  background/
    ratingProvider.ts
    serviceWorker.ts
  content/
    badgeRenderer.ts
    cache.ts
    contentScript.ts
    domUtils.ts
    modalObserver.ts
    modalParser.ts
    styles.css
  popup/
    popup.css
    popup.html
    popup.ts
  shared/
    constants.ts
    logger.ts
    timing.ts
    types.ts
tests/
public/icons/
manifest.json
vite.config.ts
```

## Local Development

```bash
npm install
npm run dev
npm run build
npm run test
```

## Load in Chrome

1. Run `npm run build`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer Mode.
4. Click Load Unpacked.
5. Select the generated `dist` folder.
6. Open Netflix, choose a title, and open its modal.

## Modal Detection

The content script starts only on `https://www.netflix.com/*`. It observes `document.body` with `childList` and `subtree` enabled, then debounces modal scans so frequent Netflix UI mutations do not trigger expensive work. Once a likely modal change occurs, it lazily checks selectors such as `[role="dialog"]`, `.previewModal--wrapper`, `.jawBone`, and `[data-uia*="previewModal"]`.

The parser extracts title text from multiple title selectors, infers year/type from metadata text, and creates canonical keys like `breaking-bad:2008:series`. Those keys drive duplicate detection and cache lookup.

## Caching

The background service worker checks an in-memory `Map` first, then falls back to `chrome.storage.local`. Valid persistent entries hydrate memory cache. Cache keys use `ratings:${canonicalKey}` and entries expire after 24 hours. The popup can clear both layers.

## Performance

- Debounced MutationObserver scans.
- Lazy selectors only after modal mutations are likely relevant.
- Duplicate modal detection with `WeakSet`, existing badge checks, and last canonical key tracking.
- Cache-first loading to avoid repeated provider calls.
- Badge rendering inside `requestAnimationFrame`.
- Timing metrics for detection, fetching, rendering, and total overlay latency.

## Testing

```bash
npm run test
```

Coverage includes canonical key generation, modal parsing, cache TTL behavior, memory and persistent cache hits, badge idempotency, rendered badge content, mock provider output, duplicate modal detection, and timing helpers.

## Limitations

- Mock mode provides deterministic portfolio/demo data, not live ratings.
- API mode expects a compatible external endpoint and does not scrape IMDb, Rotten Tomatoes, or Metacritic.
- Netflix DOM changes can still require selector updates over time.
- MV3 service workers can be suspended by Chrome, so memory cache is opportunistic; persistent cache remains authoritative.

## Future Improvements

- Add a real ratings aggregator API adapter.
- Add provider-specific links when the API returns source URLs.
- Add an options page for provider mode and API configuration.
- Add Playwright smoke tests against mocked Netflix modal fixtures.
- Add cache size limits and cache analytics export.
