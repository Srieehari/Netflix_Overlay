import { describe, expect, it } from "vitest";
import { renderRatingBadges } from "../src/content/badgeRenderer";
import type { RatingsResult } from "../src/shared/types";

const ratings: RatingsResult = {
  imdb: { score: "8.7/10", votes: "1.2M" },
  rottenTomatoes: { score: "94%", audienceScore: "96%" },
  metacritic: { score: "82" },
  source: "mock",
  fetchedAt: 1
};

describe("badge renderer", () => {
  it("does not render duplicate rating badges into the same modal", () => {
    const modal = document.createElement("div");
    renderRatingBadges(modal, ratings);
    renderRatingBadges(modal, ratings);

    expect(modal.querySelectorAll('[data-netflix-ratings-overlay="true"]')).toHaveLength(1);
  });

  it("renders provider labels and scores", () => {
    const modal = document.createElement("div");
    renderRatingBadges(modal, ratings);

    expect(modal.textContent).toContain("IMDb");
    expect(modal.textContent).toContain("8.7/10");
    expect(modal.textContent).toContain("Rotten Tomatoes");
    expect(modal.textContent).toContain("Metacritic");
  });
});
