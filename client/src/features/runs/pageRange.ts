// Pure helper for the run-list pager's numbered buttons. Given the current page
// and total page count, it returns the ordered sequence of page numbers to
// render, with "ellipsis" markers standing in for collapsed gaps. Kept
// framework-free so the windowing edge cases are unit-tested without rendering.

export type PageToken = number | "ellipsis";

// Build the windowed page sequence: always the first and last page, plus the
// current page and its immediate neighbours (±1). Gaps wider than one page
// collapse to a single "ellipsis"; a gap of exactly one page is filled with that
// page's number instead (a lone "…" hiding a single page is pointless).
export function pageRange(currentPage: number, pageCount: number): PageToken[] {
  if (pageCount <= 1) return [1];

  // Concrete page numbers we always want shown, de-duplicated.
  const pages = new Set<number>([1, pageCount]);
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p >= 1 && p <= pageCount) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);

  const tokens: PageToken[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i];
    if (i > 0) {
      const gap = page - sorted[i - 1];
      if (gap === 2) tokens.push(page - 1); // single hidden page → show its number
      else if (gap > 2) tokens.push("ellipsis");
    }
    tokens.push(page);
  }
  return tokens;
}
