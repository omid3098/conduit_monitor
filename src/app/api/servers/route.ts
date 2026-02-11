import { NextRequest } from "next/server";
import db from "@/lib/db";
import { parseConduitUri } from "@/lib/conduit-uri";
import type { ServerRow, ServerSafe } from "@/lib/types";

export async function GET() {
  const rows = db
    .prepare("SELECT id, label, server_id, created_at, last_seen_at, first_seen_at FROM servers ORDER BY created_at DESC")
    .all() as Pick<ServerRow, "id" | "label" | "server_id" | "created_at" | "last_seen_at" | "first_seen_at">[];

  // Fetch all tags in one query
  const tagRows = db
    .prepare("SELECT server_id, tag FROM server_tags")
    .all() as { server_id: string; tag: string }[];

  const tagMap = new Map<string, string[]>();
  for (const row of tagRows) {
    const arr = tagMap.get(row.server_id) ?? [];
    arr.push(row.tag);
    tagMap.set(row.server_id, arr);
  }

  const servers: ServerSafe[] = rows.map((row) => ({
    id: row.id,
    label: row.label,
    server_id: row.server_id,
    created_at: row.created_at,
    last_seen_at: row.last_seen_at,
    first_seen_at: row.first_seen_at,
    tags: tagMap.get(row.id) ?? [],
  }));

  return Response.json(servers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const uri: string = body.uri;
  const label: string | undefined = body.label;
  const tags: string[] = Array.isArray(body.tags) ? body.tags : [];

  let parsed;
  try {
    parsed = parseConduitUri(uri);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid URI" },
      { status: 400 }
    );
  }

  const existing = db
    .prepare("SELECT id FROM servers WHERE host = ? AND port = ?")
    .get(parsed.host, parsed.port);

  if (existing) {
    return Response.json(
      { error: "A server with this host and port already exists" },
      { status: 409 }
    );
  }

  const id = crypto.randomUUID();

  db.prepare(
    "INSERT INTO servers (id, host, port, secret, label) VALUES (?, ?, ?, ?, ?)"
  ).run(id, parsed.host, parsed.port, parsed.secret, label || null);

  // Insert tags
  const insertTag = db.prepare(
    "INSERT INTO server_tags (server_id, tag) VALUES (?, ?)"
  );
  const cleanTags: string[] = [];
  for (const tag of tags) {
    const clean = tag.trim().toLowerCase();
    if (clean) {
      insertTag.run(id, clean);
      cleanTags.push(clean);
    }
  }

  const server: ServerSafe = {
    id,
    label: label || null,
    server_id: null,
    created_at: new Date().toISOString(),
    last_seen_at: null,
    first_seen_at: null,
    tags: cleanTags,
  };

  return Response.json(server, { status: 201 });
}
