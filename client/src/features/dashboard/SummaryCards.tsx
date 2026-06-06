import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Summary } from "@/api/stats";
import {
  avgPaceSecPerKm,
  formatDistance,
  formatDuration,
  formatPace,
} from "./format";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold tabular-nums">
        {value}
      </CardContent>
    </Card>
  );
}

// Row of totals. Avg pace is derived client-side from the canonical totals and
// renders "—" when there is no distance.
export function SummaryCards({ summary }: { summary: Summary }) {
  const pace = avgPaceSecPerKm(summary.totalDistanceKm, summary.totalDurationSec);
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Total runs" value={summary.totalRuns} />
      <StatCard label="Total distance" value={formatDistance(summary.totalDistanceKm)} />
      <StatCard label="Total time" value={formatDuration(summary.totalDurationSec)} />
      <StatCard label="Avg pace" value={formatPace(pace)} />
    </div>
  );
}
