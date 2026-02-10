import { NextRequest } from "next/server";
import db from "@/lib/db";

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
