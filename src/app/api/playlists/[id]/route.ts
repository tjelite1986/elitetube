import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, Playlist, PlaylistItemWithMedia } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt((session.user as { id?: string }).id || "0");
  const playlistId = parseInt(params.id);

  const db = getDb();
  const playlist = db.prepare("SELECT * FROM playlists WHERE id = ?").get(playlistId) as Playlist | undefined;

  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (playlist.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = db
    .prepare(
      `SELECT m.*, pi.id as playlist_item_id, pi.position
       FROM playlist_items pi
       JOIN media m ON m.id = pi.media_id
       WHERE pi.playlist_id = ?
       ORDER BY pi.position ASC`
    )
    .all(playlistId) as PlaylistItemWithMedia[];

  return NextResponse.json({ playlist, items });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt((session.user as { id?: string }).id || "0");
  const playlistId = parseInt(params.id);

  const db = getDb();
  const playlist = db.prepare("SELECT * FROM playlists WHERE id = ?").get(playlistId) as Playlist | undefined;

  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (playlist.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  db.prepare("UPDATE playlists SET name = ?, description = ? WHERE id = ?").run(
    name.trim(),
    description?.trim() || null,
    playlistId
  );

  const updated = db.prepare("SELECT * FROM playlists WHERE id = ?").get(playlistId);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt((session.user as { id?: string }).id || "0");
  const playlistId = parseInt(params.id);

  const db = getDb();
  const result = db
    .prepare("DELETE FROM playlists WHERE id = ? AND user_id = ?")
    .run(playlistId, userId);

  if (result.changes === 0) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
