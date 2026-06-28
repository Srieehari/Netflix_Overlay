import { describe, expect, it } from "vitest";
import { renderRatingBadges } from "../src/content/badgeRenderer";
import { shouldSkipModal } from "../src/content/modalObserver";
import type { ParsedTitle } from "../src/shared/types";

const parsed: ParsedTitle = {
  title: "Dark",
  year: "2017",
  type: "series",
  canonicalKey: "dark:2017:series"
};

describe("duplicate modal detection", () => {
  it("skips a modal that already has badges", () => {
    const modal = document.createElement("div");
    renderRatingBadges(modal, {
      imdb: { score: "8.0/10" },
      source: "mock",
      fetchedAt: 1
    });

    expect(shouldSkipModal(modal, parsed)).toBe(true);
  });
});
