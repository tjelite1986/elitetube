"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { PlaylistWithCount } from "@/lib/db";

type Props = {
  playlist: PlaylistWithCount;
  thumbnailUrl?: string;
  previewUrl?: string;
};

export default function PlaylistCard({ playlist, thumbnailUrl, previewUrl }: Props) {
  const date = new Date(playlist.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

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
    <Link
      href={`/playlists/${playlist.id}`}
      className="block bg-yt-surface border border-yt-border rounded-xl p-4 hover:bg-yt-hover transition-colors group"
    >
      {/* Thumbnail + preview */}
      <div
        className="relative w-full aspect-video bg-yt-bg rounded-lg mb-3 overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={playlist.name}
            className={`w-full h-full object-cover transition-[filter,opacity] duration-300 ${
              active ? "opacity-0" : "group-hover:brightness-90"
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-yt-muted">
            &#9654;
          </div>
        )}

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

        {/* Video count badge */}
        <span
          className={`absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded transition-opacity duration-300 ${
            active ? "opacity-0" : ""
          }`}
        >
          {playlist.item_count} videos
        </span>

        {previewUrl && (
          <span
            className={`absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-white transition-opacity duration-300 ${
              active ? "opacity-80 animate-pulse" : "opacity-0"
            }`}
          />
        )}
      </div>

      <h3 className="text-sm font-semibold text-yt-text group-hover:text-white line-clamp-1">
        {playlist.name}
      </h3>
      {playlist.description && (
        <p className="text-xs text-yt-muted mt-0.5 line-clamp-1">{playlist.description}</p>
      )}
      <p className="text-xs text-yt-muted mt-1">{date}</p>
    </Link>
  );
}
