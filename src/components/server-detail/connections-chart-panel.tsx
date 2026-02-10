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

interface ConnectionsChartPanelProps {
  history: MetricsDataPoint[];
  compact?: boolean;
  className?: string;
}

const chartConfig: ChartConfig = {
  total_connections: {
    label: "Total Connections",
    color: "var(--color-chart-1)",
  },
  unique_ips: {
    label: "Unique IPs",
    color: "var(--color-chart-2)",
  },
};

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConnectionsChartPanel({ history, compact, className }: ConnectionsChartPanelProps) {
  const data = history.map((p) => ({
    time: p.timestamp,
    total_connections: p.total_connections,
    unique_ips: p.unique_ips,
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
        allowDecimals={false}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            labelFormatter={(value) => {
              const ts = typeof value === "number" ? value : Number(value);
              if (isNaN(ts) || ts === 0) return "";
              return formatTime(ts);
            }}
          />
        }
      />
      <Line
        type="monotone"
        dataKey="total_connections"
        stroke="var(--color-total_connections)"
        strokeWidth={2}
        dot={false}
        isAnimationActive={false}
      />
      <Line
        type="monotone"
        dataKey="unique_ips"
        stroke="var(--color-unique_ips)"
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
          Connections Over Time
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
        <CardTitle className="text-sm font-medium">
          Connections Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          {chartContent}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
