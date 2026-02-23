"use client";
import Link from "next/link";
import { PlaylistItemWithMedia } from "@/lib/db";
import { formatDuration } from "@/lib/media";

interface Props {
  items: PlaylistItemWithMedia[];
  currentIndex: number;
  playlistId: number;
}

export default function PlaylistSidebar({ items, currentIndex, playlistId }: Props) {
  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80vh]">
      {items.map((item, i) => {
        const isActive = i === currentIndex;
        const href = `/watch/${item.id}?playlist=${playlistId}&index=${i}`;
        const thumb = item.thumbnail_url || "/placeholder-thumb.svg";

        return (
          <Link
            key={item.playlist_item_id}
            href={href}
            className={`flex gap-2 p-2 rounded-lg transition-colors ${
              isActive
                ? "bg-yt-hover border border-yt-border"
                : "hover:bg-yt-hover"
            }`}
          >
            <div className="relative w-28 aspect-video bg-yt-surface rounded overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
              {item.duration && (
                <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-xs px-1 rounded">
                  {formatDuration(item.duration)}
                </span>
              )}
              {isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-white text-lg">&#9654;</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium line-clamp-2 leading-snug ${isActive ? "text-white" : "text-yt-text"}`}>
                {i + 1}. {item.title}
              </p>
              {item.category && (
                <p className="text-xs text-yt-muted mt-0.5">{item.category}</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
