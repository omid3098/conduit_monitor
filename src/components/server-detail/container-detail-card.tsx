"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatCpu,
  formatMemory,
  formatGoDuration,
  formatBytes,
  formatDuration,
  formatCompact,
} from "@/lib/format";
import type { AgentContainer } from "@/lib/types";

interface ContainerDetailCardProps {
  container: AgentContainer;
}

const statusVariant = {
  running: "default" as const,
  down: "destructive" as const,
  unhealthy: "secondary" as const,
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function ContainerDetailCard({ container }: ContainerDetailCardProps) {
  const cpuBarPercent = Math.min((container.cpu_percent / 200) * 100, 100);
  const app = container.app_metrics;
  const health = container.health;
  const settings = container.settings;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium truncate">
            {container.name}
          </CardTitle>
          <Badge variant={statusVariant[container.status]}>
            {container.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {container.id}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* CPU bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>CPU</span>
            <span>{formatCpu(container.cpu_percent)} / 200%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${cpuBarPercent}%` }}
            />
          </div>
        </div>

        {/* Basic metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Memory" value={formatMemory(container.memory_mb)} />
          <Field label="Uptime" value={formatGoDuration(container.uptime)} />
        </div>

        {/* App metrics */}
        {app && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Application
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field
                label="Connected"
                value={formatCompact(app.connected_clients)}
              />
              <Field
                label="Connecting"
                value={formatCompact(app.connecting_clients)}
              />
              <Field
                label="Announcing"
                value={formatCompact(app.announcing)}
              />
              <Field
                label="Live"
                value={
                  <Badge
                    variant={app.is_live ? "default" : "outline"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {app.is_live ? "Yes" : "No"}
                  </Badge>
                }
              />
              <Field
                label="Bytes Up"
                value={formatBytes(app.bytes_uploaded)}
              />
              <Field
                label="Bytes Down"
                value={formatBytes(app.bytes_downloaded)}
              />
              <Field
                label="App Uptime"
                value={formatDuration(app.uptime_seconds)}
              />
              <Field
                label="Idle"
                value={formatDuration(app.idle_seconds)}
              />
            </div>
          </div>
        )}

        {/* Health metrics */}
        {health && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Health
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field
                label="Restarts"
                value={
                  <span
                    className={
                      health.restart_count > 0
                        ? "text-yellow-500 font-bold"
                        : ""
                    }
                  >
                    {health.restart_count}
                  </span>
                }
              />
              <Field
                label="OOM Killed"
                value={
                  <Badge
                    variant={health.oom_killed ? "destructive" : "outline"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {health.oom_killed ? "Yes" : "No"}
                  </Badge>
                }
              />
              <Field
                label="File Descriptors"
                value={formatCompact(health.fd_count)}
              />
              <Field
                label="Threads"
                value={formatCompact(health.thread_count)}
              />
            </div>
          </div>
        )}

        {/* Container settings */}
        {settings && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Settings
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field
                label="Max Clients"
                value={formatCompact(settings.max_clients)}
              />
              <Field
                label="BW Limit"
                value={
                  settings.bandwidth_limit_mbps > 0
                    ? `${settings.bandwidth_limit_mbps} Mbps`
                    : "None"
                }
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
