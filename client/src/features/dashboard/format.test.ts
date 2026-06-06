import { describe, it, expect } from "vitest";
import {
  avgPaceSecPerKm,
  formatPace,
  formatDuration,
  formatDistance,
} from "./format";

describe("avgPaceSecPerKm", () => {
  it("derives seconds per km from distance and duration", () => {
    expect(avgPaceSecPerKm(10, 3000)).toBe(300); // 5:00 /km
    expect(avgPaceSecPerKm(8, 2400)).toBe(300);
  });

  it("returns null when distance is zero (pace undefined)", () => {
    expect(avgPaceSecPerKm(0, 0)).toBeNull();
    expect(avgPaceSecPerKm(0, 1500)).toBeNull();
  });
});

describe("formatPace", () => {
  it("formats seconds-per-km as m:ss /km", () => {
    expect(formatPace(300)).toBe("5:00 /km");
    expect(formatPace(330)).toBe("5:30 /km");
    expect(formatPace(305)).toBe("5:05 /km");
  });

  it("rounds to the nearest second", () => {
    expect(formatPace(329.6)).toBe("5:30 /km");
  });

  it("renders an em dash for null/invalid pace", () => {
    expect(formatPace(null)).toBe("—");
    expect(formatPace(0)).toBe("—");
    expect(formatPace(Infinity)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("uses H:MM:SS when there are whole hours", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
    expect(formatDuration(5400)).toBe("1:30:00");
  });

  it("uses M:SS below an hour", () => {
    expect(formatDuration(1500)).toBe("25:00");
    expect(formatDuration(65)).toBe("1:05");
  });

  it("clamps and rounds odd inputs", () => {
    expect(formatDuration(-5)).toBe("0:00");
    expect(formatDuration(59.6)).toBe("1:00");
  });
});

describe("formatDistance", () => {
  it("formats kilometers to one decimal", () => {
    expect(formatDistance(18)).toBe("18.0 km");
    expect(formatDistance(8.234)).toBe("8.2 km");
    expect(formatDistance(0)).toBe("0.0 km");
  });
});
