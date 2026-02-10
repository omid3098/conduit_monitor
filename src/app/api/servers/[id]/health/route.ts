import { NextRequest } from "next/server";
import db from "@/lib/db";
import { HEALTH_TIMEOUT_MS } from "@/lib/constants";
import type { ServerRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const server = db
    .prepare("SELECT host, port FROM servers WHERE id = ?")
    .get(id) as Pick<ServerRow, "host" | "port"> | undefined;

  if (!server) {
    return Response.json({ error: "Server not found" }, { status: 404 });
  }

  const agentUrl = `http://${server.host}:${server.port}/health`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    const agentResponse = await fetch(agentUrl, {
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!agentResponse.ok) {
      return Response.json({ error: "unhealthy" }, { status: 502 });
    }

    const data = await agentResponse.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "offline" }, { status: 502 });
  }
}
