"use client";
import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";

type ScanResult = {
  added: number;
  skipped: number;
  files: string[];
};

export default function ScanLibraryPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");

  async function handleScan() {
    setScanning(true);
    setResult(null);
    setError("");
    const res = await fetch("/api/admin/scan-library", { method: "POST" });
    setScanning(false);
    if (res.ok) {
      setResult(await res.json());
    } else {
      const d = await res.json();
      setError(d.error || "Scan failed");
    }
  }

  return (
    <div className="min-h-screen bg-yt-bg">
      <Header />
      <main className="pt-14">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin" className="text-sm text-yt-muted hover:text-yt-text transition-colors">
              ← Admin
            </Link>
            <h1 className="text-2xl font-bold">Scan library</h1>
          </div>

          <div className="bg-yt-surface border border-yt-border rounded-xl p-6 mb-6">
            <p className="text-sm text-yt-muted mb-1">
              Scans the media directory for files not yet in the library.
            </p>
            <p className="text-xs text-yt-muted/60 mb-6">
              Supported formats: mp4, mkv, avi, mov, webm, m4v, ts, mp3, flac, aac, ogg, m4a, wav, jpg, png, gif, webp and more.
            </p>

            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 bg-white text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {scanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Scan now
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-yt-surface border border-yt-border rounded-xl p-6">
              <div className="flex gap-6 mb-4">
                <div>
                  <div className="text-2xl font-bold text-green-400">{result.added}</div>
                  <div className="text-xs text-yt-muted">new files added</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yt-muted">{result.skipped}</div>
                  <div className="text-xs text-yt-muted">already in library</div>
                </div>
              </div>

              {result.added === 0 && (
                <p className="text-sm text-yt-muted">No new files found. Library is up to date.</p>
              )}

              {result.files.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-yt-muted uppercase tracking-wider mb-2">Added files</p>
                  <ul className="space-y-1">
                    {result.files.map((f) => (
                      <li key={f} className="text-sm text-yt-text font-mono bg-yt-hover rounded px-3 py-1.5 truncate">
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 pt-4 border-t border-yt-border">
                    <Link
                      href="/admin/media"
                      className="text-sm text-white hover:text-yt-muted transition-colors"
                    >
                      Go to media manager to add thumbnails and metadata →
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
