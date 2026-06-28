import { describe, expect, it } from "vitest";
import { measureDuration } from "../src/shared/timing";

describe("timing helpers", () => {
  it("rounds durations to two decimals", () => {
    expect(measureDuration(10, 15.126)).toBe(5.13);
  });
});
