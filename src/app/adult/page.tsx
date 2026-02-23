import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { getDb, MediaItem } from "@/lib/db";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MediaGrid from "@/components/MediaGrid";
import RecentCarousel from "@/components/RecentCarousel";
import SortFilterBar from "@/components/SortFilterBar";
import AdultPinGate from "@/components/AdultPinGate";

export const dynamic = "force-dynamic";

function buildQuery(sort: string, length: string, tag: string) {
  const order =
    sort === "views" ? "views DESC" :
    sort === "duration" ? "duration DESC NULLS LAST" :
    "created_at DESC";

  const lengthWhere =
    length === "short" ? "AND duration IS NOT NULL AND duration < 600" :
    length === "medium" ? "AND duration IS NOT NULL AND duration >= 600 AND duration < 1200" :
    length === "long" ? "AND duration IS NOT NULL AND duration >= 1200" :
    "";

  const tagWhere = tag ? "AND (',' || tags || ',') LIKE ('%,' || ? || ',%')" : "";

  return { order, lengthWhere, tagWhere };
}

function buildTagUrl(tag: string, sort: string, length: string) {
  const p = new URLSearchParams();
  if (tag) p.set("tag", tag);
  if (sort !== "newest") p.set("sort", sort);
  if (length !== "all") p.set("length", length);
  return `/adult${p.toString() ? `?${p.toString()}` : ""}`;
}

export default async function AdultPage({
  searchParams,
}: {
  searchParams: { sort?: string; length?: string; tag?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const cookieStore = cookies();
  const adultUnlocked = cookieStore.get("adult_unlocked")?.value === "1";

  const db = getDb();
  const pinRow = db.prepare("SELECT value FROM settings WHERE key = 'adult_pin_hash'").get();

  const sort = searchParams.sort || "newest";
  const length = searchParams.length || "all";
  const tag = searchParams.tag || "";
  const { order, lengthWhere, tagWhere } = buildQuery(sort, length, tag);

  let items: MediaItem[] = [];
  let recentItems: MediaItem[] = [];
  let trendingItems: MediaItem[] = [];
  let allTags: string[] = [];

  if (adultUnlocked) {
    // Hämta alla unika taggar
    const tagRows = db
      .prepare("SELECT tags FROM media WHERE is_adult = 1 AND tags IS NOT NULL AND tags != ''")
      .all() as { tags: string }[];
    const tagCounts: Record<string, number> = {};
    for (const { tags } of tagRows) {
      for (const t of tags.split(",").map((x) => x.trim()).filter(Boolean)) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
    allTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([t]) => t);

    const params = tagWhere ? [tag] : [];
    items = db
      .prepare(`SELECT * FROM media WHERE is_adult = 1 ${lengthWhere} ${tagWhere} ORDER BY ${order} LIMIT 100`)
      .all(...params) as MediaItem[];

    const noFilter = sort === "newest" && length === "all" && !tag;
    if (noFilter) {
      recentItems = db
        .prepare("SELECT * FROM media WHERE is_adult = 1 ORDER BY created_at DESC LIMIT 10")
        .all() as MediaItem[];
      trendingItems = db
        .prepare("SELECT * FROM media WHERE is_adult = 1 ORDER BY views DESC LIMIT 10")
        .all() as MediaItem[];
    }
  }

  return (
    <div className="min-h-screen bg-yt-bg">
      <Header />
      <Sidebar />
      <main className="pt-14 pb-14 lg:pl-56 lg:pb-0">
        <div className="sm:px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4 px-3 sm:px-0">
            <span className="text-2xl font-bold text-yt-text">18+</span>
            <span className="text-yt-muted text-sm">Endast vuxet innehåll</span>
          </div>

          {!pinRow ? (
            <div className="text-center py-16 text-yt-muted text-sm px-3 sm:px-0">
              Ingen PIN-kod är satt. En administratör måste konfigurera adult-PIN under Admin → Adult-inställningar.
            </div>
          ) : !adultUnlocked ? (
            <AdultPinGate />
          ) : (
            <>
              {/* Taggar som kategorichips */}
              {allTags.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 px-3 sm:px-0 scrollbar-hide mb-4">
                  <a
                    href={buildTagUrl("", sort, length)}
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
                      href={buildTagUrl(t, sort, length)}
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

              {items.length === 0 ? (
                <p className="text-yt-muted text-sm px-3 sm:px-0">Inget adult-innehåll finns ännu.</p>
              ) : (
                <>
                  {recentItems.length > 0 && <RecentCarousel items={recentItems} title="Senast tillagda" />}
                  {trendingItems.length > 0 && <RecentCarousel items={trendingItems} title="Mest sedda" />}

                  {(recentItems.length > 0 || trendingItems.length > 0) && (
                    <div className="flex items-center gap-3 px-3 sm:px-0 pt-4 pb-1">
                      <h2 className="text-sm font-semibold text-yt-text whitespace-nowrap">Alla videor</h2>
                      <div className="flex-1 h-px bg-yt-border" />
                    </div>
                  )}

                  <SortFilterBar sort={sort} length={length} basePath="/adult" />
                  <MediaGrid items={items} />
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
