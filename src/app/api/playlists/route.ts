import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, PlaylistWithCount } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt((session.user as { id?: string }).id || "0");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const playlists = db
    .prepare(
      `SELECT p.*, COUNT(pi.id) as item_count
       FROM playlists p
       LEFT JOIN playlist_items pi ON pi.playlist_id = p.id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    )
    .all(userId) as PlaylistWithCount[];

  return NextResponse.json(playlists);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt((session.user as { id?: string }).id || "0");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare("INSERT INTO playlists (user_id, name, description) VALUES (?, ?, ?)")
    .run(userId, name.trim(), description?.trim() || null);

  const playlist = db.prepare("SELECT * FROM playlists WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(playlist, { status: 201 });
}
