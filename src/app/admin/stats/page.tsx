import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import Header from "@/components/Header";
import Link from "next/link";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MEDIA_BASE = process.env.MEDIA_PATH || "/media";

function getStorageBytes(): number {
  try {
    let total = 0;
    const entries = fs.readdirSync(MEDIA_BASE, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        try {
          total += fs.statSync(path.join(MEDIA_BASE, entry.name)).size;
        } catch { /* skip */ }
      }
    }
    return total;
  } catch {
    return 0;
  }
}

function fmtBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-yt-surface border border-yt-border rounded-xl p-4">
      <div className="text-2xl font-bold text-yt-text">{typeof value === "number" ? value.toLocaleString("sv-SE") : value}</div>
      <div className="text-xs text-yt-muted mt-0.5">{label}</div>
      {sub && <div className="text-xs text-yt-muted/60 mt-0.5">{sub}</div>}
    </div>
  );
}

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") redirect("/");

  const db = getDb();

  // Counts
  const total = (db.prepare("SELECT COUNT(*) as c FROM media").get() as { c: number }).c;
  const adultCount = (db.prepare("SELECT COUNT(*) as c FROM media WHERE is_adult = 1").get() as { c: number }).c;
  const videoCount = (db.prepare("SELECT COUNT(*) as c FROM media WHERE type = 'video'").get() as { c: number }).c;
  const audioCount = (db.prepare("SELECT COUNT(*) as c FROM media WHERE type = 'audio'").get() as { c: number }).c;
  const imageCount = (db.prepare("SELECT COUNT(*) as c FROM media WHERE type = 'image'").get() as { c: number }).c;
  const ytdlpCount = (db.prepare("SELECT COUNT(*) as c FROM media WHERE needs_ytdlp = 1").get() as { c: number }).c;
  const localCount = (db.prepare("SELECT COUNT(*) as c FROM media WHERE filename IS NOT NULL").get() as { c: number }).c;
  const noThumbCount = (db.prepare("SELECT COUNT(*) as c FROM media WHERE thumbnail_url IS NULL").get() as { c: number }).c;
  const noDurationCount = (db.prepare("SELECT COUNT(*) as c FROM media WHERE duration IS NULL AND type != 'image'").get() as { c: number }).c;

  // Views + likes
  const totalViews = (db.prepare("SELECT SUM(views) as v FROM media").get() as { v: number | null }).v ?? 0;
  const totalLikes = (db.prepare("SELECT SUM(likes) as v FROM media").get() as { v: number | null }).v ?? 0;
  const totalDislikes = (db.prepare("SELECT SUM(dislikes) as v FROM media").get() as { v: number | null }).v ?? 0;

  // Total duration of local videos (in hours)
  const totalDurSec = (db.prepare("SELECT SUM(duration) as d FROM media WHERE duration IS NOT NULL").get() as { d: number | null }).d ?? 0;
  const totalDurHours = (totalDurSec / 3600).toFixed(1);

  // Top 10 most viewed
  const topViewed = db.prepare("SELECT id, title, views, thumbnail_url FROM media ORDER BY views DESC LIMIT 10").all() as {
    id: number; title: string; views: number; thumbnail_url: string | null;
  }[];

  // Top 5 most liked
  const topLiked = db.prepare("SELECT id, title, likes, dislikes FROM media WHERE likes > 0 ORDER BY likes DESC LIMIT 5").all() as {
    id: number; title: string; likes: number; dislikes: number;
  }[];

  // Storage
  const storageBytes = getStorageBytes();

  return (
    <div className="min-h-screen bg-yt-bg">
      <Header />
      <main className="pt-14">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin" className="text-sm text-yt-muted hover:text-yt-text transition-colors">
              ← Admin
            </Link>
            <h1 className="text-2xl font-bold">Statistics</h1>
          </div>

          {/* Overview */}
          <h2 className="text-sm font-semibold text-yt-muted uppercase tracking-wider mb-3">Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard label="Total media" value={total} />
            <StatCard label="Total views" value={totalViews} />
            <StatCard label="Total duration" value={`${totalDurHours} h`} />
            <StatCard label="Storage used" value={fmtBytes(storageBytes)} sub="local files" />
          </div>

          {/* Breakdown */}
          <h2 className="text-sm font-semibold text-yt-muted uppercase tracking-wider mb-3">Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard label="Videos" value={videoCount} />
            <StatCard label="Audio" value={audioCount} />
            <StatCard label="Images" value={imageCount} />
            <StatCard label="18+ content" value={adultCount} />
            <StatCard label="Local files" value={localCount} />
            <StatCard label="yt-dlp URLs" value={ytdlpCount} />
            <StatCard label="Missing thumbnail" value={noThumbCount} />
            <StatCard label="Missing duration" value={noDurationCount} />
          </div>

          {/* Engagement */}
          <h2 className="text-sm font-semibold text-yt-muted uppercase tracking-wider mb-3">Engagement</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <StatCard label="Total likes" value={totalLikes} />
            <StatCard label="Total dislikes" value={totalDislikes} />
            <StatCard label="Like ratio" value={totalLikes + totalDislikes > 0 ? `${Math.round((totalLikes / (totalLikes + totalDislikes)) * 100)}%` : "—"} />
          </div>

          {/* Top viewed */}
          {topViewed.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-yt-muted uppercase tracking-wider mb-3">Most viewed</h2>
              <div className="bg-yt-surface border border-yt-border rounded-xl overflow-hidden mb-8">
                {topViewed.map((item, i) => (
                  <Link
                    key={item.id}
                    href={`/watch/${item.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-yt-hover transition-colors border-b border-yt-border last:border-b-0"
                  >
                    <span className="text-xs text-yt-muted w-5 shrink-0 text-right">{i + 1}.</span>
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnail_url} alt="" className="w-14 aspect-video object-cover rounded shrink-0" />
                    ) : (
                      <div className="w-14 aspect-video bg-yt-hover rounded shrink-0" />
                    )}
                    <span className="flex-1 min-w-0 text-sm text-yt-text truncate">{item.title}</span>
                    <span className="text-xs text-yt-muted shrink-0">{item.views.toLocaleString("sv-SE")} views</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Top liked */}
          {topLiked.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-yt-muted uppercase tracking-wider mb-3">Most liked</h2>
              <div className="bg-yt-surface border border-yt-border rounded-xl overflow-hidden">
                {topLiked.map((item, i) => {
                  const total = item.likes + item.dislikes;
                  const pct = total > 0 ? Math.round((item.likes / total) * 100) : 0;
                  return (
                    <Link
                      key={item.id}
                      href={`/watch/${item.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-yt-hover transition-colors border-b border-yt-border last:border-b-0"
                    >
                      <span className="text-xs text-yt-muted w-5 shrink-0 text-right">{i + 1}.</span>
                      <span className="flex-1 min-w-0 text-sm text-yt-text truncate">{item.title}</span>
                      <span className="text-xs text-green-400 shrink-0">👍 {item.likes}</span>
                      <span className="text-xs text-yt-muted shrink-0">{pct}%</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
