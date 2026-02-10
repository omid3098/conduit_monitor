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
import { cn } from "@/lib/utils";
import type { MetricsDataPoint } from "@/lib/types";

interface NetworkChartPanelProps {
  history: MetricsDataPoint[];
  compact?: boolean;
  className?: string;
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

export function NetworkChartPanel({ history, compact, className }: NetworkChartPanelProps) {
  const data = history.map((p) => ({
    time: p.timestamp,
    system_net_in: p.system_net_in,
    system_net_out: p.system_net_out,
  }));

  const chartContent = (
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
            labelFormatter={(value) => {
              const ts = typeof value === "number" ? value : Number(value);
              if (isNaN(ts) || ts === 0) return "";
              return formatTime(ts);
            }}
            formatter={(value, name) => [
              `${Number(value).toFixed(1)} Mbps`,
              chartConfig[name as keyof typeof chartConfig]?.label ?? name,
            ]}
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
  );

  if (compact) {
    return (
      <div className={cn("flex flex-col h-full min-h-0 rounded-lg border bg-card/50 p-2", className)}>
        <div className="text-xs font-medium text-muted-foreground mb-1 shrink-0">
          Network Throughput
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
          Network Throughput
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
