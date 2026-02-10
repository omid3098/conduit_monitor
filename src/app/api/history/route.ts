import { NextRequest } from "next/server";
import db from "@/lib/db";
import { HISTORY_MAX_POINTS } from "@/lib/constants";
import type { MetricsDataPoint, AgentCountryClients } from "@/lib/types";

export const dynamic = "force-dynamic";

const RANGE_MAP: Record<string, number> = {
  "1h": 3600,
  "6h": 21600,
  "24h": 86400,
};

const BUCKET_SIZE = 30; // seconds — aligns slightly offset polling times

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") || "1h";
  const rangeSeconds = RANGE_MAP[range] || RANGE_MAP["1h"];
  const since = Math.floor(Date.now() / 1000) - rangeSeconds;

  const rows = db
    .prepare(
      `SELECT data_json FROM metrics_history
       WHERE timestamp >= ?
       ORDER BY timestamp ASC`
    )
    .all(since) as { data_json: string }[];

  // Group by timestamp bucket
  const buckets = new Map<number, MetricsDataPoint[]>();

  for (const row of rows) {
    const point = JSON.parse(row.data_json) as MetricsDataPoint;
    const key = Math.floor(point.timestamp / BUCKET_SIZE) * BUCKET_SIZE;
    const arr = buckets.get(key);
    if (arr) arr.push(point);
    else buckets.set(key, [point]);
  }

  // Aggregate each bucket: SUM for additive metrics, AVG for cpu%
  const aggregated: MetricsDataPoint[] = [];
  for (const [bucketTs, points] of buckets) {
    const n = points.length;

    const countryMap = new Map<string, number>();
    for (const p of points) {
      for (const c of p.clients_by_country ?? []) {
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
      system_cpu: points.reduce((s, p) => s + p.system_cpu, 0) / n,
      system_memory_used: points.reduce((s, p) => s + p.system_memory_used, 0),
      system_memory_total: points.reduce((s, p) => s + p.system_memory_total, 0),
      system_net_in: points.reduce((s, p) => s + p.system_net_in, 0),
      system_net_out: points.reduce((s, p) => s + p.system_net_out, 0),
      total_connections: points.reduce((s, p) => s + p.total_connections, 0),
      unique_ips: points.reduce((s, p) => s + p.unique_ips, 0),
      container_count: points.reduce((s, p) => s + p.container_count, 0),
      total_container_cpu: points.reduce((s, p) => s + p.total_container_cpu, 0),
      total_container_memory: points.reduce(
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
