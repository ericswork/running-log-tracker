// Pure transforms from endpoint data into Recharts-ready rows. Kept separate
// from the chart components so the data-shaping logic (including the
// hide-empty-weeks filter and the pace gap handling) is unit-testable without
// rendering SVG in jsdom.

import type { WeeklyMileage, PacePeriod, TypeBreakdown } from "@/api/stats";
import { avgPaceSecPerKm, formatWeekLabel } from "./format";

export interface WeeklyChartRow {
  weekStart: string;
  label: string;
  distanceKm: number;
  runCount: number;
}

export interface PaceChartRow {
  weekStart: string;
  label: string;
  // null for zero-distance (empty) weeks → the line renders a gap, not a 0 pace.
  paceSecPerKm: number | null;
}

export interface TypeChartRow {
  name: string;
  distanceKm: number;
  count: number;
}

export function toWeeklyChartData(
  weeks: WeeklyMileage[],
  hideEmpty: boolean,
): WeeklyChartRow[] {
  return (hideEmpty ? weeks.filter((w) => w.runCount > 0) : weeks).map((w) => ({
    weekStart: w.weekStart,
    label: formatWeekLabel(w.weekStart),
    distanceKm: w.distanceKm,
    runCount: w.runCount,
  }));
}

export function toPaceChartData(
  periods: PacePeriod[],
  hideEmpty: boolean,
): PaceChartRow[] {
  // An empty week has zero distance; hiding them removes the gap points too.
  return (hideEmpty ? periods.filter((p) => p.distanceKm > 0) : periods).map(
    (p) => ({
      weekStart: p.weekStart,
      label: formatWeekLabel(p.weekStart),
      paceSecPerKm: avgPaceSecPerKm(p.distanceKm, p.durationSec),
    }),
  );
}

export function toTypeChartData(types: TypeBreakdown[]): TypeChartRow[] {
  return types.map((t) => ({
    name: t.type,
    distanceKm: t.distanceKm,
    count: t.count,
  }));
}
