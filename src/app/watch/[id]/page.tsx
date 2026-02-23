import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { getDb, MediaItem, PlaylistItemWithMedia } from "@/lib/db";
import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer";
import AddToPlaylistButton from "@/components/AddToPlaylistButton";
import LikeButtons from "@/components/LikeButtons";
import RelatedCard from "@/components/RelatedCard";
import AutoNextController from "@/components/AutoNextController";
import AdultPinGate from "@/components/AdultPinGate";
import { formatDuration, formatViews, getMediaType } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { playlist?: string; index?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const db = getDb();
  const item = db.prepare("SELECT * FROM media WHERE id = ?").get(parseInt(params.id)) as MediaItem | undefined;
  if (!item) notFound();

  // Öka visningarna
  db.prepare("UPDATE media SET views = views + 1 WHERE id = ?").run(parseInt(params.id));
  item.views += 1;

  // Playlist-kontext
  const playlistId = searchParams.playlist ? parseInt(searchParams.playlist) : null;
  const currentIndex = searchParams.index ? parseInt(searchParams.index) : null;
  let playlistItems: PlaylistItemWithMedia[] = [];
  let nextUrl: string | null = null;

  if (playlistId && currentIndex !== null) {
    playlistItems = db
      .prepare(
        `SELECT m.*, pi.id as playlist_item_id, pi.position
         FROM playlist_items pi
         JOIN media m ON m.id = pi.media_id
         WHERE pi.playlist_id = ?
         ORDER BY pi.position ASC`
      )
      .all(playlistId) as PlaylistItemWithMedia[];

    const nextItem = playlistItems[currentIndex + 1] || null;
    if (nextItem) {
      nextUrl = `/watch/${nextItem.id}?playlist=${playlistId}&index=${currentIndex + 1}`;
    }
  }

  // Kontrollera adult-lås
  const cookieStore = cookies();
  const adultUnlocked = cookieStore.get("adult_unlocked")?.value === "1";
  const isAdultLocked = item.is_adult === 1 && !adultUnlocked;

  const mediaType = getMediaType(item);

  // Relaterade — matchar kategori + adult-status, sorterade efter visningar
  const related = db
    .prepare(
      `SELECT * FROM media
       WHERE id != ? AND is_adult = ?
       ORDER BY
         CASE WHEN category IS NOT NULL AND category = ? THEN 0 ELSE 1 END,
         views DESC
       LIMIT 12`
    )
    .all(item.id, item.is_adult ?? 0, item.category ?? "") as MediaItem[];

  const source = item.source_id
    ? (db.prepare("SELECT name FROM sources WHERE id = ?").get(item.source_id) as { name: string } | undefined)
    : undefined;

  return (
    <div className="min-h-screen bg-yt-bg">
      <Header />
      <main className="pt-14">
        <div className="max-w-screen-2xl mx-auto px-4 py-6 flex flex-col xl:flex-row gap-6">
          {/* Vänster — spelare + info */}
          <div className="flex-1 min-w-0">
            {isAdultLocked ? (
              <AdultPinGate />
            ) : (
              <VideoPlayer item={item} />
            )}

            <div className="mt-4">
              <h1 className="text-xl font-bold text-yt-text leading-snug">{item.title}</h1>

              {/* Statistik-rad */}
              <div className="flex items-center gap-3 mt-2 text-sm text-yt-muted flex-wrap">
                {item.category && (
                  <a
                    href={item.is_adult ? `/adult` : `/?category=${encodeURIComponent(item.category)}`}
                    className="bg-yt-surface px-2 py-0.5 rounded text-xs hover:bg-yt-hover transition-colors"
                  >
                    {item.category}
                  </a>
                )}
                <span>{formatViews(item.views)}</span>
                {item.duration && <span>{formatDuration(item.duration)}</span>}
                {source && (
                  <span className="text-xs border border-yt-border rounded px-2 py-0.5">
                    {source.name}
                  </span>
                )}
              </div>

              {/* Like-knappar + playlist */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <LikeButtons
                  mediaId={item.id}
                  initialLikes={item.likes ?? 0}
                  initialDislikes={item.dislikes ?? 0}
                />
                <AddToPlaylistButton mediaId={item.id} />
              </div>

              {/* Taggar */}
              {item.tags && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                    <a
                      key={tag}
                      href={item.is_adult ? `/adult/search?q=${encodeURIComponent(tag)}` : `/search?q=${encodeURIComponent(tag)}`}
                      className="px-2 py-0.5 rounded-full bg-yt-surface text-xs text-yt-muted hover:text-yt-text hover:bg-yt-hover transition-colors"
                    >
                      #{tag}
                    </a>
                  ))}
                </div>
              )}

              {item.description && (
                <div className="mt-4 bg-yt-surface rounded-xl p-4 text-sm text-yt-muted whitespace-pre-wrap">
                  {item.description}
                </div>
              )}
            </div>
          </div>

          {/* Höger — relaterade */}
          {related.length > 0 && (
            <aside className="xl:w-96 shrink-0">
              <p className="text-sm font-medium text-yt-muted mb-4">Relaterade</p>
              <div className="flex flex-col gap-3">
                {related.slice(0, 10).map((r) => (
                  <RelatedCard key={r.id} item={r} />
                ))}
              </div>
            </aside>
          )}

        </div>
      </main>

      {nextUrl && !isAdultLocked && <AutoNextController nextUrl={nextUrl} mediaType={mediaType} />}
    </div>
  );
}

