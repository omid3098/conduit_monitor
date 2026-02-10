"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { MetricsDataPoint } from "@/lib/types";

interface SystemChartPanelProps {
  history: MetricsDataPoint[];
  compact?: boolean;
  className?: string;
}

const chartConfig: ChartConfig = {
  system_cpu: {
    label: "CPU %",
    color: "var(--color-chart-3)",
  },
  memory_pct: {
    label: "Memory %",
    color: "var(--color-chart-4)",
  },
};

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SystemChartPanel({ history, compact, className }: SystemChartPanelProps) {
  const data = history.map((p) => ({
    time: p.timestamp,
    system_cpu: p.system_cpu,
    memory_pct:
      p.system_memory_total > 0
        ? (p.system_memory_used / p.system_memory_total) * 100
        : 0,
  }));

  const chartContent = (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
      <XAxis
        dataKey="time"
        tickFormatter={formatTime}
        tick={{ fontSize: 11 }}
        tickLine={false}
        axisLine={false}
      />
      <YAxis
        tick={{ fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        domain={[0, 100]}
        unit="%"
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            labelFormatter={(value) => {
              const ts = typeof value === "number" ? value : Number(value);
              if (isNaN(ts) || ts === 0) return "";
              return formatTime(ts);
            }}
            formatter={(value, name) => [
              `${Number(value).toFixed(1)}%`,
              chartConfig[name as keyof typeof chartConfig]?.label ?? name,
            ]}
          />
        }
      />
      <Line
        type="monotone"
        dataKey="system_cpu"
        stroke="var(--color-system_cpu)"
        strokeWidth={2}
        dot={false}
        isAnimationActive={false}
      />
      <Line
        type="monotone"
        dataKey="memory_pct"
        stroke="var(--color-memory_pct)"
        strokeWidth={2}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );

  if (compact) {
    return (
      <div className={cn("flex flex-col h-full min-h-0 rounded-lg border bg-card/50 p-2", className)}>
        <div className="text-xs font-medium text-muted-foreground mb-1 shrink-0">
          System Resources
        </div>
        <div className="flex-1 min-h-0">
          <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
            {chartContent}
          </ChartContainer>
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">System Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          {chartContent}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
