import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MediaGrid from "@/components/MediaGrid";
import { MediaItem } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; tag?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const db = getDb();
  const q = searchParams.q?.trim() || "";
  const tag = searchParams.tag || "";
  let items: MediaItem[] = [];

  // Hämta alla unika taggar från icke-adult-media
  const tagRows = db
    .prepare("SELECT tags FROM media WHERE is_adult = 0 AND tags IS NOT NULL AND tags != ''")
    .all() as { tags: string }[];
  const tagCounts: Record<string, number> = {};
  for (const { tags } of tagRows) {
    for (const t of tags.split(",").map((x) => x.trim()).filter(Boolean)) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
  }
  const allTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);

  if (q && tag) {
    items = db
      .prepare(
        "SELECT * FROM media WHERE is_adult = 0 AND (title LIKE ? OR description LIKE ? OR category LIKE ?) AND (',' || tags || ',') LIKE ('%,' || ? || ',%') ORDER BY created_at DESC LIMIT 50"
      )
      .all(`%${q}%`, `%${q}%`, `%${q}%`, tag) as MediaItem[];
  } else if (q) {
    items = db
      .prepare(
        "SELECT * FROM media WHERE is_adult = 0 AND (title LIKE ? OR description LIKE ? OR category LIKE ?) ORDER BY created_at DESC LIMIT 50"
      )
      .all(`%${q}%`, `%${q}%`, `%${q}%`) as MediaItem[];
  } else if (tag) {
    items = db
      .prepare(
        "SELECT * FROM media WHERE is_adult = 0 AND (',' || tags || ',') LIKE ('%,' || ? || ',%') ORDER BY created_at DESC LIMIT 100"
      )
      .all(tag) as MediaItem[];
  }

  function buildTagUrl(t: string) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (t) p.set("tag", t);
    return `/search${p.toString() ? `?${p.toString()}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-yt-bg">
      <Header />
      <Sidebar />
      <main className="pt-14 pb-14 lg:pl-56 lg:pb-0">
        <div className="px-3 sm:px-6 py-4 max-w-screen-2xl mx-auto">
          {/* Taggar som kategorichips */}
          {allTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
              <a
                href={buildTagUrl("")}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !tag
                    ? "bg-yt-text text-yt-bg"
                    : "bg-yt-surface border border-yt-border text-yt-muted hover:text-yt-text hover:bg-yt-hover"
                }`}
              >
                Alla
              </a>
              {allTags.map((t) => (
                <a
                  key={t}
                  href={buildTagUrl(t)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    tag === t
                      ? "bg-yt-text text-yt-bg"
                      : "bg-yt-surface border border-yt-border text-yt-muted hover:text-yt-text hover:bg-yt-hover"
                  }`}
                >
                  {t}
                </a>
              ))}
            </div>
          )}

          {q || tag ? (
            <>
              <p className="text-yt-muted text-sm mb-6">
                {items.length} resultat
                {q && <> för &quot;<span className="text-yt-text">{q}</span>&quot;</>}
                {tag && <> i kategorin <span className="text-yt-text">{tag}</span></>}
              </p>
              <MediaGrid items={items} />
            </>
          ) : (
            <p className="text-yt-muted">Skriv något i sökrutan ovan.</p>
          )}
        </div>
      </main>
    </div>
  );
}
