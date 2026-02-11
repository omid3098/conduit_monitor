import { NextRequest } from "next/server";
import db from "@/lib/db";
import { AGENT_TIMEOUT_MS, STALE_THRESHOLD_S, METRICS_RETENTION_HOURS } from "@/lib/constants";
import { storeSnapshot, cleanup } from "@/lib/metrics-store";
import { initializeState, recordStatusResult } from "@/lib/uptime-store";
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

  initializeState(id);

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
      recordStatusResult(id, false);
      return Response.json(
        { error: "auth_failed", last_seen_at: server.last_seen_at, first_seen_at: server.first_seen_at },
        { status: 401 }
      );
    }

    if (agentResponse.status === 503) {
      recordStatusResult(id, false);
      return Response.json(
        { error: "starting_up", last_seen_at: server.last_seen_at, first_seen_at: server.first_seen_at },
        { status: 503 }
      );
    }

    if (!agentResponse.ok) {
      recordStatusResult(id, false);
      return Response.json(
        { error: "agent_error", agentStatus: agentResponse.status, last_seen_at: server.last_seen_at, first_seen_at: server.first_seen_at },
        { status: 502 }
      );
    }

    const data = (await agentResponse.json()) as AgentStatusResponse;

    recordStatusResult(id, true);

    // Update server_id and last_seen_at/first_seen_at on successful fetch
    const now = new Date().toISOString();
    if (data.server_id && data.server_id !== server.server_id) {
      db.prepare(
        "UPDATE servers SET server_id = ?, last_seen_at = ?, first_seen_at = COALESCE(first_seen_at, ?) WHERE id = ?"
      ).run(data.server_id, now, now, id);
    } else {
      db.prepare(
        "UPDATE servers SET last_seen_at = ?, first_seen_at = COALESCE(first_seen_at, ?) WHERE id = ?"
      ).run(now, now, id);
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
    recordStatusResult(id, false);
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        { error: "timeout", last_seen_at: server.last_seen_at, first_seen_at: server.first_seen_at },
        { status: 504 }
      );
    }
    return Response.json(
      { error: "offline", last_seen_at: server.last_seen_at, first_seen_at: server.first_seen_at },
      { status: 502 }
    );
  }
}
