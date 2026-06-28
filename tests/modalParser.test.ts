import { describe, expect, it } from "vitest";
import { createCanonicalKey, parseNetflixModal } from "../src/content/modalParser";

describe("modal parser", () => {
  it("creates normalized canonical keys", () => {
    expect(createCanonicalKey("Breaking Bad", "2008", "series")).toBe("breaking-bad:2008:series");
    expect(createCanonicalKey("Spider-Man & Friends", undefined, "movie")).toBe("spider-man-and-friends:unknown:movie");
  });

  it("extracts title, year, type, and key from modal markup", () => {
    document.body.innerHTML = `
      <div role="dialog">
        <h1 data-uia="previewModal-title">Dark</h1>
        <span data-uia="item-year">2017</span>
        <span>3 Seasons</span>
        <a href="/watch/80100172">Play</a>
      </div>
    `;

    const modal = document.querySelector<HTMLElement>('[role="dialog"]')!;
    const parsed = parseNetflixModal(modal);
    expect(parsed).toMatchObject({
      title: "Dark",
      year: "2017",
      type: "series",
      netflixId: "80100172",
      canonicalKey: "dark:2017:series"
    });
  });
});
