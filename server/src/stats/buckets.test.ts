import { describe, it, expect } from "vitest";
import {
  summarize,
  weeklyMileage,
  paceTrend,
  typeBreakdown,
  weekStartOf,
  isValidTimeZone,
  localDateFormatter,
  InvalidTimeZoneError,
  type StatRun,
} from "./buckets";

// Two runs in the week of Mon 2026-06-01 (Mon + Wed), a gap week, then one run
// in the week of Mon 2026-06-15. All timestamps are well inside the UTC day so
// the no-timezone (UTC) buckets are unambiguous.
const RUNS: StatRun[] = [
  { distanceKm: 5, durationSec: 1500, date: "2026-06-01T08:00:00Z", type: "Easy" },
  { distanceKm: 3, durationSec: 900, date: "2026-06-03T08:00:00Z", type: "Tempo" },
  { distanceKm: 10, durationSec: 3000, date: "2026-06-15T08:00:00Z", type: "Long Run" },
];

describe("weekStartOf", () => {
  it("returns the Monday of the week for any day", () => {
    expect(weekStartOf("2026-06-08")).toBe("2026-06-08"); // Monday → itself
    expect(weekStartOf("2026-06-03")).toBe("2026-06-01"); // Wednesday
    expect(weekStartOf("2026-06-07")).toBe("2026-06-01"); // Sunday → prior Monday
  });
});

describe("summarize", () => {
  it("totals runs, distance, and duration in canonical units", () => {
    expect(summarize(RUNS)).toEqual({
      totalRuns: 3,
      totalDistanceKm: 18,
      totalDurationSec: 5400,
    });
  });

  it("returns zeros for empty data", () => {
    expect(summarize([])).toEqual({
      totalRuns: 0,
      totalDistanceKm: 0,
      totalDurationSec: 0,
    });
  });
});

describe("weeklyMileage", () => {
  it("buckets by Monday-start week and zero-fills the gap week", () => {
    expect(weeklyMileage(RUNS)).toEqual([
      { weekStart: "2026-06-01", distanceKm: 8, runCount: 2 },
      { weekStart: "2026-06-08", distanceKm: 0, runCount: 0 },
      { weekStart: "2026-06-15", distanceKm: 10, runCount: 1 },
    ]);
  });

  it("returns [] for empty data with no range", () => {
    expect(weeklyMileage([])).toEqual([]);
  });
});

describe("paceTrend", () => {
  it("returns distance + duration per week, zero-filled (no pace computed)", () => {
    expect(paceTrend(RUNS)).toEqual([
      { weekStart: "2026-06-01", distanceKm: 8, durationSec: 2400 },
      { weekStart: "2026-06-08", distanceKm: 0, durationSec: 0 },
      { weekStart: "2026-06-15", distanceKm: 10, durationSec: 3000 },
    ]);
  });
});

describe("typeBreakdown", () => {
  it("groups by type ordered by RUN_TYPES, omitting absent types", () => {
    expect(typeBreakdown(RUNS)).toEqual([
      { type: "Easy", count: 1, distanceKm: 5 },
      { type: "Tempo", count: 1, distanceKm: 3 },
      { type: "Long Run", count: 1, distanceKm: 10 },
    ]);
  });

  it("returns [] for empty data", () => {
    expect(typeBreakdown([])).toEqual([]);
  });
});

describe("timezone bucketing", () => {
  // 02:30 UTC on Mon 2026-06-08 is still Sun 2026-06-07 in New York (UTC-4 in
  // June), so the local week differs from the UTC week.
  const nearMidnight: StatRun[] = [
    { distanceKm: 5, durationSec: 1500, date: "2026-06-08T02:30:00Z", type: "Easy" },
  ];

  it("buckets in UTC when no timezone is given", () => {
    expect(weeklyMileage(nearMidnight)).toEqual([
      { weekStart: "2026-06-08", distanceKm: 5, runCount: 1 },
    ]);
  });

  it("buckets into the local week for an IANA timezone (cross-day)", () => {
    expect(weeklyMileage(nearMidnight, { timezone: "America/New_York" })).toEqual([
      { weekStart: "2026-06-01", distanceKm: 5, runCount: 1 },
    ]);
  });

  it("buckets into the local week for a fixed UTC offset", () => {
    expect(weeklyMileage(nearMidnight, { timezone: "-04:00" })).toEqual([
      { weekStart: "2026-06-01", distanceKm: 5, runCount: 1 },
    ]);
  });
});

describe("date-range filtering", () => {
  it("includes only runs whose local date is within [from, to] and spans the range", () => {
    const result = weeklyMileage(RUNS, { from: "2026-06-10", to: "2026-06-20" });
    expect(result).toEqual([
      { weekStart: "2026-06-08", distanceKm: 0, runCount: 0 },
      { weekStart: "2026-06-15", distanceKm: 10, runCount: 1 },
    ]);
  });

  it("applies the range to the summary as well", () => {
    expect(summarize(RUNS, { from: "2026-06-10", to: "2026-06-20" })).toEqual({
      totalRuns: 1,
      totalDistanceKm: 10,
      totalDurationSec: 3000,
    });
  });
});

describe("timezone validation", () => {
  it("accepts IANA names and fixed offsets", () => {
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Z")).toBe(true);
    expect(isValidTimeZone("+02:00")).toBe(true);
    expect(isValidTimeZone("-0530")).toBe(true);
    expect(isValidTimeZone("+05")).toBe(true);
  });

  it("rejects bogus names and out-of-range offsets", () => {
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(isValidTimeZone("+25:00")).toBe(false);
    expect(isValidTimeZone("nonsense")).toBe(false);
  });

  it("throws InvalidTimeZoneError when resolving an unknown name", () => {
    expect(() => localDateFormatter("Not/AZone")).toThrow(InvalidTimeZoneError);
  });
});
