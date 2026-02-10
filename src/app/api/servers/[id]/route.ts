import { NextRequest } from "next/server";
import db from "@/lib/db";
import type { ServerRow } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const server = db
    .prepare("SELECT id, label, server_id, created_at FROM servers WHERE id = ?")
    .get(id) as Pick<ServerRow, "id" | "label" | "server_id" | "created_at"> | undefined;

  if (!server) {
    return Response.json({ error: "Server not found" }, { status: 404 });
  }

  return Response.json(server);
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
