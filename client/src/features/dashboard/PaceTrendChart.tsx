import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PaceChartRow } from "./shape";
import { formatPace } from "./format";
import { EmptyState } from "./EmptyState";

const AXIS_TICK = { fontSize: 12, fill: "var(--muted-foreground)" } as const;

const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
} as const;

// Short "m:ss" tick for the pace axis (no "/km" suffix to keep ticks compact).
function paceTick(value: number): string {
  const t = Math.round(value);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

// Line chart of average pace per week. Empty weeks carry a null pace and are
// rendered as a gap (connectNulls=false), never as a misleading zero pace.
export function PaceTrendChart({ data }: { data: PaceChartRow[] }) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          width={48}
          tickFormatter={paceTick}
          domain={["dataMin - 15", "dataMax + 15"]}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [formatPace(Number(value)), "Pace"]}
        />
        <Line
          type="monotone"
          dataKey="paceSecPerKm"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls={false}
          name="Pace"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
