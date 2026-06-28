import { describe, expect, it } from "vitest";
import { fetchMockRatings } from "../src/background/ratingProvider";
import type { ParsedTitle } from "../src/shared/types";

const title: ParsedTitle = {
  title: "Breaking Bad",
  year: "2008",
  type: "series",
  canonicalKey: "breaking-bad:2008:series"
};

describe("rating provider", () => {
  it("generates deterministic realistic mock ratings", () => {
    const first = fetchMockRatings(title);
    const second = fetchMockRatings(title);

    expect(first.imdb?.score).toBe(second.imdb?.score);
    expect(first.rottenTomatoes?.score).toMatch(/%$/);
    expect(first.metacritic?.score).toMatch(/^\d+$/);
    expect(first.source).toBe("mock");
  });
});
