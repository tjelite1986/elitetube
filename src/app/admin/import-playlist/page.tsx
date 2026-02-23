"use client";
import { useState } from "react";
import Link from "next/link";

type Result = {
  imported: number;
  total: number;
  errors: string[];
};

export default function ImportPlaylistPage() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/import-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, category: category || undefined, is_adult: isAdult }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Okänt fel");
      } else {
        setResult(data);
        setUrl("");
        setCategory("");
        setIsAdult(false);
      }
    } catch {
      setError("Nätverksfel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-yt-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-yt-muted hover:text-yt-text text-sm">
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold">Importera spellista</h1>
        </div>

        <div className="bg-yt-surface border border-yt-border rounded-xl p-6 mb-6">
          <p className="text-sm text-yt-muted mb-5">
            Klistra in en spelliste-URL från YouTube, Vimeo, Rumble eller annan plattform som
            stöds av yt-dlp. Alla videos i spellistan läggs till som media automatiskt.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-yt-muted block mb-1">Spelliste-URL *</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://www.youtube.com/playlist?list=..."
                className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-yt-muted block mb-1">Kategori (gäller alla videos)</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Film, Musik, Sport..."
                className="w-full bg-yt-bg border border-yt-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm text-yt-text">
                Adult-innehåll (18+)
                <span className="ml-1 text-xs text-yt-muted">— märker alla videos som 18+</span>
              </span>
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || !url}
              className="bg-yt-red hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium self-start transition-colors"
            >
              {loading ? "Importerar — kan ta en stund..." : "Importera spellista"}
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-yt-surface border border-yt-border rounded-xl p-6">
            <h2 className="font-semibold mb-3">Resultat</h2>

            <div className="flex gap-6 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{result.imported}</div>
                <div className="text-xs text-yt-muted mt-0.5">importerade</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yt-muted">{result.total}</div>
                <div className="text-xs text-yt-muted mt-0.5">totalt hittade</div>
              </div>
              {result.errors.length > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400">{result.errors.length}</div>
                  <div className="text-xs text-yt-muted mt-0.5">fel</div>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-yt-muted mb-2">Fel:</p>
                <ul className="flex flex-col gap-1">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-400 font-mono">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              href="/admin/media"
              className="inline-block mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Visa importerade videos →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
