"use client";

import { StatPanel } from "@/components/charts/stat-panel";
import {
  formatCompact,
  formatMbps,
  formatCpu,
  formatPercent,
  formatMemory,
  formatBytes,
} from "@/lib/format";
import type { ServerStatusResult, MetricsDataPoint } from "@/lib/types";

interface StatRowProps {
  data: ServerStatusResult;
  sparklineData?: MetricsDataPoint[];
}

export function StatRow({ data, sparklineData }: StatRowProps) {
  const connSpark = sparklineData?.map((p) => p.total_connections);
  const netSpark = sparklineData?.map(
    (p) => p.system_net_in + p.system_net_out
  );
  const cpuSpark = sparklineData?.map((p) => p.system_cpu);
  const ramSpark = sparklineData?.map((p) =>
    p.system_memory_total > 0
      ? (p.system_memory_used / p.system_memory_total) * 100
      : 0
  );
  const diskSpark = sparklineData?.map((p) =>
    data.system?.disk_total_gb
      ? (p.system_memory_used / p.system_memory_total) * 100
      : 0
  );

  const totalClients = (data.connected_clients ?? 0) + (data.connecting_clients ?? 0);
  const netIn = data.system?.net_in_mbps ?? 0;
  const netOut = data.system?.net_out_mbps ?? 0;
  const cpuPct = data.system?.cpu_percent ?? 0;
  const memUsed = data.system?.memory_used_mb ?? 0;
  const memTotal = data.system?.memory_total_mb ?? 1;
  const sessionUp = data.session?.total_upload_bytes ?? 0;
  const sessionDown = data.session?.total_download_bytes ?? 0;
  const diskUsed = data.system?.disk_used_gb ?? 0;
  const diskTotal = data.system?.disk_total_gb ?? 1;

  const memPct = (memUsed / memTotal) * 100;
  const diskPct = (diskUsed / diskTotal) * 100;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatPanel
        label="Clients"
        value={formatCompact(totalClients)}
        subtitle={`${data.connected_clients ?? 0} connected, ${data.connecting_clients ?? 0} connecting`}
        sparklineData={connSpark}
        color="var(--color-chart-1)"
      />
      <StatPanel
        label="Traffic"
        value={formatMbps(netIn + netOut)}
        subtitle={`In ${formatMbps(netIn)} / Out ${formatMbps(netOut)}`}
        sparklineData={netSpark}
        color="var(--color-chart-2)"
      />
      <StatPanel
        label="Session"
        value={formatBytes(sessionUp + sessionDown)}
        subtitle={`↑${formatBytes(sessionUp)} / ↓${formatBytes(sessionDown)}`}
        color="var(--color-chart-2)"
      />
      <StatPanel
        label="Host CPU"
        value={formatCpu(cpuPct)}
        sparklineData={cpuSpark}
        color="var(--color-chart-3)"
        thresholdColor={cpuPct > 80 ? "hsl(0, 84%, 60%)" : undefined}
      />
      <StatPanel
        label="Host RAM"
        value={formatPercent(memUsed, memTotal)}
        subtitle={`${formatMemory(memUsed)} / ${formatMemory(memTotal)}`}
        sparklineData={ramSpark}
        color="var(--color-chart-4)"
        thresholdColor={memPct > 85 ? "hsl(0, 84%, 60%)" : undefined}
      />
      <StatPanel
        label="Disk"
        value={`${diskPct.toFixed(1)}%`}
        subtitle={`${diskUsed.toFixed(1)} / ${diskTotal.toFixed(1)} GB`}
        sparklineData={diskSpark}
        color="var(--color-chart-5)"
        thresholdColor={diskPct > 90 ? "hsl(0, 84%, 60%)" : undefined}
      />
    </div>
  );
}
