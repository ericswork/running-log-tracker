import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface DateRange {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

// Shared from/to date-range control built on native date inputs (which emit
// YYYY-MM-DD directly). Reused by the Log filter bar and the Dashboard.
export function DateRangeControl({
  value,
  onChange,
  idPrefix = "date",
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  idPrefix?: string;
}) {
  const active = Boolean(value.from || value.to);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="grid gap-1">
        <Label htmlFor={`${idPrefix}-from`} className="text-xs">
          From
        </Label>
        <Input
          id={`${idPrefix}-from`}
          type="date"
          className="w-[9.5rem]"
          value={value.from ?? ""}
          onChange={(e) =>
            onChange({ ...value, from: e.target.value || undefined })
          }
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${idPrefix}-to`} className="text-xs">
          To
        </Label>
        <Input
          id={`${idPrefix}-to`}
          type="date"
          className="w-[9.5rem]"
          value={value.to ?? ""}
          onChange={(e) =>
            onChange({ ...value, to: e.target.value || undefined })
          }
        />
      </div>
      {active && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange({ from: undefined, to: undefined })}
        >
          Clear dates
        </Button>
      )}
    </div>
  );
}
