import { NextRequest } from "next/server";
import db from "@/lib/db";
import type { ServerRow, ServerSafe } from "@/lib/types";

function getServerTags(serverId: string): string[] {
  const rows = db
    .prepare("SELECT tag FROM server_tags WHERE server_id = ? ORDER BY tag")
    .all(serverId) as { tag: string }[];
  return rows.map((r) => r.tag);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const server = db
    .prepare("SELECT id, label, server_id, created_at, last_seen_at, first_seen_at FROM servers WHERE id = ?")
    .get(id) as Pick<ServerRow, "id" | "label" | "server_id" | "created_at" | "last_seen_at" | "first_seen_at"> | undefined;

  if (!server) {
    return Response.json({ error: "Server not found" }, { status: 404 });
  }

  const result: ServerSafe = { ...server, tags: getServerTags(id) };
  return Response.json(result);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Update label if provided
  if (typeof body.label === "string" || body.label === null) {
    const label = typeof body.label === "string" ? body.label.trim() : null;
    const result = db
      .prepare("UPDATE servers SET label = ? WHERE id = ?")
      .run(label || null, id);

    if (result.changes === 0) {
      return Response.json({ error: "Server not found" }, { status: 404 });
    }
  }

  // Update tags if provided
  if (Array.isArray(body.tags)) {
    db.prepare("DELETE FROM server_tags WHERE server_id = ?").run(id);
    const insertTag = db.prepare(
      "INSERT INTO server_tags (server_id, tag) VALUES (?, ?)"
    );
    for (const tag of body.tags) {
      const clean = String(tag).trim().toLowerCase();
      if (clean) {
        insertTag.run(id, clean);
      }
    }
  }

  const server = db
    .prepare("SELECT id, label, server_id, created_at, last_seen_at, first_seen_at FROM servers WHERE id = ?")
    .get(id) as Pick<ServerRow, "id" | "label" | "server_id" | "created_at" | "last_seen_at" | "first_seen_at"> | undefined;

  if (!server) {
    return Response.json({ error: "Server not found" }, { status: 404 });
  }

  const result: ServerSafe = { ...server, tags: getServerTags(id) };
  return Response.json(result);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = db.prepare("DELETE FROM servers WHERE id = ?").run(id);

  if (result.changes === 0) {
    return Response.json({ error: "Server not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
