import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, Playlist } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt((session.user as { id?: string }).id || "0");
  const playlistId = parseInt(params.id);
  const itemId = parseInt(params.itemId);

  const db = getDb();
  const playlist = db.prepare("SELECT * FROM playlists WHERE id = ?").get(playlistId) as Playlist | undefined;

  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (playlist.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = db
    .prepare("DELETE FROM playlist_items WHERE id = ? AND playlist_id = ?")
    .run(itemId, playlistId);

  if (result.changes === 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
