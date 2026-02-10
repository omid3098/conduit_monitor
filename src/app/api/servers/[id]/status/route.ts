import { NextRequest } from "next/server";
import db from "@/lib/db";
import { AGENT_TIMEOUT_MS, STALE_THRESHOLD_S, METRICS_RETENTION_HOURS } from "@/lib/constants";
import { storeSnapshot, cleanup } from "@/lib/metrics-store";
import type { ServerRow, AgentStatusResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const server = db
    .prepare("SELECT * FROM servers WHERE id = ?")
    .get(id) as ServerRow | undefined;

  if (!server) {
    return Response.json({ error: "Server not found" }, { status: 404 });
  }

  const agentUrl = `http://${server.host}:${server.port}/status`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);

    const agentResponse = await fetch(agentUrl, {
      headers: { "X-Conduit-Auth": server.secret },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (agentResponse.status === 401) {
      return Response.json({ error: "auth_failed" }, { status: 401 });
    }

    if (agentResponse.status === 503) {
      return Response.json({ error: "starting_up" }, { status: 503 });
    }

    if (!agentResponse.ok) {
      return Response.json(
        { error: "agent_error", agentStatus: agentResponse.status },
        { status: 502 }
      );
    }

    const data = (await agentResponse.json()) as AgentStatusResponse;

    if (data.server_id && data.server_id !== server.server_id) {
      db.prepare("UPDATE servers SET server_id = ? WHERE id = ?").run(
        data.server_id,
        id
      );
    }

    // Store metrics snapshot for history
    try {
      storeSnapshot(id, data);
    } catch {
      // Don't fail the request if storage fails
    }

    // Probabilistic cleanup (~5% of requests)
    if (Math.random() < 0.05) {
      try {
        cleanup(METRICS_RETENTION_HOURS);
      } catch {
        // Ignore cleanup errors
      }
    }

    const nowEpoch = Math.floor(Date.now() / 1000);
    const stale = nowEpoch - data.timestamp > STALE_THRESHOLD_S;

    return Response.json({ ...data, stale });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json({ error: "timeout" }, { status: 504 });
    }
    return Response.json({ error: "offline" }, { status: 502 });
  }
}
