"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { PlaylistItemWithMedia } from "@/lib/db";
import { formatDuration } from "@/lib/media";

interface Props {
  items: PlaylistItemWithMedia[];
  currentItemId: number; // playlist_item_id of the currently playing item
  playlistId: number;
}

export default function PlaylistSidebar({ items, currentItemId, playlistId }: Props) {
  const [localItems, setLocalItems] = useState(items);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIndex = useRef<number | null>(null);

  function onDragStart(e: React.DragEvent, index: number) {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIndex !== index) setOverIndex(index);
  }

  function onDragEnd() {
    setOverIndex(null);
    dragIndex.current = null;
  }

  function onDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    setOverIndex(null);
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === dropIndex) return;

    const newItems = [...localItems];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(dropIndex, 0, moved);
    setLocalItems(newItems);

    // Persist new order
    const order = newItems.map((item) => item.playlist_item_id);
    fetch(`/api/playlists/${playlistId}/items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    }).catch(() => {
      setLocalItems(localItems); // revert on network failure
    });
  }

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[80vh]">
      {localItems.map((item, i) => {
        const isActive = item.playlist_item_id === currentItemId;
        const isDragTarget = overIndex === i && dragIndex.current !== null && dragIndex.current !== i;
        const href = `/watch/${item.id}?playlist=${playlistId}&index=${i}`;
        const thumb = item.thumbnail_url || "/placeholder-thumb.svg";

        return (
          <div
            key={item.playlist_item_id}
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDragOver={(e) => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            onDrop={(e) => onDrop(e, i)}
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors group select-none ${
              isActive
                ? "bg-yt-hover border border-yt-border"
                : "hover:bg-yt-hover"
            } ${isDragTarget ? "ring-1 ring-blue-500 ring-inset bg-blue-900/10" : ""}`}
          >
            {/* Drag handle */}
            <div
              className="shrink-0 cursor-grab active:cursor-grabbing text-yt-muted opacity-0 group-hover:opacity-50 transition-opacity"
              title="Drag to reorder"
            >
              <svg viewBox="0 0 16 24" className="w-2.5 h-4 fill-current">
                <circle cx="4" cy="4" r="2" />
                <circle cx="12" cy="4" r="2" />
                <circle cx="4" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="4" cy="20" r="2" />
                <circle cx="12" cy="20" r="2" />
              </svg>
            </div>

            {/* Clickable link area */}
            <Link href={href} className="flex gap-2 flex-1 min-w-0">
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
          </div>
        );
      })}
    </div>
  );
}
