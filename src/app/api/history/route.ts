import { NextRequest } from "next/server";
import db from "@/lib/db";
import { HISTORY_MAX_POINTS } from "@/lib/constants";
import type { MetricsDataPoint, AgentCountryClients } from "@/lib/types";

export const dynamic = "force-dynamic";

const RANGE_MAP: Record<string, number> = {
  "1h": 3600,
  "6h": 21600,
  "24h": 86400,
  "30d": 2592000,
  "all": 0,
};

function bucketSizeForRange(rangeSeconds: number): number {
  if (rangeSeconds === 0) return 900;     // all-time: 15 min buckets
  if (rangeSeconds > 86400) return 300;   // >24h: 5 min buckets
  return 30;                              // ≤24h: 30s buckets
}

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") || "1h";
  const rangeSeconds = RANGE_MAP[range] ?? RANGE_MAP["1h"];
  const since = rangeSeconds > 0
    ? Math.floor(Date.now() / 1000) - rangeSeconds
    : 0;

  // Include server_id so we can de-duplicate per server within each bucket
  const rows = (since > 0
    ? db.prepare(
        `SELECT server_id, data_json FROM metrics_history
         WHERE timestamp >= ?
         ORDER BY timestamp ASC`
      ).all(since)
    : db.prepare(
        `SELECT server_id, data_json FROM metrics_history
         ORDER BY timestamp ASC`
      ).all()
  ) as { server_id: string; data_json: string }[];

  const bucketSize = bucketSizeForRange(rangeSeconds);

  // Phase 1: Group by (bucket, server_id)
  // Each server may have multiple snapshots in one bucket (e.g. 15s poll, 30s bucket).
  // We must average per-server first, then aggregate across servers.
  const serverBuckets = new Map<number, Map<string, MetricsDataPoint[]>>();

  for (const row of rows) {
    const point = JSON.parse(row.data_json) as MetricsDataPoint;
    const bucketKey = Math.floor(point.timestamp / bucketSize) * bucketSize;

    let byServer = serverBuckets.get(bucketKey);
    if (!byServer) {
      byServer = new Map();
      serverBuckets.set(bucketKey, byServer);
    }

    const arr = byServer.get(row.server_id);
    if (arr) arr.push(point);
    else byServer.set(row.server_id, [point]);
  }

  // Phase 2: For each bucket, average each server's snapshots, then aggregate across servers
  const aggregated: MetricsDataPoint[] = [];

  for (const [bucketTs, byServer] of serverBuckets) {
    // Collapse each server's multiple snapshots into one averaged point
    const perServerAveraged: MetricsDataPoint[] = [];

    for (const [, serverPoints] of byServer) {
      const n = serverPoints.length;

      // Average country connections across the server's snapshots
      const countryMap = new Map<string, number>();
      for (const p of serverPoints) {
        for (const c of p.clients_by_country ?? []) {
          countryMap.set(c.country, (countryMap.get(c.country) ?? 0) + c.connections);
        }
      }
      const avgCountries: AgentCountryClients[] = Array.from(countryMap.entries())
        .map(([country, total]) => ({ country, connections: Math.round(total / n) }))
        .sort((a, b) => b.connections - a.connections);

      perServerAveraged.push({
        timestamp: bucketTs,
        system_cpu: serverPoints.reduce((s, p) => s + p.system_cpu, 0) / n,
        system_memory_used: serverPoints.reduce((s, p) => s + p.system_memory_used, 0) / n,
        system_memory_total: serverPoints.reduce((s, p) => s + p.system_memory_total, 0) / n,
        system_net_in: serverPoints.reduce((s, p) => s + p.system_net_in, 0) / n,
        system_net_out: serverPoints.reduce((s, p) => s + p.system_net_out, 0) / n,
        total_connections: serverPoints.reduce((s, p) => s + p.total_connections, 0) / n,
        unique_ips: serverPoints.reduce((s, p) => s + p.unique_ips, 0) / n,
        container_count: serverPoints.reduce((s, p) => s + p.container_count, 0) / n,
        total_container_cpu: serverPoints.reduce((s, p) => s + p.total_container_cpu, 0) / n,
        total_container_memory: serverPoints.reduce((s, p) => s + p.total_container_memory, 0) / n,
        clients_by_country: avgCountries,
      });
    }

    // Aggregate across servers: SUM for additive metrics, AVG for cpu%
    const numServers = perServerAveraged.length;

    const countryMap = new Map<string, number>();
    for (const p of perServerAveraged) {
      for (const c of p.clients_by_country) {
        countryMap.set(c.country, (countryMap.get(c.country) ?? 0) + c.connections);
      }
    }
    const mergedCountries: AgentCountryClients[] = Array.from(
      countryMap.entries()
    )
      .map(([country, connections]) => ({ country, connections }))
      .sort((a, b) => b.connections - a.connections);

    aggregated.push({
      timestamp: bucketTs,
      system_cpu: perServerAveraged.reduce((s, p) => s + p.system_cpu, 0) / numServers,
      system_memory_used: perServerAveraged.reduce((s, p) => s + p.system_memory_used, 0),
      system_memory_total: perServerAveraged.reduce((s, p) => s + p.system_memory_total, 0),
      system_net_in: perServerAveraged.reduce((s, p) => s + p.system_net_in, 0),
      system_net_out: perServerAveraged.reduce((s, p) => s + p.system_net_out, 0),
      total_connections: perServerAveraged.reduce((s, p) => s + p.total_connections, 0),
      unique_ips: perServerAveraged.reduce((s, p) => s + p.unique_ips, 0),
      container_count: perServerAveraged.reduce((s, p) => s + p.container_count, 0),
      total_container_cpu: perServerAveraged.reduce((s, p) => s + p.total_container_cpu, 0),
      total_container_memory: perServerAveraged.reduce(
        (s, p) => s + p.total_container_memory,
        0
      ),
      clients_by_country: mergedCountries,
    });
  }

  // Downsample
  const history = downsample(aggregated, HISTORY_MAX_POINTS);

  return Response.json({
    range,
    data_points: history.length,
    history,
  });
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
