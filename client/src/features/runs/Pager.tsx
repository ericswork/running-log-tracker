import { Button } from "@/components/ui/button";
import { pageRange } from "./pageRange";

// Presentational pager for the run list, rendered below the table as a single
// three-section bar: "Page X of Y" readout (left), windowed numbered buttons
// (center), and Previous/Next (right). The caller owns the offset and converts
// the page passed to onPageChange back into an offset. The first/last numbered
// buttons are always shown, so they double as jump-to-first / jump-to-last.
export function Pager({
  currentPage,
  pageCount,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const tokens = pageRange(currentPage, pageCount);

  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {pageCount}
      </span>

      <div className="flex items-center gap-1">
        {tokens.map((token, i) =>
          token === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              aria-hidden
              className="px-2 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : token === currentPage ? (
            <Button
              key={token}
              type="button"
              size="sm"
              variant="default"
              aria-current="page"
              disabled
            >
              {token}
            </Button>
          ) : (
            <Button
              key={token}
              type="button"
              size="sm"
              variant="outline"
              aria-label={`Go to page ${token}`}
              onClick={() => onPageChange(token)}
            >
              {token}
            </Button>
          ),
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
