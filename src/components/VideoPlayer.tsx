"use client";
import { useEffect, useState } from "react";
import { MediaItem } from "@/lib/db";
import { isYouTubeUrl, extractYouTubeId, getMediaType } from "@/lib/media";

function YtdlpPlayer({ item }: { item: MediaItem }) {
  const [resolving, setResolving] = useState(true);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const resolve = () => {
    setResolving(true);
    setResolveError(null);
    setResolvedUrl(null);
    fetch(`/api/resolve-url?url=${encodeURIComponent(item.url!)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          // Bygg proxy-URL så webbläsaren aldrig träffar CDN direkt (löser CORS/Referer-problem)
          let referer = "";
          try {
            const parsed = new URL(item.url!);
            referer = `${parsed.protocol}//${parsed.hostname}/`;
          } catch { /* ogiltigt URL */ }
          const proxy = `/api/proxy-stream?url=${encodeURIComponent(data.url)}&referer=${encodeURIComponent(referer)}`;
          setResolvedUrl(proxy);
        } else {
          setResolveError(data.error || "Kunde inte hämta strömlänk");
        }
      })
      .catch(() => setResolveError("Nätverksfel vid hämtning av strömlänk"))
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
        <p className="text-yt-muted text-sm">Hämtar strömlänken...</p>
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
          Försök igen
        </button>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
      <video controls autoPlay className="w-full h-full" src={resolvedUrl!}>
        Din webbläsare stöder inte video-elementet.
      </video>
    </div>
  );
}

export default function VideoPlayer({ item }: { item: MediaItem }) {
  const mtype = getMediaType(item);

  if (mtype === "ytdlp") {
    return <YtdlpPlayer item={item} />;
  }

  if (mtype === "youtube") {
    const ytId = item.url ? extractYouTubeId(item.url) : null;
    if (!ytId) return <div className="text-yt-muted">Ogiltigt YouTube-ID</div>;
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
    return (
      <div className="w-full bg-yt-surface rounded-xl p-6">
        <p className="text-yt-muted text-sm mb-3 text-center">Ljud</p>
        <audio controls className="w-full">
          <source src={src} />
          Din webbläsare stöder inte audio-elementet.
        </audio>
      </div>
    );
  }

  // Video (lokal eller direktlänk)
  const src = mtype === "direct" ? item.url! : `/api/stream/${item.id}`;
  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
      <video
        controls
        autoPlay
        className="w-full h-full"
        src={src}
      >
        Din webbläsare stöder inte video-elementet.
      </video>
    </div>
  );
}
