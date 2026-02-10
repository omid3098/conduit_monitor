"use client";

import type { ServerStatusResult, ServerConnectionState } from "@/lib/types";
import { formatMbps, formatCpu, formatBytes, formatCompact } from "@/lib/format";

interface ServerData {
  data: ServerStatusResult | undefined;
  connectionState: ServerConnectionState;
}

function MiniStat({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="flex-1 min-w-0 text-center px-2 py-1.5">
      <div className="text-base font-bold tabular-nums leading-tight truncate">
        {value}
      </div>
      <div className="text-[10px] uppercase text-muted-foreground leading-tight">
        {label}
      </div>
      {subtitle && (
        <div className="text-[9px] text-muted-foreground/70 leading-tight truncate">
          {subtitle}
        </div>
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
    <div className="flex items-center rounded-lg border bg-card divide-x divide-border/50">
      <MiniStat
        label="Servers"
        value={totalServers.toString()}
        subtitle={`${onlineCount} on${offlineCount > 0 ? ` · ${offlineCount} off` : ""}`}
      />
      <MiniStat
        label="Connected"
        value={totalConnected.toString()}
        subtitle="active clients"
      />
      <MiniStat
        label="Connecting"
        value={totalConnecting.toString()}
        subtitle="in progress"
      />
      <MiniStat
        label="Traffic"
        value={`↑${formatMbps(totalNetOut)}`}
        subtitle={`↓${formatMbps(totalNetIn)}`}
      />
      <MiniStat label="Avg CPU" value={formatCpu(avgCpu)} />
      <MiniStat
        label="Session"
        value={formatBytes(totalSessionUpload + totalSessionDownload)}
        subtitle={`↑${formatBytes(totalSessionUpload)} ↓${formatBytes(totalSessionDownload)}`}
      />
      <MiniStat
        label="Containers"
        value={totalContainers.toString()}
        subtitle="running"
      />
      <MiniStat
        label="Capacity"
        value={totalMaxClients > 0 ? formatCompact(totalMaxClients) : "--"}
        subtitle="max clients"
      />
    </div>
  );
}
