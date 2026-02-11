import { NextRequest } from "next/server";
import db from "@/lib/db";
import { computeUptime } from "@/lib/uptime-store";

export const dynamic = "force-dynamic";

const RANGE_MAP: Record<string, number> = {
  "24h": 86400,
  "7d": 604800,
  "30d": 2592000,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const server = db
    .prepare("SELECT id FROM servers WHERE id = ?")
    .get(id) as { id: string } | undefined;

  if (!server) {
    return Response.json({ error: "Server not found" }, { status: 404 });
  }

  const range = request.nextUrl.searchParams.get("range") || "24h";
  const rangeSeconds = RANGE_MAP[range] ?? 86400;

  const result = computeUptime(id, rangeSeconds);

  return Response.json({
    server_id: id,
    range,
    uptime_percent: result.uptimePercent,
    downtime_incidents: result.downtimeIncidents,
  });
}
