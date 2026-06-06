import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithClient } from "../../test/renderWithClient";
import { Dashboard } from "./Dashboard";
import * as statsApi from "@/api/stats";

vi.mock("@/api/stats", async (importActual) => {
  const actual = await importActual<typeof import("@/api/stats")>();
  return {
    ...actual,
    fetchSummary: vi.fn(),
    fetchWeekly: vi.fn(),
    fetchPaceTrend: vi.fn(),
    fetchTypeBreakdown: vi.fn(),
  };
});

function mockData() {
  ;(statsApi.fetchSummary as Mock).mockResolvedValue({
    totalRuns: 3,
    totalDistanceKm: 18,
    totalDurationSec: 5400,
  })
  ;(statsApi.fetchWeekly as Mock).mockResolvedValue([
    { weekStart: "2026-06-01", distanceKm: 8, runCount: 2 },
    { weekStart: "2026-06-08", distanceKm: 0, runCount: 0 },
    { weekStart: "2026-06-15", distanceKm: 10, runCount: 1 },
  ])
  ;(statsApi.fetchPaceTrend as Mock).mockResolvedValue([
    { weekStart: "2026-06-01", distanceKm: 8, durationSec: 2400 },
    { weekStart: "2026-06-08", distanceKm: 0, durationSec: 0 },
    { weekStart: "2026-06-15", distanceKm: 10, durationSec: 3000 },
  ])
  ;(statsApi.fetchTypeBreakdown as Mock).mockResolvedValue([
    { type: "Easy", count: 2, distanceKm: 8 },
    { type: "Long Run", count: 1, distanceKm: 10 },
  ])
}

function mockEmpty() {
  ;(statsApi.fetchSummary as Mock).mockResolvedValue({
    totalRuns: 0,
    totalDistanceKm: 0,
    totalDurationSec: 0,
  })
  ;(statsApi.fetchWeekly as Mock).mockResolvedValue([])
  ;(statsApi.fetchPaceTrend as Mock).mockResolvedValue([])
  ;(statsApi.fetchTypeBreakdown as Mock).mockResolvedValue([])
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Dashboard", () => {
  it("renders summary cards and chart sections from endpoint data", async () => {
    mockData();
    renderWithClient(<Dashboard />);

    // Summary cards: derived/formatted client-side.
    expect(await screen.findByText("18.0 km")).toBeInTheDocument();
    expect(screen.getByText("Total runs")).toBeInTheDocument();
    expect(screen.getByText("1:30:00")).toBeInTheDocument(); // total time
    expect(screen.getByText("5:00 /km")).toBeInTheDocument(); // avg pace

    // Each chart card title renders (SVG internals aren't jsdom-testable).
    expect(screen.getByText("Weekly mileage")).toBeInTheDocument();
    expect(screen.getByText("Pace trend")).toBeInTheDocument();
    expect(screen.getByText("Run type breakdown")).toBeInTheDocument();
  });

  it("shows a graceful empty state in each chart when there are no runs", async () => {
    mockEmpty();
    renderWithClient(<Dashboard />);

    const empties = await screen.findAllByText("No runs yet");
    expect(empties).toHaveLength(3); // one per chart
  });

  it("toggles the hide-empty-weeks checkbox", async () => {
    mockData();
    renderWithClient(<Dashboard />);

    const checkbox = await screen.findByRole("checkbox", {
      name: /hide empty weeks/i,
    });
    expect(checkbox).toHaveAttribute("aria-checked", "false");

    fireEvent.click(checkbox);
    await waitFor(() =>
      expect(checkbox).toHaveAttribute("aria-checked", "true"),
    );
  });
});
