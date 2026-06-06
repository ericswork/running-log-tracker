import { describe, it, expect } from "vitest";
import {
  toWeeklyChartData,
  toPaceChartData,
  toTypeChartData,
} from "./shape";
import type { WeeklyMileage, PacePeriod, TypeBreakdown } from "@/api/stats";

// A zero-filled three-week series with an empty middle week.
const WEEKS: WeeklyMileage[] = [
  { weekStart: "2026-06-01", distanceKm: 8, runCount: 2 },
  { weekStart: "2026-06-08", distanceKm: 0, runCount: 0 },
  { weekStart: "2026-06-15", distanceKm: 10, runCount: 1 },
];

const PERIODS: PacePeriod[] = [
  { weekStart: "2026-06-01", distanceKm: 8, durationSec: 2400 }, // 5:00 /km
  { weekStart: "2026-06-08", distanceKm: 0, durationSec: 0 }, // empty → null
  { weekStart: "2026-06-15", distanceKm: 10, durationSec: 3000 }, // 5:00 /km
];

describe("toWeeklyChartData", () => {
  it("keeps every week (zero-filled) when not hiding empties, with labels", () => {
    const rows = toWeeklyChartData(WEEKS, false);
    expect(rows).toEqual([
      { weekStart: "2026-06-01", label: "Jun 1", distanceKm: 8, runCount: 2 },
      { weekStart: "2026-06-08", label: "Jun 8", distanceKm: 0, runCount: 0 },
      { weekStart: "2026-06-15", label: "Jun 15", distanceKm: 10, runCount: 1 },
    ]);
  });

  it("drops zero-run weeks when hiding empties", () => {
    const rows = toWeeklyChartData(WEEKS, true);
    expect(rows.map((r) => r.weekStart)).toEqual(["2026-06-01", "2026-06-15"]);
  });
});

describe("toPaceChartData", () => {
  it("maps empty weeks to a null pace (a gap) when showing all weeks", () => {
    const rows = toPaceChartData(PERIODS, false);
    expect(rows.map((r) => r.paceSecPerKm)).toEqual([300, null, 300]);
  });

  it("drops empty weeks (and their gaps) when hiding empties", () => {
    const rows = toPaceChartData(PERIODS, true);
    expect(rows.map((r) => r.weekStart)).toEqual(["2026-06-01", "2026-06-15"]);
    expect(rows.every((r) => r.paceSecPerKm !== null)).toBe(true);
  });
});

describe("toTypeChartData", () => {
  it("maps endpoint rows to name/distance/count for the pie", () => {
    const types: TypeBreakdown[] = [
      { type: "Easy", count: 1, distanceKm: 5 },
      { type: "Long Run", count: 1, distanceKm: 10 },
    ];
    expect(toTypeChartData(types)).toEqual([
      { name: "Easy", distanceKm: 5, count: 1 },
      { name: "Long Run", distanceKm: 10, count: 1 },
    ]);
  });
});
