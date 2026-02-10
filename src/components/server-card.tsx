"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ContainerCard } from "@/components/container-card";
import { MetricDisplay } from "@/components/metric-display";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerStatus } from "@/hooks/use-server-status";
import type { ServerSafe } from "@/lib/types";
import { formatBytes, formatCpu, formatMemory } from "@/lib/format";

export function ServerCard({ server }: { server: ServerSafe }) {
  const [expanded, setExpanded] = useState(false);
  const { data, connectionState, isLoading } = useServerStatus(server.id);

  const displayName = server.label || server.server_id || server.id.slice(0, 8);

  const aggregates = data
    ? {
        running: data.containers.filter((c) => c.status === "running").length,
        totalCpu: data.containers.reduce((s, c) => s + c.cpu_percent, 0),
        totalMem: data.containers.reduce((s, c) => s + c.memory_mb, 0),
        totalConns: data.containers.reduce(
          (s, c) => s + (c.app_metrics?.connected_clients ?? 0),
          0
        ),
        totalTrafficIn: data.containers.reduce(
          (s, c) => s + (c.app_metrics?.bytes_downloaded ?? 0),
          0
        ),
        totalTrafficOut: data.containers.reduce(
          (s, c) => s + (c.app_metrics?.bytes_uploaded ?? 0),
          0
        ),
      }
    : null;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setExpanded(!expanded)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{displayName}</CardTitle>
          <StatusBadge state={connectionState} />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : data && aggregates ? (
          <div className={connectionState !== "online" && connectionState !== "stale" ? "opacity-50" : ""}>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <MetricDisplay
                label="Containers"
                value={`${aggregates.running}/${data.total_containers}`}
              />
              <MetricDisplay label="Total CPU" value={formatCpu(aggregates.totalCpu)} />
              <MetricDisplay label="Total Memory" value={formatMemory(aggregates.totalMem)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MetricDisplay
                label="Connections"
                value={aggregates.totalConns.toString()}
              />
              <MetricDisplay
                label="Traffic In"
                value={formatBytes(aggregates.totalTrafficIn)}
              />
              <MetricDisplay
                label="Traffic Out"
                value={formatBytes(aggregates.totalTrafficOut)}
              />
            </div>

            {data.stale && (
              <p className="text-xs text-yellow-600 mt-2">
                Data may be stale (last update &gt;60s ago)
              </p>
            )}

            {expanded && (
              <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                {data.containers.map((container) => (
                  <ContainerCard key={container.id} container={container} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {connectionState === "offline"
              ? "Server unreachable"
              : connectionState === "auth_failed"
                ? "Authentication failed — check secret"
                : connectionState === "starting_up"
                  ? "Server is starting up..."
                  : "No data available"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
