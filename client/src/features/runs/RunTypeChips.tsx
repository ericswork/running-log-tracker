import { Button } from "@/components/ui/button";
import { RUN_TYPES, type RunType } from "@/api/runs";

// Explicit multi-select of run types as toggle chips (default all-on at the
// caller). Selected chips are filled, unselected are outlined; "Select all" and
// "Clear" set the whole set explicitly. Selecting none yields no results (the
// caller shows the no-match empty state).
export function RunTypeChips({
  selected,
  onChange,
}: {
  selected: RunType[];
  onChange: (next: RunType[]) => void;
}) {
  const toggle = (type: RunType) =>
    onChange(
      selected.includes(type)
        ? selected.filter((t) => t !== type)
        : [...selected, type],
    );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {RUN_TYPES.map((type) => {
        const on = selected.includes(type);
        return (
          <Button
            key={type}
            type="button"
            size="sm"
            variant={on ? "default" : "outline"}
            aria-pressed={on}
            onClick={() => toggle(type)}
          >
            {type}
          </Button>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onChange([...RUN_TYPES])}
      >
        Select all
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onChange([])}
      >
        Clear
      </Button>
    </div>
  );
}
