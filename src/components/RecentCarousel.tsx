"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MediaItem } from "@/lib/db";
import { formatDuration, getMediaType } from "@/lib/media";

function getPreviewUrl(item: MediaItem): string | null {
  const type = getMediaType(item);
  if (type === "local") return `/api/stream/${item.id}`;
  if (type === "direct") return item.url ?? null;
  return null;
}

export default function RecentCarousel({
  items,
  title = "Recently added",
}: {
  items: MediaItem[];
  title?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="px-3 sm:px-6 pt-4 pb-2">
      <h2 className="text-sm font-semibold text-yt-text mb-3 uppercase tracking-wide">
        {title}
      </h2>

      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-yt-bg/90 border border-yt-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-x-3 shadow"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4 text-yt-text" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {items.map((item) => (
            <CarouselCard key={item.id} item={item} />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-yt-bg/90 border border-yt-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-x-3 shadow"
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4 text-yt-text" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
      </div>
    </section>
  );
}

function CarouselCard({ item }: { item: MediaItem }) {
  const thumb = item.thumbnail_url || "/placeholder-thumb.svg";
  const duration = formatDuration(item.duration);
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
    <Link
      href={`/watch/${item.id}`}
      className="group shrink-0 w-44 sm:w-52"
      style={{ scrollSnapAlign: "start" }}
    >
      {/* Thumbnail + preview */}
      <div
        className="relative aspect-video bg-yt-surface rounded-lg overflow-hidden mb-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={thumb}
          alt={item.title}
          fill
          className={`object-cover transition-[filter,opacity] duration-300 ${
            active ? "opacity-0" : "group-hover:brightness-90"
          }`}
          unoptimized={thumb.startsWith("http")}
          sizes="208px"
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

        {duration && (
          <span
            className={`absolute bottom-1 right-1 bg-black/90 text-white text-xs font-medium px-1 py-0.5 rounded transition-opacity duration-300 ${
              active ? "opacity-0" : ""
            }`}
          >
            {duration}
          </span>
        )}
        {item.type !== "video" && (
          <span className="absolute top-1 left-1 bg-yt-red text-white text-xs font-bold px-1 py-0.5 rounded uppercase">
            {item.type}
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

      {/* Title */}
      <p className="text-xs font-medium text-yt-text line-clamp-2 leading-snug">
        {item.title}
      </p>
      {item.category && (
        <p className="text-xs text-yt-muted mt-0.5">{item.category}</p>
      )}
    </Link>
  );
}
