"use client";

import type { ServerStatusResult, ServerConnectionState } from "@/lib/types";
import { formatMbps, formatCpu, formatBytes, formatCompact } from "@/lib/format";

interface ServerData {
  data: ServerStatusResult | undefined;
  connectionState: ServerConnectionState;
}

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <span className="text-[10px] uppercase text-muted-foreground">
        {label}
      </span>
      <div className="text-2xl font-bold tabular-nums mt-0.5">{value}</div>
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
    </div>
  );
}

function SmallStatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border bg-card/50 px-3 py-2">
      <span className="text-[10px] uppercase text-muted-foreground">
        {label}
      </span>
      <div className="text-lg font-semibold tabular-nums mt-0.5">{value}</div>
      {subtitle && (
        <span className="text-[11px] text-muted-foreground">{subtitle}</span>
      )}
    </div>
  );
}

export function AggregateStats({
  serversData,
}: {
  serversData: ServerData[];
}) {
  const online = serversData.filter(
    (s) => s.connectionState === "online" || s.connectionState === "stale"
  );
  const totalServers = serversData.length;
  const onlineCount = online.length;
  const offlineCount = totalServers - onlineCount;

  const totalConnected = online.reduce(
    (s, d) => s + (d.data?.connected_clients ?? 0),
    0
  );
  const totalConnecting = online.reduce(
    (s, d) => s + (d.data?.connecting_clients ?? 0),
    0
  );

  const totalNetIn = online.reduce(
    (s, d) => s + (d.data?.system?.net_in_mbps ?? 0),
    0
  );
  const totalNetOut = online.reduce(
    (s, d) => s + (d.data?.system?.net_out_mbps ?? 0),
    0
  );

  const avgCpu =
    online.length > 0
      ? online.reduce((s, d) => s + (d.data?.system?.cpu_percent ?? 0), 0) /
        online.length
      : 0;

  const totalSessionUpload = online.reduce(
    (s, d) => s + (d.data?.session?.total_upload_bytes ?? 0),
    0
  );
  const totalSessionDownload = online.reduce(
    (s, d) => s + (d.data?.session?.total_download_bytes ?? 0),
    0
  );
  const totalContainers = online.reduce(
    (s, d) => s + (d.data?.total_containers ?? 0),
    0
  );
  const totalMaxClients = online.reduce((s, d) => {
    const topLevel = d.data?.settings?.max_clients ?? 0;
    if (topLevel > 0) return s + topLevel;
    return s + (d.data?.containers?.reduce(
      (cs, c) => cs + (c.settings?.max_clients ?? 0), 0
    ) ?? 0);
  }, 0);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-3">
        <StatCard
          label="Servers"
          value={totalServers.toString()}
          subtitle={`${onlineCount} online${offlineCount > 0 ? ` · ${offlineCount} offline` : ""}`}
        />
        <StatCard
          label="Connected"
          value={totalConnected.toString()}
          subtitle="active clients"
        />
        <StatCard
          label="Connecting"
          value={totalConnecting.toString()}
          subtitle="in progress"
        />
        <StatCard
          label="Aggregate Traffic"
          value={`↑${formatMbps(totalNetOut)}`}
          subtitle={`↓${formatMbps(totalNetIn)}`}
        />
        <StatCard label="Avg Host CPU" value={formatCpu(avgCpu)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <SmallStatCard
          label="Session Traffic"
          value={formatBytes(totalSessionUpload + totalSessionDownload)}
          subtitle={`↑${formatBytes(totalSessionUpload)} ↓${formatBytes(totalSessionDownload)}`}
        />
        <SmallStatCard
          label="Containers"
          value={totalContainers.toString()}
          subtitle="running"
        />
        <SmallStatCard
          label="Max Clients"
          value={totalMaxClients > 0 ? formatCompact(totalMaxClients) : "--"}
          subtitle="capacity"
        />
      </div>
    </div>
  );
}
