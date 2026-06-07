import { describe, it, expect } from "vitest";
import { pageRange } from "./pageRange";

describe("pageRange", () => {
  it("returns a single page for one or fewer pages", () => {
    expect(pageRange(1, 1)).toEqual([1]);
    expect(pageRange(1, 0)).toEqual([1]);
  });

  it("shows every page with no ellipsis when they all fit", () => {
    expect(pageRange(2, 3)).toEqual([1, 2, 3]);
    // A two-page gap is filled rather than collapsed, so 4 pages need no ellipsis.
    expect(pageRange(1, 4)).toEqual([1, 2, 3, 4]);
  });

  it("collapses the far side near the start", () => {
    expect(pageRange(1, 13)).toEqual([1, 2, "ellipsis", 13]);
    expect(pageRange(3, 13)).toEqual([1, 2, 3, 4, "ellipsis", 13]);
  });

  it("collapses both sides in the middle", () => {
    expect(pageRange(7, 13)).toEqual([1, "ellipsis", 6, 7, 8, "ellipsis", 13]);
  });

  it("collapses the near side at the end", () => {
    expect(pageRange(11, 13)).toEqual([1, "ellipsis", 10, 11, 12, 13]);
    expect(pageRange(13, 13)).toEqual([1, "ellipsis", 12, 13]);
  });

  it("fills a single-page gap with its number instead of an ellipsis", () => {
    // Window is 3,4,5; the 1→3 gap is a single hidden page (2), so it is shown.
    expect(pageRange(4, 13)).toEqual([1, 2, 3, 4, 5, "ellipsis", 13]);
  });
});
