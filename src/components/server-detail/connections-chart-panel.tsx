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
import type { MetricsDataPoint } from "@/lib/types";

interface ConnectionsChartPanelProps {
  history: MetricsDataPoint[];
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

export function ConnectionsChartPanel({ history }: ConnectionsChartPanelProps) {
  const data = history.map((p) => ({
    time: p.timestamp,
    total_connections: p.total_connections,
    unique_ips: p.unique_ips,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Connections Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
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
                  labelFormatter={(value) => formatTime(value as number)}
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
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
