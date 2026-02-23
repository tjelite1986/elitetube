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
            <h1 className="text-2xl font-bold">Admin-panel</h1>
            <Link href="/" className="text-sm text-yt-muted hover:text-yt-text transition-colors">
              ← Tillbaka till start
            </Link>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Media", value: mediaCount, icon: "🎬" },
              { label: "Källor", value: sourceCount, icon: "📂" },
              { label: "Användare", value: userCount, icon: "👤" },
              { label: "Visningar", value: totalViews, icon: "👁" },
            ].map((s) => (
              <div key={s.label} className="bg-yt-surface border border-yt-border rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold">{s.value.toLocaleString("sv-SE")}</div>
                <div className="text-xs text-yt-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Snabblänkar */}
          <div className="grid sm:grid-cols-2 gap-4">
            <AdminCard
              href="/admin/media"
              title="Hantera media"
              description="Lägg till, redigera och ta bort media"
              icon="🎬"
            />
            <AdminCard
              href="/admin/import-playlist"
              title="Importera spellista"
              description="Importera alla videos från en YouTube-spellista på en gång"
              icon="▶"
            />
            <AdminCard
              href="/admin/sources"
              title="Hantera källor"
              description="Konfigurera lokala sökvägar, SMB och externa URL:er"
              icon="📂"
            />
            <AdminCard
              href="/admin/adult-pin"
              title="Adult-inställningar"
              description="Sätt eller uppdatera PIN-koden för 18+-innehåll"
              icon="🔞"
            />
            <AdminCard
              href="/admin/tags"
              title="Hantera adult-taggar"
              description="Byt namn eller ta bort taggar som visas som kategorier på 18+-sidan"
              icon="#"
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
