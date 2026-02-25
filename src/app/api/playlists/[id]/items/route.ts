import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, Playlist } from "@/lib/db";

// PUT — reorder playlist items; body: { order: number[] } (array of playlist_item_ids)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt((session.user as { id?: string }).id || "0");
  const playlistId = parseInt(params.id);

  const db = getDb();
  const playlist = db.prepare("SELECT * FROM playlists WHERE id = ?").get(playlistId) as Playlist | undefined;

  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (playlist.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { order } = await req.json();
  if (!Array.isArray(order)) return NextResponse.json({ error: "order must be an array" }, { status: 400 });

  const updateStmt = db.prepare("UPDATE playlist_items SET position = ? WHERE id = ? AND playlist_id = ?");
  const reorder = db.transaction((ids: number[]) => {
    ids.forEach((itemId, index) => updateStmt.run(index, itemId, playlistId));
  });
  reorder(order as number[]);

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt((session.user as { id?: string }).id || "0");
  const playlistId = parseInt(params.id);

  const db = getDb();
  const playlist = db.prepare("SELECT * FROM playlists WHERE id = ?").get(playlistId) as Playlist | undefined;

  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (playlist.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { media_id } = await req.json();
  if (!media_id || typeof media_id !== "number") {
    return NextResponse.json({ error: "media_id is required" }, { status: 400 });
  }

  db.prepare(
    `INSERT OR IGNORE INTO playlist_items (playlist_id, media_id, position)
     VALUES (?, ?, (SELECT COALESCE(MAX(position)+1, 0) FROM playlist_items WHERE playlist_id = ?))`
  ).run(playlistId, media_id, playlistId);

  return NextResponse.json({ ok: true }, { status: 201 });
}
