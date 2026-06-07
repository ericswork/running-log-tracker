import { Button } from "@/components/ui/button";
import { pageRange } from "./pageRange";

// Presentational pager for the run list — a three-section bar: "Page X of Y"
// readout (left), windowed numbered buttons (center, hidden on mobile), and
// Previous/Next (right). The caller owns the offset and converts the page passed
// to onPageChange back into an offset. The first/last numbered buttons are always
// shown, so they double as jump-to-first / jump-to-last. Rendered as a labeled
// nav landmark; `label` distinguishes multiple pagers (e.g. the mobile top bar).
export function Pager({
  currentPage,
  pageCount,
  onPageChange,
  label = "Run pages",
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  const tokens = pageRange(currentPage, pageCount);

  return (
    <nav
      aria-label={label}
      className="flex items-center justify-between gap-2"
    >
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        Page {currentPage} of {pageCount}
      </span>

      {/* Numbered jump is a wider-screen affordance; on mobile the readout plus
          Previous/Next carry navigation (the number row would crowd the bar). */}
      <div className="hidden items-center gap-1 sm:flex">
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
    </nav>
  );
}
