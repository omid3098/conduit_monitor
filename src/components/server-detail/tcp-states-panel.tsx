"use client";

import { PieChart, Pie, Cell } from "recharts";
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
import type { AgentConnections } from "@/lib/types";

interface TcpStatesPanelProps {
  connections: AgentConnections | null;
}

const STATE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "hsl(280, 65%, 60%)",
  "hsl(200, 65%, 55%)",
  "hsl(160, 55%, 50%)",
];

export function TcpStatesPanel({ connections }: TcpStatesPanelProps) {
  if (!connections) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            TCP Connection States
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            No connection data
          </p>
        </CardContent>
      </Card>
    );
  }

  const stateEntries = Object.entries(connections.states).filter(
    ([, count]) => count > 0
  );
  const chartData = stateEntries.map(([name, value]) => ({ name, value }));

  const chartConfig: ChartConfig = Object.fromEntries(
    stateEntries.map(([name], i) => [
      name,
      {
        label: name,
        color: STATE_COLORS[i % STATE_COLORS.length],
      },
    ])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          TCP Connection States
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary numbers */}
        <div className="flex items-center justify-around mb-4">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums">
              {connections.total}
            </span>
            <span className="text-xs text-muted-foreground">
              Total Connections
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums">
              {connections.unique_ips}
            </span>
            <span className="text-xs text-muted-foreground">Unique IPs</span>
          </div>
        </div>

        {/* Donut chart */}
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="80%"
                isAnimationActive={false}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={STATE_COLORS[i % STATE_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No state data
          </p>
        )}

        {/* Legend */}
        {chartData.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
            {chartData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div
                  className="size-2.5 rounded-sm"
                  style={{
                    backgroundColor: STATE_COLORS[i % STATE_COLORS.length],
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
