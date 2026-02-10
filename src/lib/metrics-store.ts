import db from "@/lib/db";
import { HISTORY_MAX_POINTS } from "@/lib/constants";
import type { AgentStatusResponse, MetricsDataPoint } from "@/lib/types";

export function storeSnapshot(
  serverId: string,
  data: AgentStatusResponse
): void {
  const point: MetricsDataPoint = {
    timestamp: data.timestamp,
    system_cpu: data.system?.cpu_percent ?? 0,
    system_memory_used: data.system?.memory_used_mb ?? 0,
    system_memory_total: data.system?.memory_total_mb ?? 0,
    system_net_in: data.system?.net_in_mbps ?? 0,
    system_net_out: data.system?.net_out_mbps ?? 0,
    total_connections: data.connections?.total ?? 0,
    unique_ips: data.connections?.unique_ips ?? 0,
    container_count: data.total_containers,
    total_container_cpu: data.containers.reduce(
      (s, c) => s + c.cpu_percent,
      0
    ),
    total_container_memory: data.containers.reduce(
      (s, c) => s + c.memory_mb,
      0
    ),
    clients_by_country: data.clients_by_country ?? [],
  };

  db.prepare(
    `INSERT INTO metrics_history (server_id, timestamp, data_json)
     VALUES (?, ?, ?)`
  ).run(serverId, data.timestamp, JSON.stringify(point));
}

export function getHistory(
  serverId: string,
  rangeSeconds: number
): MetricsDataPoint[] {
  const rows = (rangeSeconds > 0
    ? db.prepare(
        `SELECT data_json FROM metrics_history
         WHERE server_id = ? AND timestamp >= ?
         ORDER BY timestamp ASC`
      ).all(serverId, Math.floor(Date.now() / 1000) - rangeSeconds)
    : db.prepare(
        `SELECT data_json FROM metrics_history
         WHERE server_id = ?
         ORDER BY timestamp ASC`
      ).all(serverId)
  ) as { data_json: string }[];

  const points = rows.map((r) => JSON.parse(r.data_json) as MetricsDataPoint);
  return downsample(points, HISTORY_MAX_POINTS);
}

export function cleanup(retentionHours: number): void {
  const cutoff = Math.floor(Date.now() / 1000) - retentionHours * 3600;
  db.prepare("DELETE FROM metrics_history WHERE timestamp < ?").run(cutoff);
}

function downsample<T>(data: T[], maxPoints: number): T[] {
  if (data.length <= maxPoints) return data;
  const step = data.length / maxPoints;
  const result: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(data[Math.floor(i * step)]);
  }
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }
  return result;
}
