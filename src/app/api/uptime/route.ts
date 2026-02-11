import { NextRequest } from "next/server";
import db from "@/lib/db";
import { computeUptime } from "@/lib/uptime-store";

export const dynamic = "force-dynamic";

const RANGE_MAP: Record<string, number> = {
  "24h": 86400,
  "7d": 604800,
  "30d": 2592000,
};

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") || "24h";
  const rangeSeconds = RANGE_MAP[range] ?? 86400;

  const servers = db
    .prepare("SELECT id FROM servers")
    .all() as { id: string }[];

  if (servers.length === 0) {
    return Response.json({
      range,
      fleet_uptime_percent: 100,
      server_uptimes: [],
    });
  }

  const serverUptimes = servers.map((s) => {
    const result = computeUptime(s.id, rangeSeconds);
    return {
      server_id: s.id,
      uptime_percent: result.uptimePercent,
    };
  });

  const fleetUptime =
    serverUptimes.reduce((sum, s) => sum + s.uptime_percent, 0) /
    serverUptimes.length;

  return Response.json({
    range,
    fleet_uptime_percent: fleetUptime,
    server_uptimes: serverUptimes,
  });
}
