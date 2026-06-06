import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyChartRow } from "./shape";
import { formatDistance } from "./format";
import { EmptyState } from "./EmptyState";

const AXIS_TICK = { fontSize: 12, fill: "var(--muted-foreground)" } as const;

const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
} as const;

// Bar chart of total distance per week. Zero-filled weeks render as empty bars,
// keeping the time axis continuous.
export function WeeklyMileageChart({ data }: { data: WeeklyChartRow[] }) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} />
        <YAxis tick={AXIS_TICK} tickLine={false} width={40} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "var(--accent)", opacity: 0.3 }}
          formatter={(value) => [formatDistance(Number(value)), "Distance"]}
        />
        <Bar
          dataKey="distanceKm"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          name="Distance"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
