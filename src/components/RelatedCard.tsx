"use client";

import { MediaItem } from "@/lib/db";
import { formatDuration, formatViews, getMediaType } from "@/lib/media";
import { usePreview } from "@/hooks/usePreview";

function getPreviewUrl(item: MediaItem): string | null {
  const type = getMediaType(item);
  if (type === "local") return `/api/stream/${item.id}`;
  if (type === "direct") return item.url ?? null;
  return null;
}

export default function RelatedCard({ item }: { item: MediaItem }) {
  const thumb = item.thumbnail_url || "/placeholder-thumb.svg";
  const previewUrl = getPreviewUrl(item);
  const { videoRef, active, thumbHandlers } = usePreview(previewUrl);

  return (
    <a href={`/watch/${item.id}`} className="flex gap-2 group">
      {/* Thumbnail + preview */}
      <div
        className="relative w-40 aspect-video bg-yt-surface rounded-lg overflow-hidden shrink-0"
        {...thumbHandlers}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={item.title}
          className={`w-full h-full object-cover transition-[filter,opacity] duration-300 ${
            active ? "opacity-0" : "group-hover:brightness-90"
          }`}
        />

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

        {item.duration && (
          <span
            className={`absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded transition-opacity duration-300 ${
              active ? "opacity-0" : ""
            }`}
          >
            {formatDuration(item.duration)}
          </span>
        )}

        {previewUrl && (
          <span
            className={`absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-white transition-opacity duration-300 ${
              active ? "opacity-80 animate-pulse" : "opacity-0"
            }`}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-yt-text line-clamp-2 leading-snug group-hover:text-white">
          {item.title}
        </p>
        {item.category && <p className="text-xs text-yt-muted mt-0.5">{item.category}</p>}
        <p className="text-xs text-yt-muted">{formatViews(item.views)}</p>
      </div>
    </a>
  );
}
