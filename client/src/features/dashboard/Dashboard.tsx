import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSummary, useWeekly, usePaceTrend, useTypeBreakdown } from "./hooks";
import { SummaryCards } from "./SummaryCards";
import { ChartCard } from "./ChartCard";
import { WeeklyMileageChart } from "./WeeklyMileageChart";
import { PaceTrendChart } from "./PaceTrendChart";
import { TypeBreakdownChart } from "./TypeBreakdownChart";
import { toWeeklyChartData, toPaceChartData, toTypeChartData } from "./shape";

// The analytics dashboard: summary cards + three charts, fed by the React Query
// hooks (which pass the browser timezone). All shaping/formatting is client-side
// and the layout stacks to a single column on mobile via the existing shell.
export function Dashboard() {
  // Client-side filter over the already-fetched series — no refetch.
  const [hideEmpty, setHideEmpty] = useState(false);

  const summary = useSummary();
  const weekly = useWeekly();
  const pace = usePaceTrend();
  const byType = useTypeBreakdown();

  const isError =
    summary.isError || weekly.isError || pace.isError || byType.isError;
  const isLoading =
    summary.isLoading || weekly.isLoading || pace.isLoading || byType.isLoading;

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load stats. Please try again.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading stats…</p>;
  }

  const weeklyData = toWeeklyChartData(weekly.data ?? [], hideEmpty);
  const paceData = toPaceChartData(pace.data ?? [], hideEmpty);
  const typeData = toTypeChartData(byType.data ?? []);

  return (
    <div className="space-y-6">
      {summary.data && <SummaryCards summary={summary.data} />}

      <div className="flex items-center gap-2">
        <Checkbox
          id="hide-empty-weeks"
          checked={hideEmpty}
          onCheckedChange={(checked) => setHideEmpty(checked === true)}
        />
        <Label htmlFor="hide-empty-weeks">Hide empty weeks</Label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Weekly mileage">
          <WeeklyMileageChart data={weeklyData} />
        </ChartCard>
        <ChartCard title="Pace trend">
          <PaceTrendChart data={paceData} />
        </ChartCard>
        <ChartCard title="Run type breakdown">
          <TypeBreakdownChart data={typeData} />
        </ChartCard>
      </div>
    </div>
  );
}
