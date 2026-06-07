import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithClient } from "./test/renderWithClient";
import App from "./App";
import * as runsApi from "@/api/runs";
import * as statsApi from "@/api/stats";

vi.mock("@/api/runs", async (importActual) => {
  const actual = await importActual<typeof import("@/api/runs")>();
  return { ...actual, fetchRuns: vi.fn() };
});

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

beforeEach(() => {
  vi.clearAllMocks();
  ;(runsApi.fetchRuns as Mock).mockResolvedValue({ runs: [], total: 0, limit: 20, offset: 0 })
  ;(statsApi.fetchSummary as Mock).mockResolvedValue({
    totalRuns: 0,
    totalDistanceKm: 0,
    totalDurationSec: 0,
  })
  ;(statsApi.fetchWeekly as Mock).mockResolvedValue([])
  ;(statsApi.fetchPaceTrend as Mock).mockResolvedValue([])
  ;(statsApi.fetchTypeBreakdown as Mock).mockResolvedValue([])
});

describe("App tab navigation", () => {
  it("defaults to the Log tab showing the run list, not the dashboard", () => {
    renderWithClient(<App />);
    expect(screen.getByRole("heading", { name: "Runs" })).toBeInTheDocument();
    // Dashboard content is not mounted while the Log tab is active.
    expect(screen.queryByText("Total runs")).not.toBeInTheDocument();
  });

  it("switches to the Dashboard tab and back", async () => {
    renderWithClient(<App />);

    // Radix Tabs switch on mousedown (button 0), not click.
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Dashboard" }));
    expect(await screen.findByText("Total runs")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Runs" })).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Log" }));
    expect(await screen.findByRole("heading", { name: "Runs" })).toBeInTheDocument();
  });
});
