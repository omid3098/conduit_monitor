"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentSystemMetrics, MetricsDataPoint } from "@/lib/types";

interface LoadAveragePanelProps {
  system: AgentSystemMetrics | null;
  history: MetricsDataPoint[];
}

function LoadValue({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl font-bold tabular-nums">{value.toFixed(2)}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function LoadAveragePanel({ system }: LoadAveragePanelProps) {
  const load1 = system?.load_avg_1m ?? 0;
  const load5 = system?.load_avg_5m ?? 0;
  const load15 = system?.load_avg_15m ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Load Average</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-around py-4">
          <LoadValue value={load1} label="1 min" />
          <LoadValue value={load5} label="5 min" />
          <LoadValue value={load15} label="15 min" />
        </div>
      </CardContent>
    </Card>
  );
}
