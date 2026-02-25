"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

type SearchResult = {
  id: string;
  title: string;
  duration: number | null;
  thumbnail: string | null;
  channel: string | null;
  view_count: number | null;
  url: string;
};

function formatDuration(secs: number | null): string {
  if (!secs) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViews(n: number | null): string {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K views`;
  return `${n} views`;
}

function YouTubeSearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQ) runSearch(initialQ);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    router.replace(`/youtube?q=${encodeURIComponent(q.trim())}`, { scroll: false });
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data.error) { setError(data.error); setResults([]); }
      else setResults(data.results ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const watchHref = (r: SearchResult) => {
    const params = new URLSearchParams({
      v: r.id,
      title: r.title,
      channel: r.channel ?? "",
      thumbnail: r.thumbnail ?? "",
    });
    return `/youtube/watch?${params}`;
  };

  return (
    <main className="pt-14 pb-14 lg:pl-56 lg:pb-0 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-600 shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.4 2.7 12 2.7 12 2.7s-4.4 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.6 12 21.6 12 21.6s4.4 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/>
            </svg>
          </span>
          <h1 className="text-xl font-bold">YouTube Search</h1>
        </div>

        {/* Search form */}
        <form onSubmit={onSubmit} className="flex gap-2 mb-8">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search YouTube..."
            className="flex-1 bg-yt-surface border border-yt-border rounded-xl px-4 py-3 text-yt-text placeholder:text-yt-muted focus:outline-none focus:border-white transition-colors"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl transition-colors shrink-0"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                Searching...
              </span>
            ) : "Search"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(r => (
              <Link key={r.id} href={watchHref(r)} className="group block bg-yt-surface border border-yt-border rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-black">
                  {r.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.thumbnail}
                      alt={r.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-yt-surface2">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-yt-muted">
                        <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.4 2.7 12 2.7 12 2.7s-4.4 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.6 12 21.6 12 21.6s4.4 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/>
                      </svg>
                    </div>
                  )}
                  {r.duration && (
                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                      {formatDuration(r.duration)}
                    </span>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 rounded-full p-3">
                      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-yt-text line-clamp-2 leading-snug mb-1">
                    {r.title}
                  </p>
                  <p className="text-xs text-yt-muted">{r.channel}</p>
                  {r.view_count ? (
                    <p className="text-xs text-yt-muted">{formatViews(r.view_count)}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {searched && !loading && !error && results.length === 0 && (
          <p className="text-yt-muted text-center py-12">No results found</p>
        )}

        {/* Initial state */}
        {!searched && !loading && (
          <p className="text-yt-muted text-center py-12 text-sm">
            Search for YouTube videos to watch them directly — no need to save them first
          </p>
        )}
      </div>
    </main>
  );
}

export default function YouTubeSearchPage() {
  return (
    <Suspense>
      <YouTubeSearchInner />
    </Suspense>
  );
}
