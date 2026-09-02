"use client";

import { Cell, Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardAttendanceToday } from "@/types/dashboard";

const SLICES: { key: keyof DashboardAttendanceToday; label: string; color: string }[] = [
  { key: "present", label: "Present", color: "var(--color-present)" },
  { key: "late", label: "Late", color: "var(--color-late)" },
  { key: "absent", label: "Absent", color: "var(--color-absent)" },
  { key: "on_leave", label: "On leave", color: "var(--color-on_leave)" },
  { key: "missing_checkout", label: "No checkout", color: "var(--color-missing_checkout)" },
];

// Status states, not a categorical series — each keeps its meaning colour
// and is spelled out in the legend beside the ring, never colour alone.
const config = {
  present: { label: "Present", color: "var(--chart-2)" },
  late: { label: "Late", color: "var(--chart-3)" },
  absent: { label: "Absent", color: "var(--chart-4)" },
  on_leave: { label: "On leave", color: "var(--chart-1)" },
  missing_checkout: { label: "No checkout", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

/**
 * Today's attendance split as a ring with the marked total in the middle —
 * one point-in-time composition of a single whole. The number grid below
 * doubles as the legend and the exact values.
 */
export function AttendanceTodayChart({ attendance }: { attendance: DashboardAttendanceToday }) {
  const data = SLICES.map((slice) => ({
    key: slice.key,
    label: slice.label,
    value: attendance[slice.key] as number,
    fill: slice.color,
  })).filter((slice) => slice.value > 0);

  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  if (total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
        Nothing marked yet today.
      </p>
    );
  }

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-40">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="key" hideLabel />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius="62%"
          outerRadius="94%"
          paddingAngle={2}
          strokeWidth={2}
          stroke="var(--card)"
          isAnimationActive={false}
        >
          {data.map((slice) => (
            <Cell key={slice.key} fill={slice.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null;
              return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan
                    x={viewBox.cx}
                    className="fill-foreground font-mono text-xl font-bold"
                  >
                    {total}
                  </tspan>
                  <tspan
                    x={viewBox.cx}
                    dy="1.3em"
                    className="fill-muted-foreground text-[10px]"
                  >
                    marked
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
