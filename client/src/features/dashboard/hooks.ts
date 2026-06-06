import { useQuery } from "@tanstack/react-query";
import {
  fetchSummary,
  fetchWeekly,
  fetchPaceTrend,
  fetchTypeBreakdown,
  type StatsParams,
} from "@/api/stats";

// React Query hooks for the dashboard. Each keys on the params so a date-range
// change refetches; timezone is the stable browser zone (resolved in the
// fetcher), so it need not be part of the key within a session.

export function useSummary(params?: StatsParams) {
  return useQuery({
    queryKey: ["stats", "summary", params ?? {}],
    queryFn: () => fetchSummary(params),
  });
}

export function useWeekly(params?: StatsParams) {
  return useQuery({
    queryKey: ["stats", "weekly", params ?? {}],
    queryFn: () => fetchWeekly(params),
  });
}

export function usePaceTrend(params?: StatsParams) {
  return useQuery({
    queryKey: ["stats", "pace", params ?? {}],
    queryFn: () => fetchPaceTrend(params),
  });
}

export function useTypeBreakdown(params?: StatsParams) {
  return useQuery({
    queryKey: ["stats", "by-type", params ?? {}],
    queryFn: () => fetchTypeBreakdown(params),
  });
}
