import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDb, Playlist, PlaylistItemWithMedia } from "@/lib/db";
import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer";
import PlaylistSidebar from "@/components/PlaylistSidebar";
import AutoNextController from "@/components/AutoNextController";
import { getMediaType } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function PlaylistDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { index?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = parseInt((session.user as { id?: string }).id || "0");
  const playlistId = parseInt(params.id);
  const currentIndex = Math.max(0, parseInt(searchParams.index || "0") || 0);

  const db = getDb();
  const playlist = db
    .prepare("SELECT * FROM playlists WHERE id = ?")
    .get(playlistId) as Playlist | undefined;

  if (!playlist) notFound();
  if (playlist.user_id !== userId) redirect("/playlists");

  const items = db
    .prepare(
      `SELECT m.*, pi.id as playlist_item_id, pi.position
       FROM playlist_items pi
       JOIN media m ON m.id = pi.media_id
       WHERE pi.playlist_id = ?
       ORDER BY pi.position ASC`
    )
    .all(playlistId) as PlaylistItemWithMedia[];

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-yt-bg">
        <Header />
        <main className="pt-14">
          <div className="max-w-4xl mx-auto px-4 py-12 text-center text-yt-muted">
            <p className="text-2xl mb-2">Playlist is empty</p>
            <p className="text-sm">Add videos using the &quot;Save to playlist&quot; button on a video.</p>
          </div>
        </main>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, items.length - 1);
  const currentItem = items[safeIndex];
  const nextItem = items[safeIndex + 1] || null;
  const nextUrl = nextItem
    ? `/playlists/${playlistId}?index=${safeIndex + 1}`
    : null;

  const mediaType = getMediaType(currentItem);

  return (
    <div className="min-h-screen bg-yt-bg">
      <Header />
      <main className="pt-14">
        <div className="max-w-screen-2xl mx-auto px-4 py-6 flex flex-col xl:flex-row gap-6">
          {/* Left — player + info */}
          <div className="flex-1 min-w-0">
            <VideoPlayer item={currentItem} />

            <div className="mt-4">
              <p className="text-xs text-yt-muted mb-1">
                {playlist.name} · {safeIndex + 1}/{items.length}
              </p>
              <h1 className="text-xl font-bold text-yt-text leading-snug">{currentItem.title}</h1>
              {currentItem.description && (
                <div className="mt-4 bg-yt-surface rounded-xl p-4 text-sm text-yt-muted whitespace-pre-wrap">
                  {currentItem.description}
                </div>
              )}
            </div>
          </div>

          {/* Right — playlist sidebar */}
          <aside className="xl:w-80 shrink-0">
            <div className="bg-yt-surface rounded-xl p-3 border border-yt-border">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-sm font-semibold text-yt-text">{playlist.name}</p>
                <p className="text-xs text-yt-muted">{items.length} videos</p>
              </div>
              <PlaylistSidebar
                items={items}
                currentItemId={currentItem.playlist_item_id}
                playlistId={playlistId}
              />
            </div>
          </aside>
        </div>
      </main>

      <AutoNextController nextUrl={nextUrl} mediaType={mediaType} />
    </div>
  );
}
