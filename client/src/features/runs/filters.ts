import { RUN_TYPES, type RunType, type RunFilters } from "@/api/runs";

// UI state for the Log filter bar. Distance fields are kept as raw input strings
// and parsed when mapping to the API. Run types default to all selected.
export interface FilterState {
  from?: string;
  to?: string;
  minDistanceKm: string;
  maxDistanceKm: string;
  selectedTypes: RunType[];
}

export const defaultFilterState: FilterState = {
  from: undefined,
  to: undefined,
  minDistanceKm: "",
  maxDistanceKm: "",
  selectedTypes: [...RUN_TYPES],
};

// A filter is "active" when it narrows the default view: any date/distance bound
// set, or a run-type selection that isn't the full set.
export function isFilterActive(s: FilterState): boolean {
  return (
    Boolean(s.from || s.to || s.minDistanceKm.trim() || s.maxDistanceKm.trim()) ||
    s.selectedTypes.length !== RUN_TYPES.length
  );
}

// Zero run types selected → the list is empty by definition; the caller shows the
// no-match state without querying (the API has no "match none").
export function noTypesSelected(s: FilterState): boolean {
  return s.selectedTypes.length === 0;
}

function parseNum(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// Map UI state to API query params. All types selected → omit `type` (≡ all);
// a subset → that list. Distance strings are parsed; blanks become undefined.
export function toApiFilters(s: FilterState): RunFilters {
  return {
    from: s.from || undefined,
    to: s.to || undefined,
    minDistanceKm: parseNum(s.minDistanceKm),
    maxDistanceKm: parseNum(s.maxDistanceKm),
    type:
      s.selectedTypes.length === RUN_TYPES.length
        ? undefined
        : s.selectedTypes,
  };
}
