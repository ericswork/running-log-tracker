import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Pager } from "./Pager";

describe("Pager", () => {
  it("shows the page readout and Previous/Next controls", () => {
    render(<Pager currentPage={2} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("calls onPageChange with the clicked page number", () => {
    const onPageChange = vi.fn();
    // pageRange(3, 5) shows every page, so page 5 is a real button to click.
    render(<Pager currentPage={3} pageCount={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Go to page 5" }));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it("steps with Previous and Next", () => {
    const onPageChange = vi.fn();
    render(<Pager currentPage={3} pageCount={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 4);
  });

  it("disables Previous on the first page and Next on the last page", () => {
    const { rerender } = render(
      <Pager currentPage={1} pageCount={5} onPageChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

    rerender(<Pager currentPage={5} pageCount={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("marks the current page as non-interactive", () => {
    const onPageChange = vi.fn();
    render(<Pager currentPage={3} pageCount={5} onPageChange={onPageChange} />);
    const current = screen.getByRole("button", { current: "page" });
    expect(current).toHaveTextContent("3");
    expect(current).toBeDisabled();
  });

  it("renders first/last buttons and an ellipsis for large page counts", () => {
    const onPageChange = vi.fn();
    render(<Pager currentPage={7} pageCount={13} onPageChange={onPageChange} />);
    // First and last are always present (they double as jump-to-first/last).
    fireEvent.click(screen.getByRole("button", { name: "Go to page 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Go to page 13" }));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 13);
    // Far-out pages are collapsed, so page 4 has no button.
    expect(
      screen.queryByRole("button", { name: "Go to page 4" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("…").length).toBeGreaterThan(0);
  });
});
