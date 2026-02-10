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
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { AgentCountryClients } from "@/lib/types";
import { formatCountryCode } from "@/lib/format";

interface CountryPanelProps {
  countries: AgentCountryClients[];
  compact?: boolean;
  className?: string;
}

const chartConfig: ChartConfig = {
  connections: {
    label: "Connections",
    color: "var(--color-chart-1)",
  },
};

interface CountryDisplayItem {
  country: string;
  displayName: string;
  connections: number;
  percent: string;
}

function CountryTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CountryDisplayItem }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{item.displayName}</p>
      <p className="text-muted-foreground">
        {item.connections} connections ({item.percent}%)
      </p>
    </div>
  );
}

export function CountryPanel({ countries, compact, className }: CountryPanelProps) {
  const sorted = [...countries]
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 8);

  const total = sorted.reduce((s, c) => s + c.connections, 0);
  const displayData: CountryDisplayItem[] = sorted.map((c) => ({
    ...c,
    displayName: formatCountryCode(c.country),
    percent: total > 0 ? ((c.connections / total) * 100).toFixed(1) : "0",
  }));

  const emptyMessage = (
    <p className="text-sm text-muted-foreground py-4 text-center">
      No country data available
    </p>
  );

  const chartContent = (
    <BarChart data={displayData} layout="vertical">
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
        dataKey="displayName"
        tick={{ fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        width={80}
      />
      <ChartTooltip content={<CountryTooltip />} />
      <Bar
        dataKey="connections"
        fill="var(--color-connections)"
        radius={[0, 4, 4, 0]}
        isAnimationActive={false}
      />
    </BarChart>
  );

  if (compact) {
    return (
      <div className={cn("flex flex-col h-full min-h-0 rounded-lg border bg-card/50 p-2", className)}>
        <div className="text-xs font-medium text-muted-foreground mb-1 shrink-0">
          Clients by Country
        </div>
        <div className="flex-1 min-h-0">
          {displayData.length === 0 ? emptyMessage : (
            <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
              {chartContent}
            </ChartContainer>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Clients by Country
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayData.length === 0 ? emptyMessage : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            {chartContent}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
