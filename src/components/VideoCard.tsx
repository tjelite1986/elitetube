"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MediaItem } from "@/lib/db";
import { formatDuration, formatViews, getMediaType } from "@/lib/media";

function getPreviewUrl(item: MediaItem): string | null {
  const type = getMediaType(item);
  if (type === "local") return `/api/stream/${item.id}`;
  if (type === "direct") return item.url ?? null;
  return null; // youtube / ytdlp → no preview
}

export default function VideoCard({ item }: { item: MediaItem }) {
  const thumb = item.thumbnail_url || "/placeholder-thumb.svg";
  const duration = formatDuration(item.duration);
  const views = formatViews(item.views);
  const ago = timeAgo(item.created_at);
  const initial = item.title[0]?.toUpperCase() || "?";
  const previewUrl = getPreviewUrl(item);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(false);

  function handleMouseEnter() {
    if (!previewUrl) return;
    timerRef.current = setTimeout(() => {
      setActive(true);
      videoRef.current?.play().catch(() => {});
    }, 400);
  }

  function handleMouseLeave() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setActive(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <Link href={`/watch/${item.id}`} className="group block">
      {/* Thumbnail + preview */}
      <div
        className="relative aspect-video bg-yt-surface overflow-hidden rounded-none sm:rounded-xl"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Thumbnail */}
        <Image
          src={thumb}
          alt={item.title}
          fill
          className={`object-cover transition-[filter,opacity] duration-300 ${
            active ? "opacity-0" : "group-hover:brightness-90"
          }`}
          unoptimized={thumb.startsWith("http")}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />

        {/* Hover-preview video */}
        {previewUrl && (
          <video
            ref={videoRef}
            src={previewUrl}
            muted
            loop
            playsInline
            preload="none"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              active ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        )}

        {/* Duration badge — hidden during preview */}
        {duration && (
          <span
            className={`absolute bottom-1.5 right-1.5 bg-black/90 text-white text-xs font-medium px-1.5 py-0.5 rounded transition-opacity duration-300 ${
              active ? "opacity-0" : ""
            }`}
          >
            {duration}
          </span>
        )}

        {item.type !== "video" && (
          <span className="absolute top-1.5 left-1.5 bg-yt-red text-white text-xs font-bold px-1.5 py-0.5 rounded uppercase">
            {item.type}
          </span>
        )}
        {item.is_adult === 1 && (
          <span className="absolute top-1.5 right-1.5 bg-red-700 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            18+
          </span>
        )}

        {/* Preview indicator — small pulsing dot while buffering */}
        {previewUrl && (
          <span
            className={`absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-white transition-opacity duration-300 ${
              active ? "opacity-80 animate-pulse" : "opacity-0"
            }`}
          />
        )}
      </div>

      {/* Info-rad */}
      <div className="flex gap-3 px-3 sm:px-0 pt-3 pb-1">
        <div className="w-9 h-9 rounded-full bg-yt-surface2 shrink-0 flex items-center justify-center text-sm font-bold text-yt-muted select-none mt-0.5">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yt-text line-clamp-2 leading-snug mb-1">
            {item.title}
          </p>
          <p className="text-xs text-yt-muted leading-snug">
            {item.category && <span>{item.category} &bull; </span>}
            {views} &bull; {ago}
          </p>
        </div>
      </div>
    </Link>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} mo ago`;
  return `${Math.floor(mo / 12)} yr ago`;
}
