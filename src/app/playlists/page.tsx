import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDb, MediaItem, PlaylistWithCount } from "@/lib/db";
import { getMediaType } from "@/lib/media";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import PlaylistCard from "@/components/PlaylistCard";
import NewPlaylistForm from "./NewPlaylistForm";

export const dynamic = "force-dynamic";

export default async function PlaylistsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = parseInt((session.user as { id?: string }).id || "0");

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

  // Hämta första mediaitem per playlist (lägsta position)
  type FirstItem = MediaItem & { playlist_id: number };
  const firstItems = db
    .prepare(
      `SELECT m.*, pi.playlist_id
       FROM playlist_items pi
       JOIN media m ON m.id = pi.media_id
       WHERE pi.id IN (
         SELECT MIN(id) FROM playlist_items
         WHERE playlist_id IN (
           SELECT id FROM playlists WHERE user_id = ?
         )
         GROUP BY playlist_id
       )`
    )
    .all(userId) as FirstItem[];

  const firstByPlaylist: Record<number, { thumbnailUrl?: string; previewUrl?: string }> = {};
  for (const item of firstItems) {
    const type = getMediaType(item);
    const previewUrl =
      type === "local" ? `/api/stream/${item.id}` :
      type === "direct" ? (item.url ?? undefined) :
      undefined;
    firstByPlaylist[item.playlist_id] = {
      thumbnailUrl: item.thumbnail_url ?? undefined,
      previewUrl,
    };
  }

  return (
    <div className="min-h-screen bg-yt-bg">
      <Header />
      <Sidebar />
      <main className="pt-14 pb-14 lg:pl-56 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-yt-text">Mina playlists</h1>
            <NewPlaylistForm />
          </div>

          {playlists.length === 0 ? (
            <div className="text-center py-16 text-yt-muted">
              <p className="text-4xl mb-4">&#9654;</p>
              <p className="text-lg font-medium">Inga playlists</p>
              <p className="text-sm mt-1">Skapa din första playlist via knappen Spara i playlist på en video.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {playlists.map((pl) => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  thumbnailUrl={firstByPlaylist[pl.id]?.thumbnailUrl}
                  previewUrl={firstByPlaylist[pl.id]?.previewUrl}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
