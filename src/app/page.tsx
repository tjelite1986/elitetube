import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MediaGrid from "@/components/MediaGrid";
import RecentCarousel from "@/components/RecentCarousel";
import SortFilterBar from "@/components/SortFilterBar";
import ContinueWatching from "@/components/ContinueWatching";
import { MediaItem } from "@/lib/db";

export const dynamic = "force-dynamic";

function buildQuery(sort: string, length: string) {
  const order =
    sort === "views" ? "views DESC" :
    sort === "duration" ? "duration DESC NULLS LAST" :
    "created_at DESC";

  const lengthWhere =
    length === "short" ? "AND duration IS NOT NULL AND duration < 600" :
    length === "medium" ? "AND duration IS NOT NULL AND duration >= 600 AND duration < 1200" :
    length === "long" ? "AND duration IS NOT NULL AND duration >= 1200" :
    "";

  return { order, lengthWhere };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string; length?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const sort = searchParams.sort || "newest";
  const length = searchParams.length || "all";
  const { order, lengthWhere } = buildQuery(sort, length);

  const db = getDb();
  let items: MediaItem[];

  if (searchParams.category) {
    items = db
      .prepare(`SELECT * FROM media WHERE category = ? AND is_adult = 0 ${lengthWhere} ORDER BY ${order} LIMIT 50`)
      .all(searchParams.category) as MediaItem[];
  } else {
    items = db
      .prepare(`SELECT * FROM media WHERE is_adult = 0 ${lengthWhere} ORDER BY ${order} LIMIT 50`)
      .all() as MediaItem[];
  }

  const categories = db
    .prepare("SELECT DISTINCT category FROM media WHERE category IS NOT NULL AND is_adult = 0 ORDER BY category")
    .all() as { category: string }[];

  const noFilter = !searchParams.category && sort === "newest" && length === "all";

  const recentItems = noFilter
    ? (db.prepare("SELECT * FROM media WHERE is_adult = 0 ORDER BY created_at DESC LIMIT 10").all() as MediaItem[])
    : [];

  const trendingItems = noFilter
    ? (db.prepare("SELECT * FROM media WHERE is_adult = 0 ORDER BY views DESC LIMIT 10").all() as MediaItem[])
    : [];

  return (
    <div className="min-h-screen bg-yt-bg">
      <Header />
      <Sidebar />
      <main className="pt-14 pb-14 lg:pl-56 lg:pb-0">

        {/* Continue watching — client-side, reads localStorage */}
        <ContinueWatching />

        {/* Carousels — only shown without filters */}
        {recentItems.length > 0 && <RecentCarousel items={recentItems} title="Recently added" />}
        {trendingItems.length > 0 && <RecentCarousel items={trendingItems} title="Most watched" />}

        {/* Divider */}
        {(recentItems.length > 0 || trendingItems.length > 0) && (
          <div className="flex items-center gap-3 px-3 sm:px-6 pt-4 pb-1">
            <h2 className="text-sm font-semibold text-yt-text whitespace-nowrap">All videos</h2>
            <div className="flex-1 h-px bg-yt-border" />
          </div>
        )}

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-3 sm:px-6 py-3 scrollbar-hide">
            <a
              href="/"
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                !searchParams.category
                  ? "bg-yt-text text-yt-bg"
                  : "bg-yt-surface text-yt-text hover:bg-yt-hover"
              }`}
            >
              All
            </a>
            {categories.map(({ category }) => (
              <a
                key={category}
                href={`/?category=${encodeURIComponent(category)}`}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                  searchParams.category === category
                    ? "bg-yt-text text-yt-bg"
                    : "bg-yt-surface text-yt-text hover:bg-yt-hover"
                }`}
              >
                {category}
              </a>
            ))}
          </div>
        )}

        {/* Sort + length filter */}
        <SortFilterBar sort={sort} length={length} category={searchParams.category} basePath="/" />

        <div className="sm:px-6 py-2 sm:py-4 max-w-screen-2xl mx-auto">
          <MediaGrid items={items} />
        </div>
      </main>
    </div>
  );
}
