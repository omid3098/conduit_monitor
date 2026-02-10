"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricDisplay } from "@/components/metric-display";
import type { AgentContainer } from "@/lib/types";
import {
  formatBytes,
  formatGoDuration,
  formatCpu,
  formatMemory,
} from "@/lib/format";

const statusVariant = {
  running: "default" as const,
  down: "destructive" as const,
  unhealthy: "secondary" as const,
};

export function ContainerCard({ container }: { container: AgentContainer }) {
  const barPercent = Math.min((container.cpu_percent / 200) * 100, 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {container.name}
          </CardTitle>
          <Badge variant={statusVariant[container.status]}>
            {container.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          {container.id}
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>CPU</span>
            <span>{formatCpu(container.cpu_percent)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${barPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MetricDisplay label="Memory" value={formatMemory(container.memory_mb)} />
          <MetricDisplay label="Uptime" value={formatGoDuration(container.uptime)} />

          {container.app_metrics ? (
            <>
              <MetricDisplay
                label="Connections"
                value={container.app_metrics.connections.toString()}
              />
              <MetricDisplay
                label="Traffic In"
                value={formatBytes(container.app_metrics.traffic_in)}
              />
              <MetricDisplay
                label="Traffic Out"
                value={formatBytes(container.app_metrics.traffic_out)}
              />
            </>
          ) : (
            <div className="col-span-2 text-xs text-muted-foreground italic py-1">
              Metrics pending
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
