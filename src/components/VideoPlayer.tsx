"use client";
import { useEffect, useState } from "react";
import { MediaItem } from "@/lib/db";
import { extractYouTubeId, getMediaType } from "@/lib/media";
import CookieExpiredBanner from "@/components/CookieExpiredBanner";
import SpeedSelector from "@/components/SpeedSelector";
import PlayerOsd from "@/components/PlayerOsd";
import { useVideoResume } from "@/hooks/useVideoResume";
import { usePlayerKeyboard } from "@/hooks/usePlayerKeyboard";

/* ── Resume chip ── */
function ResumeChip({ label }: { label: string }) {
  return (
    <div className="absolute top-3 left-3 z-10 bg-black/75 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none">
      Resumed from {label}
    </div>
  );
}

/* ── Local / direct video player ── */
function LocalVideoPlayer({ item, src }: { item: MediaItem; src: string }) {
  const { videoRef, resumedFrom } = useVideoResume(item.id);
  const { osd } = usePlayerKeyboard(videoRef);
  return (
    <div>
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        {resumedFrom && <ResumeChip label={resumedFrom} />}
        <video ref={videoRef} controls autoPlay className="w-full h-full" src={src}>
          Your browser does not support the video element.
        </video>
        <PlayerOsd text={osd} />
      </div>
      <SpeedSelector videoRef={videoRef} />
    </div>
  );
}

/* ── Audio player ── */
function AudioPlayer({ item, src }: { item: MediaItem; src: string }) {
  const { videoRef, resumedFrom } = useVideoResume(item.id);
  usePlayerKeyboard(videoRef);
  return (
    <div className="w-full bg-yt-surface rounded-xl p-6">
      {resumedFrom && (
        <p className="text-xs text-yt-muted mb-2 text-center">Resumed from {resumedFrom}</p>
      )}
      <p className="text-yt-muted text-sm mb-3 text-center">Audio</p>
      <audio ref={videoRef as React.RefObject<HTMLAudioElement>} controls className="w-full">
        <source src={src} />
        Your browser does not support the audio element.
      </audio>
      <SpeedSelector videoRef={videoRef} />
    </div>
  );
}

/* ── yt-dlp player ── */
function YtdlpPlayer({ item }: { item: MediaItem }) {
  const [resolving, setResolving] = useState(true);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [cookiesExpired, setCookiesExpired] = useState(false);
  const { videoRef, resumedFrom } = useVideoResume(item.id, !!resolvedUrl);
  const { osd } = usePlayerKeyboard(videoRef);

  const resolve = () => {
    setResolving(true);
    setResolveError(null);
    setResolvedUrl(null);
    setCookiesExpired(false);
    fetch(`/api/resolve-url?url=${encodeURIComponent(item.url!)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          let referer = "";
          try {
            const parsed = new URL(item.url!);
            referer = `${parsed.protocol}//${parsed.hostname}/`;
          } catch { /* invalid URL */ }
          const proxy = `/api/proxy-stream?url=${encodeURIComponent(data.url)}&referer=${encodeURIComponent(referer)}`;
          setResolvedUrl(proxy);
        } else if (data.error_code === "COOKIES_EXPIRED") {
          setCookiesExpired(true);
        } else {
          setResolveError(data.error || "Could not fetch stream URL");
        }
      })
      .catch(() => setResolveError("Network error while fetching stream URL"))
      .finally(() => setResolving(false));
  };

  useEffect(() => {
    resolve();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  if (resolving) {
    return (
      <div className="w-full aspect-video bg-black rounded-xl flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-yt-muted border-t-white rounded-full animate-spin" />
        <p className="text-yt-muted text-sm">Fetching stream URL...</p>
      </div>
    );
  }

  if (cookiesExpired) {
    return (
      <div className="w-full">
        <div className="w-full aspect-video bg-black rounded-xl flex items-center justify-center mb-4">
          <p className="text-yt-muted text-sm">Playback unavailable</p>
        </div>
        <CookieExpiredBanner />
      </div>
    );
  }

  if (resolveError) {
    return (
      <div className="w-full aspect-video bg-black rounded-xl flex flex-col items-center justify-center gap-3">
        <p className="text-red-400 text-sm">{resolveError}</p>
        <button
          onClick={resolve}
          className="bg-yt-surface border border-yt-border text-yt-text px-4 py-2 rounded-lg text-sm hover:bg-yt-surface2 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        {resumedFrom && <ResumeChip label={resumedFrom} />}
        <video ref={videoRef} controls autoPlay className="w-full h-full" src={resolvedUrl!}>
          Your browser does not support the video element.
        </video>
        <PlayerOsd text={osd} />
      </div>
      <SpeedSelector videoRef={videoRef} />
    </div>
  );
}

/* ── Main export ── */
export default function VideoPlayer({ item }: { item: MediaItem }) {
  const mtype = getMediaType(item);

  if (mtype === "ytdlp") return <YtdlpPlayer item={item} />;

  if (mtype === "youtube") {
    const ytId = item.url ? extractYouTubeId(item.url) : null;
    if (!ytId) return <div className="text-yt-muted">Invalid YouTube ID</div>;
    // YouTube iframe has its own speed control in the player menu
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&enablejsapi=1`}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title={item.title}
        />
      </div>
    );
  }

  if (item.type === "image") {
    const src = mtype === "direct" ? item.url! : `/api/stream/${item.id}`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={item.title} className="max-w-full rounded-xl mx-auto" />
    );
  }

  if (item.type === "audio") {
    const src = mtype === "direct" ? item.url! : `/api/stream/${item.id}`;
    return <AudioPlayer item={item} src={src} />;
  }

  const src = mtype === "direct" ? item.url! : `/api/stream/${item.id}`;
  return <LocalVideoPlayer item={item} src={src} />;
}
