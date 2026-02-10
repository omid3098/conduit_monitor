import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getHistory } from "@/lib/metrics-store";

export const dynamic = "force-dynamic";

const RANGE_MAP: Record<string, number> = {
  "1h": 3600,
  "6h": 21600,
  "24h": 86400,
  "30d": 2592000,
  "all": 0,
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

  const range = request.nextUrl.searchParams.get("range") || "1h";
  const rangeSeconds = RANGE_MAP[range] ?? RANGE_MAP["1h"];

  const history = getHistory(id, rangeSeconds);

  return Response.json({
    server_id: id,
    range,
    data_points: history.length,
    history,
  });
}
