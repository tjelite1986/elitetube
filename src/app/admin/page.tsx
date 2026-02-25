import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import Header from "@/components/Header";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") redirect("/");

  const db = getDb();
  const mediaCount = (db.prepare("SELECT COUNT(*) as c FROM media").get() as { c: number }).c;
  const sourceCount = (db.prepare("SELECT COUNT(*) as c FROM sources").get() as { c: number }).c;
  const userCount = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
  const totalViews = (db.prepare("SELECT SUM(views) as v FROM media").get() as { v: number | null }).v || 0;

  return (
    <div className="min-h-screen bg-yt-bg">
      <Header />
      <main className="pt-14">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Admin panel</h1>
            <Link href="/" className="text-sm text-yt-muted hover:text-yt-text transition-colors">
              ← Back to home
            </Link>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Media", value: mediaCount, icon: "🎬" },
              { label: "Sources", value: sourceCount, icon: "📂" },
              { label: "Users", value: userCount, icon: "👤" },
              { label: "Views", value: totalViews, icon: "👁" },
            ].map((s) => (
              <div key={s.label} className="bg-yt-surface border border-yt-border rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold">{s.value.toLocaleString("en-US")}</div>
                <div className="text-xs text-yt-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="grid sm:grid-cols-2 gap-4">
            <AdminCard
              href="/admin/media"
              title="Manage media"
              description="Add, edit and delete media"
              icon="🎬"
            />
            <AdminCard
              href="/admin/import-playlist"
              title="Import playlist"
              description="Import all videos from a YouTube playlist at once"
              icon="▶"
            />
            <AdminCard
              href="/admin/sources"
              title="Manage sources"
              description="Configure local paths, SMB and external URLs"
              icon="📂"
            />
            <AdminCard
              href="/admin/adult-pin"
              title="Adult settings"
              description="Set or update the PIN code for 18+ content"
              icon="🔞"
            />
            <AdminCard
              href="/admin/tags"
              title="Manage adult tags"
              description="Rename or delete tags shown as categories on the 18+ page"
              icon="#"
            />
            <AdminCard
              href="/admin/stats"
              title="Statistics"
              description="Views, storage, top content and engagement overview"
              icon="📊"
            />
            <AdminCard
              href="/admin/scan"
              title="Scan library"
              description="Auto-import new video and audio files from the media directory"
              icon="🔍"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function AdminCard({ href, title, description, icon }: { href: string; title: string; description: string; icon: string }) {
  return (
    <Link
      href={href}
      className="bg-yt-surface border border-yt-border rounded-xl p-6 hover:bg-yt-hover transition-colors group"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h2 className="font-semibold text-yt-text group-hover:text-white mb-1">{title}</h2>
      <p className="text-sm text-yt-muted">{description}</p>
    </Link>
  );
}
