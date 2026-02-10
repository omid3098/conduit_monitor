"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
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
import type { AgentCountryClients } from "@/lib/types";

interface CountryPanelProps {
  countries: AgentCountryClients[];
}

const chartConfig: ChartConfig = {
  connections: {
    label: "Connections",
    color: "var(--color-chart-1)",
  },
};

export function CountryPanel({ countries }: CountryPanelProps) {
  const sorted = [...countries]
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Clients by Country
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No country data available
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={sorted} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/50"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="country"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="connections"
                fill="var(--color-connections)"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
