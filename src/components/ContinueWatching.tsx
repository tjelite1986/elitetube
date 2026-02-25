"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MediaItem } from "@/lib/db";
import { formatDuration } from "@/lib/media";

type Entry = { item: MediaItem; seconds: number };

export default function ContinueWatching() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const PREFIX = "elitetube_pos_";
    const found: { mediaId: number; seconds: number }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const suffix = key.slice(PREFIX.length);
      const mediaId = parseInt(suffix);
      if (isNaN(mediaId) || mediaId <= 0) continue; // skip yt_* YouTube entries
      const seconds = parseFloat(localStorage.getItem(key) ?? "0");
      if (seconds > 10) found.push({ mediaId, seconds });
    }

    if (found.length === 0) return;

    const ids = found.map((f) => f.mediaId).join(",");
    fetch(`/api/media?ids=${ids}`)
      .then((r) => r.json())
      .then((data) => {
        const items = (data.items ?? []) as MediaItem[];
        const result: Entry[] = items
          .map((item) => {
            const entry = found.find((f) => f.mediaId === item.id);
            if (!entry) return null;
            // Skip if completed (>= 95% of duration)
            if (item.duration && entry.seconds >= item.duration * 0.95) return null;
            return { item, seconds: entry.seconds };
          })
          .filter((x): x is Entry => x !== null);
        setEntries(result);
      })
      .catch(() => {});
  }, []);

  if (entries.length === 0) return null;

  return (
    <div className="px-3 sm:px-6 pt-4">
      <h2 className="text-sm font-semibold text-yt-text mb-3">Continue watching</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {entries.map(({ item, seconds }) => {
          const progress = item.duration ? Math.min((seconds / item.duration) * 100, 99) : 0;
          const thumb = item.thumbnail_url || "/placeholder-thumb.svg";
          return (
            <Link key={item.id} href={`/watch/${item.id}`} className="shrink-0 w-44 group">
              <div className="relative w-full aspect-video bg-yt-surface rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb} alt={item.title} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                {item.duration && (
                  <span className="absolute bottom-5 right-1 bg-black/80 text-white text-xs px-1 rounded">
                    {formatDuration(item.duration)}
                  </span>
                )}
                {/* Red progress bar */}
                {progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div className="h-full bg-red-500" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
              <p className="text-xs text-yt-text mt-1.5 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                {item.title}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
