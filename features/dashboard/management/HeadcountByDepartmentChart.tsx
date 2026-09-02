"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardWorkforce } from "@/types/dashboard";

const MAX_BARS = 7;

const config = {
  headcount: { label: "People", color: "var(--chart-1)" },
} satisfies ChartConfig;

function truncate(value: string, max = 14): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** A single-line y-axis label — Recharts' default tick wraps on spaces. */
function DeptTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  return (
    <text
      x={x}
      y={y}
      dx={-6}
      dy={4}
      textAnchor="end"
      className="fill-muted-foreground"
      fontSize={11}
    >
      {truncate(String(payload?.value ?? ""))}
    </text>
  );
}

/**
 * Headcount per department — one measure across a nominal axis, so a
 * sorted horizontal bar (not a pie): sizes read against a shared baseline
 * and the department names sit on the y-axis. Anything past the top seven
 * folds into "Others" so the chart stays legible.
 */
export function HeadcountByDepartmentChart({ workforce }: { workforce: DashboardWorkforce }) {
  const sorted = [...workforce.by_department].sort((a, b) => b.headcount - a.headcount);
  const head = sorted.slice(0, MAX_BARS);
  const rest = sorted.slice(MAX_BARS);

  const data = [
    ...head.map((dept) => ({ name: dept.name, headcount: dept.headcount })),
    ...(rest.length > 0
      ? [
          {
            name: `Others (${rest.length})`,
            headcount: rest.reduce((sum, d) => sum + d.headcount, 0),
          },
        ]
      : []),
  ];

  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
        No departments yet.
      </p>
    );
  }

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: `${Math.max(data.length * 32 + 8, 96)}px` }}
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 30, bottom: 0, left: 0 }}
        barCategoryGap={8}
      >
        <XAxis type="number" dataKey="headcount" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={104}
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={<DeptTick />}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar
          dataKey="headcount"
          fill="var(--color-headcount)"
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="headcount"
            position="right"
            offset={6}
            className="fill-foreground"
            fontSize={11}
            fontWeight={600}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
