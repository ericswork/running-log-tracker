import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DateRangeControl } from "@/components/DateRangeControl";
import { RunTypeChips } from "./RunTypeChips";
import { defaultFilterState, isFilterActive, type FilterState } from "./filters";

// Filter bar above the runs table on the Log tab: date range, distance band, and
// run-type chips, with a result/active indicator and a Clear-filters reset.
// Stacks vertically; controls wrap on narrow viewports.
export function RunFilterBar({
  value,
  onChange,
  resultCount,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  resultCount?: number;
}) {
  const active = isFilterActive(value);

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-4">
        <DateRangeControl
          value={{ from: value.from, to: value.to }}
          onChange={(range) =>
            onChange({ ...value, from: range.from, to: range.to })
          }
        />
        <div className="grid gap-1">
          <Label className="text-xs">Distance (km)</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="min"
              aria-label="Minimum distance (km)"
              className="w-20"
              value={value.minDistanceKm}
              onChange={(e) =>
                onChange({ ...value, minDistanceKm: e.target.value })
              }
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="max"
              aria-label="Maximum distance (km)"
              className="w-20"
              value={value.maxDistanceKm}
              onChange={(e) =>
                onChange({ ...value, maxDistanceKm: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Run type</Label>
        <RunTypeChips
          selected={value.selectedTypes}
          onChange={(types) => onChange({ ...value, selectedTypes: types })}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {resultCount !== undefined
            ? `${resultCount} run${resultCount === 1 ? "" : "s"}`
            : ""}
          {active ? " · filtered" : ""}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!active}
          onClick={() => onChange(defaultFilterState)}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
