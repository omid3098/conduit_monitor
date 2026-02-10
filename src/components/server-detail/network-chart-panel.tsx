"use client";

import {
  AreaChart,
  Area,
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

interface NetworkChartPanelProps {
  history: MetricsDataPoint[];
}

const chartConfig: ChartConfig = {
  system_net_in: {
    label: "Net In",
    color: "var(--color-chart-1)",
  },
  system_net_out: {
    label: "Net Out",
    color: "var(--color-chart-2)",
  },
};

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NetworkChartPanel({ history }: NetworkChartPanelProps) {
  const data = history.map((p) => ({
    time: p.timestamp,
    system_net_in: p.system_net_in,
    system_net_out: p.system_net_out,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Network Throughput
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={data}>
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
              unit=" Mbps"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatTime(value as number)}
                  formatter={(value) => [`${Number(value).toFixed(1)} Mbps`]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="system_net_in"
              stroke="var(--color-system_net_in)"
              fill="var(--color-system_net_in)"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="system_net_out"
              stroke="var(--color-system_net_out)"
              fill="var(--color-system_net_out)"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
