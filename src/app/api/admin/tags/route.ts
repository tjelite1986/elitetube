import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function requireAdmin(session: any) {
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string } | undefined)?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

// GET — lista alla unika taggar i adult-media med räknare
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const db = getDb();
  const rows = db
    .prepare("SELECT tags FROM media WHERE is_adult = 1 AND tags IS NOT NULL AND tags != ''")
    .all() as { tags: string }[];

  const counts: Record<string, number> = {};
  for (const { tags } of rows) {
    for (const tag of tags.split(",").map((t) => t.trim()).filter(Boolean)) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }

  const result = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return NextResponse.json(result);
}

// PUT — byt namn på en tagg i alla adult-media
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const { oldName, newName } = (await req.json()) as { oldName: string; newName: string };
  if (!oldName?.trim() || !newName?.trim())
    return NextResponse.json({ error: "Ogiltigt namn" }, { status: 400 });

  const db = getDb();
  const rows = db
    .prepare("SELECT id, tags FROM media WHERE is_adult = 1 AND tags IS NOT NULL AND tags LIKE ?")
    .all(`%${oldName}%`) as { id: number; tags: string }[];

  const update = db.prepare("UPDATE media SET tags = ? WHERE id = ?");
  for (const row of rows) {
    const newTags = row.tags
      .split(",")
      .map((t) => t.trim())
      .map((t) => (t === oldName.trim() ? newName.trim() : t))
      .join(", ");
    update.run(newTags, row.id);
  }

  return NextResponse.json({ updated: rows.length });
}

// DELETE — ta bort en tagg från alla adult-media
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const { name } = (await req.json()) as { name: string };
  if (!name?.trim())
    return NextResponse.json({ error: "Inget taggnamn" }, { status: 400 });

  const db = getDb();
  const rows = db
    .prepare("SELECT id, tags FROM media WHERE is_adult = 1 AND tags IS NOT NULL AND tags LIKE ?")
    .all(`%${name}%`) as { id: number; tags: string }[];

  const update = db.prepare("UPDATE media SET tags = ? WHERE id = ?");
  for (const row of rows) {
    const newTags = row.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== name.trim())
      .join(", ");
    update.run(newTags || null, row.id);
  }

  return NextResponse.json({ updated: rows.length });
}
