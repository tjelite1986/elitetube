"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import CookieExpiredBanner from "@/components/CookieExpiredBanner";
import SpeedSelector from "@/components/SpeedSelector";
import { useVideoResume } from "@/hooks/useVideoResume";

function YouTubeWatchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams.get("v");
  const title = searchParams.get("title") ?? "YouTube Video";
  const channel = searchParams.get("channel") ?? "";
  const thumbnail = searchParams.get("thumbnail") ?? "";

  const [resolving, setResolving] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cookiesExpired, setCookiesExpired] = useState(false);
  const { videoRef, resumedFrom } = useVideoResume(`yt_${videoId}`, !!streamUrl);

  const resolve = () => {
    if (!videoId) return;
    setResolving(true);
    setError(null);
    setStreamUrl(null);
    setCookiesExpired(false);
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    fetch(`/api/resolve-url?url=${encodeURIComponent(ytUrl)}`)
      .then(r => r.json())
      .then(data => {
        if (data.url) {
          const proxy = `/api/proxy-stream?url=${encodeURIComponent(data.url)}&referer=${encodeURIComponent("https://www.youtube.com/")}`;
          setStreamUrl(proxy);
        } else if (data.error_code === "COOKIES_EXPIRED") {
          setCookiesExpired(true);
        } else {
          setError(data.error || "Could not fetch stream URL");
        }
      })
      .catch(() => setError("Network error while fetching stream URL"))
      .finally(() => setResolving(false));
  };

  useEffect(() => {
    if (!videoId) { router.replace("/youtube"); return; }
    resolve();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  if (!videoId) return null;

  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <main className="pt-14 pb-14 lg:pl-56 lg:pb-0 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Back link */}
        <div className="mb-4">
          <Link href="/youtube" className="text-sm text-yt-muted hover:text-yt-text transition-colors">
            ← Back to search
          </Link>
        </div>

        {/* Player */}
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-4">
          {resolving && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              {thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnail} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-20" />
              )}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-yt-muted border-t-white rounded-full animate-spin" />
                <p className="text-yt-muted text-sm">Fetching stream...</p>
              </div>
            </div>
          )}
          {!resolving && (cookiesExpired || error) && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-4">
              <p className="text-yt-muted text-sm">Playback unavailable</p>
              <a
                href={ytUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-yt-muted hover:text-yt-text transition-colors"
              >
                Open on YouTube instead
              </a>
            </div>
          )}
          {!resolving && streamUrl && (
            <>
              {resumedFrom && (
                <div className="absolute top-3 left-3 z-10 bg-black/75 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none">
                  Resumed from {resumedFrom}
                </div>
              )}
              <video
                ref={videoRef}
                controls
                autoPlay
                className="w-full h-full"
                src={streamUrl}
              >
                Your browser does not support the video element.
              </video>
            </>
          )}
        </div>

        {/* Speed selector */}
        {streamUrl && <SpeedSelector videoRef={videoRef} />}

        {/* Cookie expired banner */}
        {cookiesExpired && <div className="mb-4"><CookieExpiredBanner /></div>}

        {/* Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-yt-text leading-snug">{title}</h1>
            {channel && <p className="text-sm text-yt-muted mt-1">{channel}</p>}
          </div>
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 bg-yt-surface border border-yt-border text-yt-muted hover:text-yt-text px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500">
              <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.4 2.7 12 2.7 12 2.7s-4.4 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.6 12 21.6 12 21.6s4.4 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/>
            </svg>
            Open on YouTube
          </a>
        </div>
      </div>
    </main>
  );
}

export default function YouTubeWatchPage() {
  return (
    <Suspense>
      <YouTubeWatchInner />
    </Suspense>
  );
}
