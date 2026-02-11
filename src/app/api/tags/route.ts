import db from "@/lib/db";

export async function GET() {
  const rows = db
    .prepare("SELECT DISTINCT tag FROM server_tags ORDER BY tag")
    .all() as { tag: string }[];

  return Response.json(rows.map((r) => r.tag));
}
