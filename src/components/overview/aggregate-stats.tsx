"use client";

import type { ServerStatusResult, ServerConnectionState } from "@/lib/types";
import { formatMbps, formatCpu } from "@/lib/format";

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

  const totalClients = online.reduce(
    (s, d) => s + (d.data?.connections?.total ?? 0),
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

  return (
    <div className="grid grid-cols-4 gap-3">
      <StatCard
        label="Servers"
        value={totalServers.toString()}
        subtitle={`${onlineCount} online${offlineCount > 0 ? ` · ${offlineCount} offline` : ""}`}
      />
      <StatCard label="Total Clients" value={totalClients.toString()} />
      <StatCard
        label="Aggregate Traffic"
        value={`↑${formatMbps(totalNetOut)}`}
        subtitle={`↓${formatMbps(totalNetIn)}`}
      />
      <StatCard label="Avg Host CPU" value={formatCpu(avgCpu)} />
    </div>
  );
}
